import { Link } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { useEffect, useState } from "react"

function Checkout() {
  const { cart, totalHarga } = useCart()

  const [customer, setCustomer] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState("")
  const [loadingAddress, setLoadingAddress] = useState(true)

  const [metodePengiriman, setMetodePengiriman] = useState("reguler")

  useEffect(() => {
    const savedCustomer = sessionStorage.getItem("tokita-customer")

    if (!savedCustomer) {
      setLoadingAddress(false)
      return
    }

    const customerData = JSON.parse(savedCustomer)

    setCustomer(customerData)

    const fetchAddresses = async () => {
      try {
        // Ambil alamat customer
        const response = await fetch(
          `http://localhost:5000/api/customers/${customerData.id}/addresses`
        )

        if (!response.ok) {
          throw new Error("Gagal mengambil alamat")
        }

        const data = await response.json()

        setAddresses(data)

        if (data.length > 0) {
          setSelectedAddress(String(data[0].id))
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingAddress(false)
      }
    }

    fetchAddresses()
  }, [])

  const biayaOngkir = {
    reguler: 15000,
    express: 25000,
    sameDay: 35000,
  }

  const ongkir = biayaOngkir[metodePengiriman]

  const totalPembayaran = totalHarga + ongkir

  const handleCheckout = async () => {
    if (!customer) {
      alert("Silakan masuk terlebih dahulu")
      return
    }

    if (!selectedAddress) {
      alert("Silakan pilih alamat pengiriman")
      return
    }

    try {
      /*
       * Sinkronisasi cart React ke database
       *
       * Cart di database akan dibuat ulang dari isi
       * cart yang ada di React.
       */

      // Ambil item cart yang sudah ada di database
      const existingCartResponse = await fetch(
        `http://localhost:5000/api/customers/${customer.id}/cart/items`
      )

      if (!existingCartResponse.ok) {
        throw new Error("Gagal mengambil cart database")
      }

      const existingCartItems =
        await existingCartResponse.json()

      // Hapus semua item cart lama
      for (const item of existingCartItems) {
        const deleteResponse = await fetch(
          `http://localhost:5000/api/customers/${customer.id}/cart/items/${item.id}`,
          {
            method: "DELETE",
          }
        )

        if (!deleteResponse.ok) {
          throw new Error("Gagal membersihkan cart lama")
        }
      }

      // Masukkan isi cart React ke database
      for (const item of cart) {
        const cartItemResponse = await fetch(
          `http://localhost:5000/api/customers/${customer.id}/cart/items`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              product_id: item.id,
              jumlah: item.jumlah,
            }),
          }
        )

        if (!cartItemResponse.ok) {
          const errorData = await cartItemResponse.json()

          throw new Error(
            errorData.message ||
            "Gagal menyimpan cart"
          )
        }
      }

      // Buat order
      const response = await fetch(
        `http://localhost:5000/api/customers/${customer.id}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address_id: Number(selectedAddress),
            metode_pengiriman: metodePengiriman,
            ongkir: ongkir,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        alert(data.message || "Gagal membuat pesanan")
        return
      }

      console.log("Order berhasil dibuat:", data)

      // Buat pembayaran Midtrans
      const paymentResponse = await fetch(
        `http://localhost:5000/api/orders/${data.order.id}/payment/snap`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      const paymentData = await paymentResponse.json()

      if (!paymentResponse.ok) {
        alert(
          paymentData.message ||
          "Gagal membuat pembayaran"
        )
        return
      }

      // Arahkan ke Midtrans Sandbox
      window.location.href = paymentData.redirect_url
    } catch (error) {
      console.error(error)

      alert(
        error.message ||
        "Tidak dapat terhubung ke server"
      )
    }
  }

  if (cart.length === 0) {
    return (
      <main className="page-container">
        <h1>Checkout</h1>

        <p>Keranjang kamu masih kosong.</p>

        <Link to="/">
          Kembali ke Beranda
        </Link>
      </main>
    )
  }

  return (
    <main className="page-container">
      <h1>Checkout</h1>

      <section className="checkout-section">
        <h2>Informasi Pengiriman</h2>

        {loadingAddress ? (
          <p>Memuat alamat...</p>
        ) : addresses.length === 0 ? (
          <div className="checkout-no-address">
            <p>Belum ada alamat pengiriman.</p>

            <Link to="/alamat" className="address-manage-button">
              Tambah Alamat
            </Link>
          </div>
        ) : (
          <div>
            <div className="address-options">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className="address-option"
                >
                  <input
                    type="radio"
                    name="alamat"
                    value={address.id}
                    checked={
                      selectedAddress === String(address.id)
                    }
                    onChange={(e) =>
                      setSelectedAddress(e.target.value)
                    }
                  />

                  <div>
                    <strong>
                      {address.nama_penerima}
                    </strong>

                    <p>{address.no_telepon}</p>

                    <p>{address.alamat_lengkap}</p>

                    <p>
                      {address.kota}, {address.provinsi}{" "}
                      {address.kode_pos}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="address-manage">
              <Link
                to="/alamat"
                className="address-manage-button"
              >
                Kelola / Tambah Alamat
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="checkout-section">
        <h2>Metode Pengiriman</h2>

        <div className="shipping-options">
          <label>
            <input
              type="radio"
              name="pengiriman"
              value="reguler"
              checked={
                metodePengiriman === "reguler"
              }
              onChange={(e) =>
                setMetodePengiriman(
                  e.target.value
                )
              }
            />

            <span>
              <strong>Reguler</strong>
              <br />
              2–4 hari
              <br />
              Rp15.000
            </span>
          </label>

          <label>
            <input
              type="radio"
              name="pengiriman"
              value="express"
              checked={
                metodePengiriman === "express"
              }
              onChange={(e) =>
                setMetodePengiriman(
                  e.target.value
                )
              }
            />

            <span>
              <strong>Express</strong>
              <br />
              1–2 hari
              <br />
              Rp25.000
            </span>
          </label>

          <label>
            <input
              type="radio"
              name="pengiriman"
              value="sameDay"
              checked={
                metodePengiriman === "sameDay"
              }
              onChange={(e) =>
                setMetodePengiriman(
                  e.target.value
                )
              }
            />

            <span>
              <strong>Same Day</strong>
              <br />
              Hari yang sama
              <br />
              Rp35.000
            </span>
          </label>
        </div>
      </section>

      <section className="checkout-section">
        <h2>Ringkasan Pesanan</h2>

        {cart.map((item) => (
          <div
            key={item.id}
            className="checkout-item"
          >
            <span>
              {item.nama} × {item.jumlah}
            </span>

            <span>
              Rp
              {(
                item.harga * item.jumlah
              ).toLocaleString("id-ID")}
            </span>
          </div>
        ))}

        <div className="checkout-summary">
          <div>
            <span>Subtotal</span>

            <strong>
              Rp{totalHarga.toLocaleString("id-ID")}
            </strong>
          </div>

          <div>
            <span>Ongkir</span>

            <strong>
              Rp{ongkir.toLocaleString("id-ID")}
            </strong>
          </div>

          <div className="checkout-total">
            <span>Total Pembayaran</span>

            <strong>
              Rp
              {totalPembayaran.toLocaleString(
                "id-ID"
              )}
            </strong>
          </div>
        </div>

        <button
          className="primary-button"
          onClick={handleCheckout}
        >
          Lanjut ke Pembayaran
        </button>
      </section>
    </main>
  )
}

export default Checkout
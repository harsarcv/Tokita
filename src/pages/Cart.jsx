import { Link, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { useCart } from "../context/CartContext"

function Cart() {
  const navigate = useNavigate()

  useEffect(() => {
    const customer = sessionStorage.getItem("tokita-customer")

    if (!customer) {
      navigate("/login")
    }
  }, [navigate])
  const {
    cart,
    updateQuantity,
    removeFromCart,
    totalHarga,
  } = useCart()

  const formatHarga = (harga) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(harga)
  }

  if (cart.length === 0) {
    return (
      <main className="cart-page">
        <h1>Keranjang</h1>
        <p>Keranjang kamu masih kosong.</p>

        <Link to="/" className="product-button">
          Mulai Belanja
        </Link>
      </main>
    )
  }

  return (
    <main className="cart-page">
      <h1>Keranjang</h1>

      <div className="cart-content">
        <section className="cart-items">
          {cart.map((item) => (
            <article className="cart-item" key={item.id}>
              <img
                src={item.gambar}
                alt={item.nama}
              />

              <div className="cart-item-info">
                <span>{item.kategori}</span>
                <h3>{item.nama}</h3>

                <p>
                  {formatHarga(item.harga)}
                </p>

                <div className="quantity-control">
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.id,
                        item.jumlah - 1
                      )
                    }
                  >
                    −
                  </button>

                  <span>{item.jumlah}</span>

                  <button
                    onClick={() =>
                      updateQuantity(
                        item.id,
                        item.jumlah + 1
                      )
                    }
                  >
                    +
                  </button>
                </div>

                <button
                  className="remove-button"
                  onClick={() =>
                    removeFromCart(item.id)
                  }
                >
                  Hapus
                </button>
              </div>

              <strong>
                {formatHarga(
                  item.harga * item.jumlah
                )}
              </strong>
            </article>
          ))}
        </section>

        <aside className="cart-summary">
          <h2>Ringkasan Belanja</h2>

          <div>
            <span>Subtotal</span>
            <strong>{formatHarga(totalHarga)}</strong>
          </div>

          <Link
            to="/checkout"
            className="checkout-button"
          >
            Lanjut ke Checkout
          </Link>
        </aside>
      </div>
    </main>
  )
}

export default Cart
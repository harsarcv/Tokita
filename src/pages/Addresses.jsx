import { useEffect, useState } from "react"

function Addresses() {
  const [alamat, setAlamat] = useState([])
  const [form, setForm] = useState({
    namaPenerima: "",
    telepon: "",
    alamatLengkap: "",
    kota: "",
    provinsi: "",
    kodePos: "",
  })

  const customer = JSON.parse(
    sessionStorage.getItem("tokita-customer")
  )

  useEffect(() => {
    if (!customer) return

    const fetchAddresses = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/customers/${customer.id}/addresses`
        )

        const data = await response.json()

        if (response.ok) {
          setAlamat(data)
        }
      } catch (error) {
        console.error("Gagal mengambil alamat:", error)
      }
    }

    fetchAddresses()
  }, [customer?.id])

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!customer) {
      alert("Silakan masuk terlebih dahulu")
      return
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/customers/${customer.id}/addresses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nama_penerima: form.namaPenerima,
            no_telepon: form.telepon,
            alamat_lengkap: form.alamatLengkap,
            kota: form.kota,
            provinsi: form.provinsi,
            kode_pos: form.kodePos,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        alert(data.message || "Gagal menyimpan alamat")
        return
      }

      setAlamat((current) => [
        ...current,
        data.address,
      ])

      setForm({
        namaPenerima: "",
        telepon: "",
        alamatLengkap: "",
        kota: "",
        provinsi: "",
        kodePos: "",
      })

      alert("Alamat berhasil disimpan")
    } catch (error) {
      console.error(error)
      alert("Tidak dapat terhubung ke server")
    }
  }

  const handleDelete = async (addressId) => {
    const yakin = window.confirm(
      "Yakin ingin menghapus alamat ini?"
    )

    if (!yakin) return

    try {
      const response = await fetch(
        `http://localhost:5000/api/customers/${customer.id}/addresses/${addressId}`,
        {
          method: "DELETE",
        }
      )

      const data = await response.json()

      if (!response.ok) {
        alert(data.message || "Gagal menghapus alamat")
        return
      }

      setAlamat((current) =>
        current.filter((item) => item.id !== addressId)
      )

      alert("Alamat berhasil dihapus")
    } catch (error) {
      console.error(error)
      alert("Tidak dapat terhubung ke server")
    }
  }

  return (
    <main className="address-page">
      <h1>Alamat Saya</h1>

      <form
        className="address-form"
        onSubmit={handleSubmit}
      >
        <div className="form-group">
          <label htmlFor="namaPenerima">
            Nama Penerima
          </label>

          <input
            id="namaPenerima"
            name="namaPenerima"
            value={form.namaPenerima}
            onChange={handleChange}
            placeholder="Nama penerima"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="telepon">
            Nomor Telepon
          </label>

          <input
            id="telepon"
            name="telepon"
            type="tel"
            value={form.telepon}
            onChange={handleChange}
            placeholder="Nomor telepon"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="alamatLengkap">
            Alamat Lengkap
          </label>

          <textarea
            id="alamatLengkap"
            name="alamatLengkap"
            value={form.alamatLengkap}
            onChange={handleChange}
            placeholder="Jalan, nomor rumah, dan detail alamat"
            rows="4"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="kota">Kota</label>

          <input
            id="kota"
            name="kota"
            value={form.kota}
            onChange={handleChange}
            placeholder="Kota"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="provinsi">
            Provinsi
          </label>

          <input
            id="provinsi"
            name="provinsi"
            value={form.provinsi}
            onChange={handleChange}
            placeholder="Provinsi"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="kodePos">
            Kode Pos
          </label>

          <input
            id="kodePos"
            name="kodePos"
            value={form.kodePos}
            onChange={handleChange}
            placeholder="Kode pos"
            required
          />
        </div>

        <button
          type="submit"
          className="auth-button"
        >
          Tambah Alamat
        </button>
      </form>

      <section className="address-list">
        {alamat.length === 0 ? (
          <p>Belum ada alamat tersimpan.</p>
        ) : (
          alamat.map((item) => (
            <article
              className="address-card"
              key={item.id}
            >
              <h3>{item.nama_penerima}</h3>

              <p>{item.no_telepon}</p>

              <p>{item.alamat_lengkap}</p>

              <p>
                {item.kota}, {item.provinsi}{" "}
                {item.kode_pos}
              </p>

              <button
                type="button"
                onClick={() => handleDelete(item.id)}
              >
                Hapus Alamat
              </button>
            </article>
          ))
        )}
      </section>
    </main>
  )
}

export default Addresses
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    konfirmasiPassword: "",
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.id]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (form.password !== form.konfirmasiPassword) {
      setError("Konfirmasi kata sandi tidak cocok.")
      return
    }

    try {
      setLoading(true)

      const response = await fetch(
        "http://localhost:5000/api/customers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nama: form.nama,
            email: form.email,
            password: form.password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Gagal membuat akun.")
      }

      // Buat cart untuk customer baru
      const cartResponse = await fetch(
        `http://localhost:5000/api/customers/${data.customer.id}/cart`,
        {
          method: "POST",
        }
      )

      const cartData = await cartResponse.json()

      if (!cartResponse.ok) {
        throw new Error(
          cartData.message || "Akun berhasil dibuat, tetapi cart gagal dibuat."
        )
      }

      alert("Akun berhasil dibuat. Silakan masuk.")

      navigate("/masuk")

    } catch (error) {
      console.error(error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Buat Akun</h1>
          <span>Daftar untuk mulai berbelanja di Tokita.</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nama">Nama Lengkap</label>
            <input
              id="nama"
              type="text"
              placeholder="Masukkan nama lengkap"
              value={form.nama}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Masukkan email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Kata Sandi</label>
            <input
              id="password"
              type="password"
              placeholder="Masukkan kata sandi"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="konfirmasiPassword">
              Konfirmasi Kata Sandi
            </label>
            <input
              id="konfirmasiPassword"
              type="password"
              placeholder="Ulangi kata sandi"
              value={form.konfirmasiPassword}
              onChange={handleChange}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Mendaftarkan..." : "Daftar"}
          </button>
        </form>

        <p className="auth-footer">
          Sudah punya akun?{" "}
          <Link to="/masuk">Masuk sekarang</Link>
        </p>
      </div>
    </main>
  )
}

export default Register
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    try {
      const response = await fetch(
        "http://localhost:5000/api/customers/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Login gagal")
        return
      }

      sessionStorage.setItem(
        "tokita-customer",
        JSON.stringify(data.customer)
      )

      window.dispatchEvent(new Event("customer-login"))

      navigate("/")

      if (data.customer.role === "admin") {
        navigate("/admin")
      } else {
        navigate("/")
      }

    } catch (error) {
      console.error(error)
      setError("Tidak dapat terhubung ke server")
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">

          <h1>Masuk ke Akun</h1>

          <span>
            Masuk untuk melanjutkan belanja di Tokita.
          </span>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Kata Sandi</label>

            <input
              id="password"
              type="password"
              placeholder="Masukkan kata sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-button"
          >
            Masuk
          </button>
        </form>

        <p className="auth-footer">
          Belum punya akun?{" "}
          <Link to="/daftar">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </main>
  )
}

export default Login
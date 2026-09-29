import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { useCart } from "../context/CartContext"

function Header() {
  const { cart } = useCart()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState(null)

  useEffect(() => {
    const loadCustomer = () => {
      const savedCustomer = sessionStorage.getItem("tokita-customer")

      if (savedCustomer) {
        setCustomer(JSON.parse(savedCustomer))
      } else {
        setCustomer(null)
      }
    }

    loadCustomer()

    window.addEventListener("customer-login", loadCustomer)
    window.addEventListener("customer-logout", loadCustomer)

    return () => {
      window.removeEventListener("customer-login", loadCustomer)
      window.removeEventListener("customer-logout", loadCustomer)
    }
  }, [])

  const totalItem = customer
    ? cart.reduce(
        (total, item) => total + item.jumlah,
        0
      )
    : 0

  const handleLogout = () => {
    sessionStorage.removeItem("tokita-customer")

    window.dispatchEvent(new Event("customer-logout"))

    navigate("/")
  }

  return (
    <header className="header">
      <Link
        to={customer?.role === "admin" ? "/admin" : "/"}
        className="header-logo"
      >
        {customer?.role === "admin" ? "Tokita Admin" : "Tokita"}
      </Link>

      <nav className="header-nav">

        {/* ========================= */}
        {/* ADMIN */}
        {/* ========================= */}

        {customer?.role === "admin" ? (
          <>
            <Link to="/admin">
              Dashboard
            </Link>

            <Link to="/admin/produk">
              Produk
            </Link>

            <Link to="/admin/pesanan">
              Pesanan
            </Link>

            <span>
              Halo, {customer.nama}
            </span>

            <button
              type="button"
              onClick={handleLogout}
            >
              Keluar
            </button>
          </>
        ) : customer ? (

          /* ========================= */
          /* CUSTOMER LOGIN */
          /* ========================= */

          <>
            <Link to="/">
              Beranda
            </Link>

            <Link to="/pesanan">
              Pesanan Saya
            </Link>

            <button
              type="button"
              className="cart-link"
              onClick={() => {
                navigate("/keranjang")
              }}
            >
              Keranjang

              {totalItem > 0 && (
                <span className="cart-badge">
                  {totalItem}
                </span>
              )}
            </button>

            <span>
              Halo, {customer.nama}
            </span>

            <button
              type="button"
              onClick={handleLogout}
            >
              Keluar
            </button>
          </>
        ) : (

          /* ========================= */
          /* GUEST */
          /* ========================= */

          <>
            <Link to="/">
              Beranda
            </Link>

            <Link to="/masuk">
              Masuk
            </Link>
          </>
        )}

      </nav>
    </header>
  )
}

export default Header
import { Routes, Route, Navigate } from "react-router-dom"
import Header from "./components/Header"
import ProductGrid from "./components/ProductGrid"
import ProductDetail from "./pages/ProductDetail"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Cart from "./pages/Cart"
import Checkout from "./pages/Checkout"
import Addresses from "./pages/Addresses"
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminProducts from "./pages/admin/AdminProducts"
import AdminOrders from "./pages/admin/AdminOrders"
import PaymentFinish from "./pages/PaymentFinish"

function AdminRoute({ children }) {
  const customerData = sessionStorage.getItem("tokita-customer")

  if (!customerData) {
    return <Navigate to="/masuk" replace />
  }

  const customer = JSON.parse(customerData)

  if (customer.role !== "admin") {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route
          path="/"
          element={
            <main>
              <section className="catalog-header">
                <h1>Biji Kopi Pilihan</h1>
                <span>
                  Temukan biji kopi pilihan dari berbagai daerah untuk menemani setiap seduhan Anda.
                </span>
              </section>

              <ProductGrid />
            </main>
          }
        />

        <Route
          path="/produk/:id"
          element={<ProductDetail />}
        />

        <Route
          path="/masuk"
          element={<Login />}
        />

        <Route
          path="/daftar"
          element={<Register />}
        />
        <Route
          path="/keranjang"
          element={<Cart />}
        />
        <Route
          path="/checkout"
          element={<Checkout />}
        />
        <Route
          path="/alamat"
          element={<Addresses />}
        />
        <Route
          path="/pesanan"
          element={<Orders />}
        />
        <Route
          path="/pesanan/:id"
          element={<OrderDetail />}
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/produk"
          element={
            <AdminRoute>
              <AdminProducts />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/pesanan"
          element={
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          }
        />
        <Route
            path="/payment-finish"
            element={<PaymentFinish />}
        />
      </Routes>
    </>
  )
}

export default App
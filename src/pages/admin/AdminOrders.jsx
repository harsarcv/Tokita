import { useEffect, useState } from "react"

function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/orders")
      .then((response) => response.json())
      .then((data) => {
        setOrders(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error(error)
        setLoading(false)
      })
  }, [])

  const handleStatusChange = async (orderId, status) => {
    try {
      setUpdatingId(orderId)

      const response = await fetch(
        `http://localhost:5000/api/admin/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status_order: status,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        alert(data.message || "Gagal mengubah status")
        return
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status_order: status,
              }
            : order
        )
      )
    } catch (error) {
      console.error(error)
      alert("Terjadi kesalahan saat mengubah status")
    } finally {
      setUpdatingId(null)
    }
  }

    const filteredOrders = orders.filter((order) => {
    const keyword = search.toLowerCase()

    const cocokSearch =
        order.nomor_order.toLowerCase().includes(keyword) ||
        String(order.customer_id).includes(keyword)

    const cocokStatus =
        statusFilter === "" ||
        order.status_order === statusFilter

    return cocokSearch && cocokStatus
    })

  return (
    <main className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>Pesanan</h1>
            <p>Kelola pesanan customer Tokita.</p>
          </div>
        </div>

<div className="admin-section">

  <div className="admin-section-header">
    <div>
      <h2>Daftar Pesanan</h2>
      <p>Kelola pesanan customer Tokita.</p>
    </div>

    <div className="admin-order-filters">

      <input
        type="text"
        className="admin-search"
        placeholder="Cari nomor order / customer..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <select
        className="admin-status-filter"
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
      >
        <option value="">Semua Status</option>
        <option value="menunggu_pembayaran">
          Menunggu Pembayaran
        </option>
        <option value="diproses">
          Diproses
        </option>
        <option value="dikirim">
          Dikirim
        </option>
        <option value="selesai">
          Selesai
        </option>
        <option value="gagal">
          Gagal
        </option>
      </select>

    </div>
  </div>

          {loading ? (
            <p>Memuat pesanan...</p>
          ) : filteredOrders.length === 0 ? (
            <p>Belum ada pesanan.</p>
          ) : (
            <div className="admin-order-list">
              {filteredOrders.map((order) => (
                <div className="admin-order-row" key={order.id}>
                  <div>
                    <strong>{order.nomor_order}</strong>
                    <span>Customer #{order.customer_id}</span>
                  </div>

                  <div>
                    <span>Total</span>
                    <strong>
                      Rp{" "}
                      {Number(order.total_pembayaran).toLocaleString("id-ID")}
                    </strong>
                  </div>

                  <div>
                    <span>Pengiriman</span>
                    <strong>{order.metode_pengiriman}</strong>
                  </div>

                  <div>
                    <span>Status</span>

                    <select
                      value={order.status_order}
                      onChange={(event) =>
                        handleStatusChange(order.id, event.target.value)
                      }
                      disabled={updatingId === order.id}
                      className="admin-status-select"
                    >
                      <option value="menunggu_pembayaran">
                        Menunggu Pembayaran
                      </option>
                      <option value="diproses">Diproses</option>
                      <option value="dikirim">Dikirim</option>
                      <option value="selesai">Selesai</option>
                      <option value="gagal">Gagal</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default AdminOrders
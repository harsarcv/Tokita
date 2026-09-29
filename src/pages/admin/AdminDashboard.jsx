import { useEffect, useState } from "react"

function AdminDashboard() {
  const [dashboard, setDashboard] = useState({
    total_produk: 0,
    total_stok: 0,
    total_pesanan: 0,
    pesanan_terbaru: [],
  })

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/admin/dashboard"
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || "Gagal mengambil data dashboard"
          )
        }

        setDashboard(data)
      } catch (error) {
        console.error("DASHBOARD ERROR:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const filteredOrders = dashboard.pesanan_terbaru.filter((order) => {
    const keyword = search.toLowerCase()

    return (
      order.nomor_order.toLowerCase().includes(keyword) ||
      order.status_order.toLowerCase().includes(keyword)
    )
  })

  return (
    <main className="admin-page">
      <div className="admin-container">

        <div className="admin-header">
          <div>

            <h1>Dashboard</h1>

            <p>
              Kelola produk, stok, dan pesanan Tokita.
            </p>
          </div>
        </div>

        <div className="admin-layout">

          <section className="admin-content">

            {/* STATISTIK */}
            <div className="admin-stats">

              <div className="admin-stat-card">
                <span>Total Produk</span>

                <strong>
                  {loading ? "..." : dashboard.total_produk}
                </strong>
              </div>

              <div className="admin-stat-card">
                <span>Total Stok</span>

                <strong>
                  {loading ? "..." : dashboard.total_stok}
                </strong>
              </div>

              <div className="admin-stat-card">
                <span>Total Pesanan</span>

                <strong>
                  {loading ? "..." : dashboard.total_pesanan}
                </strong>
              </div>

            </div>

            {/* PESANAN TERBARU */}
            <div className="admin-section">

              <div className="admin-section-header">
                <div>
                  <h2>Pesanan Terbaru</h2>

                  <p>
                    Daftar pesanan terbaru Tokita.
                  </p>
                </div>

                <input
                  type="text"
                  className="admin-search"
                  placeholder="Cari pesanan..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>

              {loading ? (
                <p>Memuat pesanan...</p>
              ) : filteredOrders.length === 0 ? (
                <p>
                  {search
                    ? "Pesanan tidak ditemukan."
                    : "Belum ada data pesanan."}
                </p>
              ) : (
                <div className="admin-order-list">

                  {filteredOrders.map((order) => (
                    <div
                      className="admin-order-row"
                      key={order.id}
                    >

                      <div>
                        <span>Order</span>

                        <strong>
                          {order.nomor_order}
                        </strong>
                      </div>

                      <div>
                        <span>Total</span>

                        <strong>
                          Rp{" "}
                          {Number(
                            order.total_pembayaran
                          ).toLocaleString("id-ID")}
                        </strong>
                      </div>

                      <div>
                        <span>Status</span>

                        <strong>
                          {order.status_order}
                        </strong>
                      </div>

                    </div>
                  ))}

                </div>
              )}

            </div>

          </section>

        </div>

      </div>
    </main>
  )
}

export default AdminDashboard
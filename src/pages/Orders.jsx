import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const customer = JSON.parse(sessionStorage.getItem("tokita-customer"));

  useEffect(() => {
    if (!customer) {
      navigate("/masuk");
      return;
    }

    fetch(`http://localhost:5000/api/customers/${customer.id}/orders`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Gagal mengambil data pesanan");
        }

        return response.json();
      })
      .then((data) => {
        setOrders(data);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [customer, navigate]);

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTanggal = (date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "menunggu_pembayaran":
        return "Menunggu Pembayaran";

      case "diproses":
        return "Diproses";

      case "dikirim":
        return "Dikirim";

      case "expired":
        return "Expired";

      case "gagal":
        return "Gagal";

      case "selesai":
        return "Selesai";

      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="container">
          <h1>Pesanan Saya</h1>
          <p>Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <div className="orders-header">
          <h1>Pesanan Saya</h1>
          <p>Lihat riwayat pesanan dan status pembelian Anda.</p>
        </div>

        {orders.length === 0 ? (
          <div className="orders-empty">
            <h2>Belum ada pesanan</h2>
            <p>
              Anda belum melakukan pembelian. Yuk, cari biji kopi favorit Anda.
            </p>

            <Link to="/" className="btn-primary">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div className="order-card" key={order.id}>
                <div className="order-card-header">
                  <div>
                    <span className="order-label">Nomor Pesanan</span>
                    <h3>{order.nomor_order}</h3>
                  </div>

                  <span
                    className={`order-status status-${order.status_order}`}
                  >
                    {getStatusLabel(order.status_order)}
                  </span>
                </div>

                <div className="order-card-info">
                  <div>
                    <span>Tanggal</span>
                    <strong>{formatTanggal(order.created_at)}</strong>
                  </div>

                  <div>
                    <span>Pengiriman</span>
                    <strong>{order.metode_pengiriman}</strong>
                  </div>

                  <div>
                    <span>Total</span>
                    <strong>{formatRupiah(order.total_pembayaran)}</strong>
                  </div>
                </div>

                <div className="order-card-footer">
                  <Link
                    to={`/pesanan/${order.id}`}
                    className="btn-secondary"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;
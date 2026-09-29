import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const customer = JSON.parse(sessionStorage.getItem("tokita-customer"));

    useEffect(() => {
        if (!customer) {
            navigate("/masuk");
            return;
        }

        fetch(`http://localhost:5000/api/customers/${customer.id}/orders/${id}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Gagal mengambil detail pesanan");
                }

                return response.json();
            })
            .then((data) => {
                setOrder({
                    ...data.order,
                    items: data.items,
                });
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [customer, navigate, id]);

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
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "menunggu_pembayaran":
                return "Menunggu Pembayaran";

            case "diproses":
                return "Diproses";

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
                    <p>Memuat detail pesanan...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="orders-page">
                <div className="container">
                    <h1>Pesanan tidak ditemukan</h1>

                    <Link to="/pesanan" className="btn-secondary">
                        Kembali ke Pesanan
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <div className="container">

                <div className="orders-header">
                    <h1>Detail Pesanan</h1>
                    <p>{order.nomor_order}</p>
                </div>

                <div className="order-detail-card">
                    <div className="order-detail-header">
                        <div>
                            <span className="order-label">Status Pesanan</span>

                            <span
                                className={`order-status status-${order.status_order}`}
                            >
                                {getStatusLabel(order.status_order)}
                            </span>
                        </div>

                        <div className="order-detail-date">
                            <span className="order-label">Tanggal Pesanan</span>
                            <strong>{formatTanggal(order.created_at)}</strong>
                        </div>
                    </div>

                    <div className="order-detail-section">
                        <h2>Produk</h2>

                        <div className="order-products">
                            {order.items?.map((item) => (
                                <div className="order-product" key={item.id}>
                                    <div>
                                        <strong>{item.nama_produk}</strong>

                                        <span>
                                            {item.jumlah} × {formatRupiah(item.harga)}
                                        </span>
                                    </div>

                                    <strong>
                                        {formatRupiah(item.jumlah * item.harga)}
                                    </strong>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="order-detail-section">
                        <h2>Alamat Pengiriman</h2>

                        <div className="address-detail">
                            <strong>{order.nama_penerima}</strong>

                            <p>{order.no_telepon}</p>

                            <p>{order.alamat_lengkap}</p>

                            <p>
                                {order.kota}, {order.provinsi} {order.kode_pos}
                            </p>
                        </div>
                    </div>

                    <div className="order-detail-section">
                        <h2>Ringkasan Pembayaran</h2>

                        <div className="payment-summary">
                            <div>
                                <span>Subtotal</span>
                                <strong>{formatRupiah(order.subtotal)}</strong>
                            </div>

                            <div>
                                <span>Ongkir</span>
                                <strong>{formatRupiah(order.ongkir)}</strong>
                            </div>

                            <div className="payment-total">
                                <span>Total Pembayaran</span>
                                <strong>
                                    {formatRupiah(order.total_pembayaran)}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <div className="order-detail-section">
                        <h2>Pengiriman</h2>

                        <p>{order.metode_pengiriman}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderDetail;
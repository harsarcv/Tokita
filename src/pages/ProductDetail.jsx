import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useCart } from "../context/CartContext"

function ProductDetail() {
    const { id } = useParams()
    const { addToCart } = useCart()
    const navigate = useNavigate()

    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(
                    `http://localhost:5000/api/products/${id}`
                )

                if (!response.ok) {
                    throw new Error("Produk tidak ditemukan")
                }

                const data = await response.json()
                setProduct(data)
            } catch (error) {
                console.error(error)
                setError("Produk tidak ditemukan")
            } finally {
                setLoading(false)
            }
        }

        fetchProduct()
    }, [id])

    const formatHarga = (harga) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(harga)
    }

    if (loading) {
        return (
            <main className="product-not-found">
                <p>Memuat produk...</p>
            </main>
        )
    }

    if (error || !product) {
        return (
            <main className="product-not-found">
                <h2>Produk tidak ditemukan</h2>
                <Link to="/">Kembali ke katalog</Link>
            </main>
        )
    }

    return (
        <main className="product-detail">

            <div className="product-detail-content">
                <div className="product-detail-image">
                    <img src={product.gambar} alt={product.nama} />
                </div>

                <div className="product-detail-info">
                    <span className="product-category">
                        {product.kategori}
                    </span>

                    <h1>{product.nama}</h1>

                    <p className="product-detail-price">
                        {formatHarga(product.harga)}
                    </p>

                    <p className="product-detail-stock">
                        Stok tersedia: {product.stok}
                    </p>

                    <p className="product-description">
                        {product.deskripsi}
                    </p>

                    <button
                        className="product-button"
                        onClick={() => {
                            const customer = sessionStorage.getItem("tokita-customer")

                            if (!customer) {
                                navigate("/masuk")
                                return
                            }

                            addToCart(product)
                        }}
                    >
                        Tambah ke Keranjang
                    </button>
                </div>
            </div>
        </main>
    )
}

export default ProductDetail
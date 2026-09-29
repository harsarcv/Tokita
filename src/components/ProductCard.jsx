import { Link, useNavigate } from "react-router-dom"
import { useCart } from "../context/CartContext"

function ProductCard({ product }) {
  const { addToCart } = useCart()
  const navigate = useNavigate()

  const formatHarga = (harga) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(harga)
  }

  return (
    <article className="product-card">
      <img
        src={product.gambar}
        alt={product.nama}
        className="product-image"
      />

      <div className="product-info">
        <span className="product-category">
          {product.kategori}
        </span>

        <h3>{product.nama}</h3>

        <p className="product-price">
          {formatHarga(product.harga)}
        </p>

        <p className="product-stock">
          Stok: {product.stok}
        </p>

        <div className="product-actions">
          <Link
            to={`/produk/${product.id}`}
            className="product-button"
          >
            Lihat Produk
          </Link>

          <button
            className="product-cart-button"
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
    </article>
  )
}

export default ProductCard
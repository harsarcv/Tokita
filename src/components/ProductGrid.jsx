import { useEffect, useState } from "react"
import ProductCard from "./ProductCard"

function ProductGrid() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Semua")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/products"
        )

        if (!response.ok) {
          throw new Error("Gagal mengambil produk")
        }

        const data = await response.json()

        setProducts(data)
      } catch (error) {
        console.error(error)
        setError("Gagal mengambil data produk")
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const categories = [
    "Semua",
    ...new Set(products.map((product) => product.kategori)),
  ]

  const filteredProducts = products.filter((product) => {
    const cocokSearch = product.nama
      .toLowerCase()
      .includes(search.toLowerCase())

    const cocokCategory =
      category === "Semua" ||
      product.kategori === category

    return cocokSearch && cocokCategory
  })

  if (loading) {
    return <p>Memuat produk...</p>
  }

  if (error) {
    return <p>{error}</p>
  }

  return (
    <div>
      <div className="product-filter">
        <input
          type="text"
          placeholder="Cari biji kopi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="product-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))
        ) : (
          <p>Produk tidak ditemukan.</p>
        )}
      </div>
    </div>
  )
}

export default ProductGrid
import { useEffect, useState } from "react"

function AdminProducts() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [search, setSearch] = useState("")
    const [uploadingImage, setUploadingImage] = useState(false)
    const [imagePreview, setImagePreview] = useState("")

    const [form, setForm] = useState({
        nama: "",
        kategori: "",
        harga: "",
        stok: "",
        gambar: "",
        deskripsi: "",
    })

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/products"
                )

                const data = await response.json()

                if (response.ok) {
                    setProducts(data)
                }
            } catch (error) {
                console.error("Gagal mengambil produk:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [])

    const handleFormChange = (e) => {
        const { name, value } = e.target

        setForm((current) => ({
            ...current,
            [name]: value,
        }))
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]

        if (!file) return

        const previewUrl = URL.createObjectURL(file)
        setImagePreview(previewUrl)

        const formData = new FormData()
        formData.append("gambar", file)

        try {
            setUploadingImage(true)

            const response = await fetch(
                "http://localhost:5000/api/upload",
                {
                    method: "POST",
                    body: formData,
                }
            )

            const data = await response.json()

            if (!response.ok) {
                alert(data.message || "Gagal mengupload gambar")
                setImagePreview("")
                return
            }

            setForm((current) => ({
                ...current,
                gambar: data.url,
            }))
        } catch (error) {
            console.error("Gagal upload gambar:", error)
            alert("Tidak dapat mengupload gambar")
            setImagePreview("")
        } finally {
            setUploadingImage(false)
        }
    }

    const handleEdit = (product) => {
        setEditingProduct(product)
        setShowForm(true)

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }

    const handleSaveProduct = async () => {
        try {
            const url = editingProduct
                ? `http://localhost:5000/api/products/${editingProduct.id}`
                : "http://localhost:5000/api/products"

            const method = editingProduct ? "PUT" : "POST"

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            })

            const data = await response.json()

            if (!response.ok) {
                alert(data.message || "Gagal menyimpan produk")
                return
            }

            if (editingProduct) {
                setProducts((current) =>
                    current.map((product) =>
                        product.id === editingProduct.id
                            ? {
                                ...product,
                                nama: form.nama,
                                kategori: form.kategori,
                                harga: form.harga,
                                stok: form.stok,
                                gambar: form.gambar,
                                deskripsi: form.deskripsi,
                            }
                            : product
                    )
                )
            } else {
                const newProduct = {
                    ...data.product,
                    kategori: form.kategori,
                }

                setProducts((current) => [
                    ...current,
                    newProduct,
                ])
            }

            setShowForm(false)
            setEditingProduct(null)

            setForm({
                nama: "",
                kategori: "",
                harga: "",
                stok: "",
                gambar: "",
                deskripsi: "",
            })

            alert(
                editingProduct
                    ? "Produk berhasil diperbarui"
                    : "Produk berhasil ditambahkan"
            )
        } catch (error) {
            console.error("Gagal menyimpan produk:", error)
            alert("Tidak dapat terhubung ke server")
        }
    }

    const filteredProducts = products.filter((product) => {
        const keyword = search.toLowerCase()

        return (
            product.nama.toLowerCase().includes(keyword) ||
            product.kategori.toLowerCase().includes(keyword)
        )
    })

    return (
        <main className="admin-page">
            <div className="admin-container">

                {/* HEADER */}
                <div className="admin-header">
                    <div>
                        <h1>Produk</h1>
                        <p>Kelola produk dan stok Tokita.</p>
                    </div>

                    <button
                        className="admin-add-button"
                        onClick={() => {
                            setEditingProduct(null)

                            setForm({
                                nama: "",
                                kategori: "",
                                harga: "",
                                stok: "",
                                gambar: "",
                                deskripsi: "",
                            })

                            setImagePreview("")
                            setShowForm(true)
                        }}
                    >
                        + Tambah Produk
                    </button>
                </div>

                {/* FORM TAMBAH PRODUK */}
                {showForm && (
                    <div className="admin-section admin-product-form">
                        <div className="admin-form-header">
                            <div>
                                <h2>
                                    {editingProduct ? "Edit Produk" : "Tambah Produk"}
                                </h2>
                                <p>Masukkan informasi produk baru.</p>
                            </div>

                            <button
                                type="button"
                                className="admin-form-close"
                                onClick={() => {
                                    setShowForm(false)
                                    setEditingProduct(null)

                                    setForm({
                                        nama: "",
                                        kategori: "",
                                        harga: "",
                                        stok: "",
                                        gambar: "",
                                        deskripsi: "",
                                    })
                                    setImagePreview("")
                                }}
                            >
                                Batal
                            </button>
                        </div>

                        <div className="admin-form-grid">

                            {/* Nama */}
                            <div className="admin-form-group">
                                <label>Nama Produk</label>

                                <input
                                    type="text"
                                    name="nama"
                                    value={form.nama}
                                    onChange={handleFormChange}
                                    placeholder="Contoh: Gayo Arabica 200g"
                                />
                            </div>

                            {/* Kategori */}
                            <div className="admin-form-group">
                                <label>Kategori</label>

                                <input
                                    type="text"
                                    name="kategori"
                                    value={form.kategori}
                                    onChange={handleFormChange}
                                    placeholder="Contoh: Arabika"
                                />
                            </div>

                            {/* Harga */}
                            <div className="admin-form-group">
                                <label>Harga</label>

                                <input
                                    type="number"
                                    name="harga"
                                    value={form.harga}
                                    onChange={handleFormChange}
                                    placeholder="65000"
                                />
                            </div>

                            {/* Stok */}
                            <div className="admin-form-group">
                                <label>Stok</label>

                                <input
                                    type="number"
                                    name="stok"
                                    value={form.stok}
                                    onChange={handleFormChange}
                                    placeholder="20"
                                />
                            </div>

                            {/* Gambar */}
                            <div className="admin-form-group admin-form-full">
                                <label>Gambar Produk</label>

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploadingImage}
                                />

                                {uploadingImage && (
                                    <p>Uploading gambar...</p>
                                )}

                                {imagePreview && (
                                    <div style={{ marginTop: "12px" }}>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            style={{
                                                width: "180px",
                                                height: "180px",
                                                objectFit: "cover",
                                                borderRadius: "12px",
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Deskripsi */}
                            <div className="admin-form-group admin-form-full">
                                <label>Deskripsi</label>

                                <textarea
                                    name="deskripsi"
                                    value={form.deskripsi}
                                    onChange={handleFormChange}
                                    rows="4"
                                    placeholder="Deskripsi produk..."
                                ></textarea>
                            </div>

                        </div>

                        <button
                            type="button"
                            className="admin-save-button"
                            onClick={handleSaveProduct}
                        >
                            {editingProduct
                                ? "Simpan Perubahan"
                                : "Simpan Produk"}
                        </button>
                    </div>
                )}

                {/* DAFTAR PRODUK */}
                <div className="admin-section">

                    <div className="admin-section-header">
                        <div>
                            <h2>Daftar Produk</h2>
                            <p>Kelola produk dan stok Tokita.</p>
                        </div>

                        <input
                            type="text"
                            className="admin-search"
                            placeholder="Cari produk..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    {loading ? (
                        <p>Memuat produk...</p>
                    ) : filteredProducts.length === 0 ? (
                        <p>Belum ada produk.</p>
                    ) : (
                        <div className="admin-product-list">
                            {filteredProducts.map((product) => (
                                <div
                                    className="admin-product-row"
                                    key={product.id}
                                >
                                    <img
                                        src={product.gambar}
                                        alt={product.nama}
                                        className="admin-product-image"
                                    />

                                    <div className="admin-product-info">
                                        <strong>{product.nama}</strong>

                                        <span>
                                            {product.kategori}
                                        </span>
                                    </div>

                                    <div className="admin-product-price">
                                        Rp{" "}
                                        {Number(product.harga).toLocaleString(
                                            "id-ID"
                                        )}
                                    </div>

                                    <div className="admin-product-stock">
                                        Stok: <strong>{product.stok}</strong>
                                    </div>

                                    <div className="admin-product-actions">
                                        <button
                                            onClick={() => {
                                                handleEdit(product)

                                                setForm({
                                                    nama: product.nama,
                                                    kategori: product.kategori,
                                                    harga: product.harga,
                                                    stok: product.stok,
                                                    gambar: product.gambar,
                                                    deskripsi: product.deskripsi
                                                })
                                                setImagePreview(product.gambar || "")
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const yakin = window.confirm(
                                                    `Yakin ingin menghapus produk "${product.nama}"?`
                                                )

                                                if (!yakin) return

                                                try {
                                                    const response = await fetch(
                                                        `http://localhost:5000/api/products/${product.id}`,
                                                        {
                                                            method: "DELETE",
                                                        }
                                                    )

                                                    const data = await response.json()

                                                    if (!response.ok) {
                                                        alert(data.message || "Gagal menghapus produk")
                                                        return
                                                    }

                                                    setProducts((current) =>
                                                        current.filter((item) => item.id !== product.id)
                                                    )

                                                    alert("Produk berhasil dihapus")
                                                } catch (error) {
                                                    console.error("Gagal menghapus produk:", error)
                                                    alert("Tidak dapat terhubung ke server")
                                                }
                                            }}
                                        >
                                            Hapus
                                        </button>
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

export default AdminProducts
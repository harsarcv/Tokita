import express from "express"
import cors from "cors"
import pg from "pg"
import dotenv from "dotenv"
import midtransClient from "midtrans-client"
import crypto from "crypto"
import multer from "multer"

dotenv.config()

const { Pool } = pg

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },

  filename: (req, file, cb) => {
    const namaFile = `${Date.now()}-${file.originalname}`
    cb(null, namaFile)
  },
})

const upload = multer({ storage })

app.use("/uploads", express.static("uploads"))

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "tokita",
  password: "8884710",
  port: 5432,
})

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
})

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        products.id,
        products.nama,
        products.harga,
        products.stok,
        products.deskripsi,
        products.gambar,
        categories.nama AS kategori
      FROM products
      JOIN categories
        ON products.category_id = categories.id
      ORDER BY products.id
    `)

    res.json(result.rows)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal mengambil data produk",
    })
  }
})

app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `
      SELECT
        products.id,
        products.nama,
        products.harga,
        products.stok,
        products.deskripsi,
        products.gambar,
        categories.nama AS kategori
      FROM products
      JOIN categories
        ON products.category_id = categories.id
      WHERE products.id = $1
      `,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Produk tidak ditemukan",
      })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal mengambil detail produk",
    })
  }
})

app.post("/api/customers", async (req, res) => {
  try {
    const {
      nama,
      email,
      password,
      no_telepon,
    } = req.body

    if (!nama || !email || !password) {
      return res.status(400).json({
        message: "Nama, email, dan password wajib diisi",
      })
    }

    const existingCustomer = await pool.query(
      "SELECT id FROM customers WHERE email = $1",
      [email]
    )

    if (existingCustomer.rows.length > 0) {
      return res.status(409).json({
        message: "Email sudah terdaftar",
      })
    }

    const result = await pool.query(
      `
      INSERT INTO customers
        (nama, email, password, no_telepon)
      VALUES
        ($1, $2, $3, $4)
      RETURNING id, nama, email, no_telepon, created_at
      `,
      [nama, email, password, no_telepon || null]
    )

    res.status(201).json({
      message: "Customer berhasil dibuat",
      customer: result.rows[0],
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal membuat customer",
    })
  }
})

app.get("/api/customers/:id", async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `
      SELECT
        id,
        nama,
        email,
        no_telepon,
        created_at
      FROM customers
      WHERE id = $1
      `,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Customer tidak ditemukan",
      })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal mengambil data customer",
    })
  }
})

app.get("/api/customers/:id/addresses", async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `
      SELECT
        id,
        customer_id,
        nama_penerima,
        no_telepon,
        alamat_lengkap,
        kota,
        provinsi,
        kode_pos
      FROM addresses
      WHERE customer_id = $1
      ORDER BY id
      `,
      [id]
    )

    res.json(result.rows)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal mengambil alamat customer",
    })
  }
})

app.post("/api/customers/:id/addresses", async (req, res) => {
  try {
    const { id } = req.params

    const {
      nama_penerima,
      no_telepon,
      alamat_lengkap,
      kota,
      provinsi,
      kode_pos,
    } = req.body

    if (
      !nama_penerima ||
      !no_telepon ||
      !alamat_lengkap ||
      !kota ||
      !provinsi ||
      !kode_pos
    ) {
      return res.status(400).json({
        message: "Semua data alamat wajib diisi",
      })
    }

    const customer = await pool.query(
      "SELECT id FROM customers WHERE id = $1",
      [id]
    )

    if (customer.rows.length === 0) {
      return res.status(404).json({
        message: "Customer tidak ditemukan",
      })
    }

    const result = await pool.query(
      `
      INSERT INTO addresses
        (
          customer_id,
          nama_penerima,
          no_telepon,
          alamat_lengkap,
          kota,
          provinsi,
          kode_pos
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        id,
        nama_penerima,
        no_telepon,
        alamat_lengkap,
        kota,
        provinsi,
        kode_pos,
      ]
    )

    res.status(201).json({
      message: "Alamat berhasil ditambahkan",
      address: result.rows[0],
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal menambahkan alamat",
    })
  }
})

app.delete("/api/customers/:id/addresses/:addressId", async (req, res) => {
  try {
    const { id, addressId } = req.params;

    const result = await pool.query(
      `
      DELETE FROM addresses
      WHERE id = $1
      AND customer_id = $2
      RETURNING *
      `,
      [addressId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Alamat tidak ditemukan",
      });
    }

    res.json({
      message: "Alamat berhasil dihapus",
      address: result.rows[0],
    });
  } catch (error) {
    console.error("DELETE ADDRESS ERROR:", error);

    res.status(500).json({
      message: "Gagal menghapus alamat",
    });
  }
});

app.get("/api/customers/:id/cart", async (req, res) => {
  try {
    const { id } = req.params

    const cart = await pool.query(
      `
      SELECT id, customer_id, created_at, updated_at
      FROM carts
      WHERE customer_id = $1
      `,
      [id]
    )

    if (cart.rows.length === 0) {
      return res.status(404).json({
        message: "Cart customer belum tersedia",
      })
    }

    res.json(cart.rows[0])
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal mengambil cart customer",
    })
  }
})

app.post("/api/customers/:id/cart", async (req, res) => {
  try {
    const { id } = req.params

    const customer = await pool.query(
      "SELECT id FROM customers WHERE id = $1",
      [id]
    )

    if (customer.rows.length === 0) {
      return res.status(404).json({
        message: "Customer tidak ditemukan",
      })
    }

    const existingCart = await pool.query(
      "SELECT id FROM carts WHERE customer_id = $1",
      [id]
    )

    if (existingCart.rows.length > 0) {
      return res.status(200).json({
        message: "Cart customer sudah tersedia",
        cart: existingCart.rows[0],
      })
    }

    const result = await pool.query(
      `
      INSERT INTO carts (customer_id)
      VALUES ($1)
      RETURNING *
      `,
      [id]
    )

    res.status(201).json({
      message: "Cart berhasil dibuat",
      cart: result.rows[0],
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal membuat cart",
    })
  }
})

app.post("/api/customers/:id/cart/items", async (req, res) => {
  try {
    const { id } = req.params
    const { product_id, jumlah } = req.body

    if (!product_id || !jumlah || jumlah < 1) {
      return res.status(400).json({
        message: "Product dan jumlah wajib diisi",
      })
    }

    const cart = await pool.query(
      "SELECT id FROM carts WHERE customer_id = $1",
      [id]
    )

    if (cart.rows.length === 0) {
      return res.status(404).json({
        message: "Cart customer belum tersedia",
      })
    }

    const product = await pool.query(
      `
      SELECT id, nama, harga, stok
      FROM products
      WHERE id = $1
      `,
      [product_id]
    )

    if (product.rows.length === 0) {
      return res.status(404).json({
        message: "Produk tidak ditemukan",
      })
    }

    if (jumlah > product.rows[0].stok) {
      return res.status(400).json({
        message: "Jumlah melebihi stok produk",
      })
    }

    const existingItem = await pool.query(
      `
      SELECT id, jumlah
      FROM cart_items
      WHERE cart_id = $1
        AND product_id = $2
      `,
      [cart.rows[0].id, product_id]
    )

    if (existingItem.rows.length > 0) {
      const jumlahBaru = existingItem.rows[0].jumlah + jumlah

      if (jumlahBaru > product.rows[0].stok) {
        return res.status(400).json({
          message: "Jumlah cart melebihi stok produk",
        })
      }

      const result = await pool.query(
        `
        UPDATE cart_items
        SET jumlah = $1
        WHERE id = $2
        RETURNING *
        `,
        [jumlahBaru, existingItem.rows[0].id]
      )

      return res.json({
        message: "Jumlah produk di cart berhasil diperbarui",
        item: result.rows[0],
      })
    }

    const result = await pool.query(
      `
      INSERT INTO cart_items
        (cart_id, product_id, jumlah)
      VALUES
        ($1, $2, $3)
      RETURNING *
      `,
      [cart.rows[0].id, product_id, jumlah]
    )

    res.status(201).json({
      message: "Produk berhasil ditambahkan ke cart",
      item: result.rows[0],
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal menambahkan produk ke cart",
    })
  }
})

app.get("/api/customers/:id/cart/items", async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `
      SELECT
        cart_items.id,
        cart_items.cart_id,
        cart_items.product_id,
        products.nama,
        products.harga,
        products.gambar,
        products.stok,
        cart_items.jumlah,
        (products.harga * cart_items.jumlah) AS subtotal
      FROM cart_items
      JOIN carts
        ON cart_items.cart_id = carts.id
      JOIN products
        ON cart_items.product_id = products.id
      WHERE carts.customer_id = $1
      ORDER BY cart_items.id
      `,
      [id]
    )

    res.json(result.rows)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal mengambil item cart",
    })
  }
})

app.put("/api/customers/:id/cart/items/:itemId", async (req, res) => {
  try {
    const { id, itemId } = req.params
    const { jumlah } = req.body

    if (!jumlah || jumlah < 1) {
      return res.status(400).json({
        message: "Jumlah harus lebih dari 0",
      })
    }

    const item = await pool.query(
      `
      SELECT
        cart_items.id,
        cart_items.jumlah,
        products.stok
      FROM cart_items
      JOIN carts
        ON cart_items.cart_id = carts.id
      JOIN products
        ON cart_items.product_id = products.id
      WHERE cart_items.id = $1
        AND carts.customer_id = $2
      `,
      [itemId, id]
    )

    if (item.rows.length === 0) {
      return res.status(404).json({
        message: "Item cart tidak ditemukan",
      })
    }

    if (jumlah > item.rows[0].stok) {
      return res.status(400).json({
        message: "Jumlah melebihi stok produk",
      })
    }

    const result = await pool.query(
      `
      UPDATE cart_items
      SET jumlah = $1
      WHERE id = $2
      RETURNING *
      `,
      [jumlah, itemId]
    )

    res.json({
      message: "Jumlah produk berhasil diperbarui",
      item: result.rows[0],
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal memperbarui jumlah produk",
    })
  }
})

app.delete("/api/customers/:id/cart/items/:itemId", async (req, res) => {
  try {
    const { id, itemId } = req.params

    const item = await pool.query(
      `
      SELECT cart_items.id
      FROM cart_items
      JOIN carts
        ON cart_items.cart_id = carts.id
      WHERE cart_items.id = $1
        AND carts.customer_id = $2
      `,
      [itemId, id]
    )

    if (item.rows.length === 0) {
      return res.status(404).json({
        message: "Item cart tidak ditemukan",
      })
    }

    await pool.query(
      `
      DELETE FROM cart_items
      WHERE id = $1
      `,
      [itemId]
    )

    res.json({
      message: "Produk berhasil dihapus dari cart",
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal menghapus produk dari cart",
    })
  }
})

app.post("/api/customers/:id/orders", async (req, res) => {
  try {
    const { id } = req.params

    const {
      address_id,
      metode_pengiriman,
      ongkir,
    } = req.body

    if (!address_id || !metode_pengiriman || ongkir === undefined) {
      return res.status(400).json({
        message: "Alamat, metode pengiriman, dan ongkir wajib diisi",
      })
    }

    // Cek customer
    const customer = await pool.query(
      "SELECT id FROM customers WHERE id = $1",
      [id]
    )

    if (customer.rows.length === 0) {
      return res.status(404).json({
        message: "Customer tidak ditemukan",
      })
    }

    // Cek alamat milik customer
    const address = await pool.query(
      `
      SELECT id
      FROM addresses
      WHERE id = $1
        AND customer_id = $2
      `,
      [address_id, id]
    )

    if (address.rows.length === 0) {
      return res.status(404).json({
        message: "Alamat tidak ditemukan",
      })
    }

    // Ambil cart
    const cart = await pool.query(
      `
      SELECT id
      FROM carts
      WHERE customer_id = $1
      `,
      [id]
    )

    if (cart.rows.length === 0) {
      return res.status(404).json({
        message: "Cart customer tidak ditemukan",
      })
    }

    // Ambil isi cart
    const cartItems = await pool.query(
      `
      SELECT
        cart_items.product_id,
        cart_items.jumlah,
        products.nama,
        products.harga,
        products.stok
      FROM cart_items
      JOIN products
        ON cart_items.product_id = products.id
      WHERE cart_items.cart_id = $1
      `,
      [cart.rows[0].id]
    )

    if (cartItems.rows.length === 0) {
      return res.status(400).json({
        message: "Cart masih kosong",
      })
    }

    // Validasi stok
    for (const item of cartItems.rows) {
      if (item.jumlah > item.stok) {
        return res.status(400).json({
          message: `Stok ${item.nama} tidak mencukupi`,
        })
      }
    }

    // Hitung subtotal
    const subtotal = cartItems.rows.reduce(
      (total, item) =>
        total + Number(item.harga) * item.jumlah,
      0
    )

    const totalPembayaran = subtotal + Number(ongkir)

    // Nomor order
    const nomorOrder = `TOKITA-${Date.now()}`

    // Buat order
    const order = await pool.query(
      `
      INSERT INTO orders
        (
          customer_id,
          address_id,
          nomor_order,
          subtotal,
          ongkir,
          total_pembayaran,
          metode_pengiriman
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        id,
        address_id,
        nomorOrder,
        subtotal,
        ongkir,
        totalPembayaran,
        metode_pengiriman,
      ]
    )

    const orderData = order.rows[0]

    // Masukkan item ke order_details
    for (const item of cartItems.rows) {
      await pool.query(
        `
        INSERT INTO order_details
          (
            order_id,
            product_id,
            nama_produk,
            harga,
            jumlah,
            subtotal
          )
        VALUES
          ($1, $2, $3, $4, $5, $6)
        `,
        [
          orderData.id,
          item.product_id,
          item.nama,
          item.harga,
          item.jumlah,
          Number(item.harga) * item.jumlah,
        ]
      )
    }

    // Hapus isi cart setelah order berhasil dibuat
    await pool.query(
      `
      DELETE FROM cart_items
      WHERE cart_id = $1
      `,
      [cart.rows[0].id]
    )

    res.status(201).json({
      message: "Order berhasil dibuat",
      order: orderData,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal membuat order",
    })
  }
})

app.get("/api/customers/:id/orders", async (req, res) => {
  try {
    const { id } = req.params

    const orders = await pool.query(
      `
      SELECT
        id,
        nomor_order,
        subtotal,
        ongkir,
        total_pembayaran,
        metode_pengiriman,
        status_order,
        created_at
      FROM orders
      WHERE customer_id = $1
      ORDER BY id DESC
      `,
      [id]
    )

    res.json(orders.rows)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal mengambil riwayat order",
    })
  }
})

app.get("/api/admin/orders", async (req, res) => {
  try {
    const orders = await pool.query(
      `
      SELECT
        id,
        customer_id,
        nomor_order,
        subtotal,
        ongkir,
        total_pembayaran,
        metode_pengiriman,
        status_order,
        created_at
      FROM orders
      ORDER BY id DESC
      `
    )

    res.json(orders.rows)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal mengambil data pesanan admin",
    })
  }
})

app.put("/api/admin/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params
    const { status_order } = req.body

    if (!status_order) {
      return res.status(400).json({
        message: "Status order wajib diisi",
      })
    }

    const result = await pool.query(
      `
      UPDATE orders
      SET status_order = $1
      WHERE id = $2
      RETURNING *
      `,
      [status_order, orderId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Order tidak ditemukan",
      })
    }

    res.json({
      message: "Status order berhasil diubah",
      order: result.rows[0],
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal mengubah status order",
    })
  }
})

app.get("/api/customers/:id/orders/:orderId", async (req, res) => {
  try {
    const { id, orderId } = req.params

    const order = await pool.query(
      `
      SELECT
        orders.id,
        orders.nomor_order,
        orders.subtotal,
        orders.ongkir,
        orders.total_pembayaran,
        orders.metode_pengiriman,
        orders.status_order,
        orders.created_at,
        addresses.nama_penerima,
        addresses.no_telepon,
        addresses.alamat_lengkap,
        addresses.kota,
        addresses.provinsi,
        addresses.kode_pos
      FROM orders
      JOIN addresses
        ON orders.address_id = addresses.id
      WHERE orders.id = $1
        AND orders.customer_id = $2
      `,
      [orderId, id]
    )

    if (order.rows.length === 0) {
      return res.status(404).json({
        message: "Order tidak ditemukan",
      })
    }

    const details = await pool.query(
      `
      SELECT
        id,
        product_id,
        nama_produk,
        harga,
        jumlah,
        subtotal
      FROM order_details
      WHERE order_id = $1
      ORDER BY id
      `,
      [orderId]
    )

    res.json({
      order: order.rows[0],
      items: details.rows,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal mengambil detail order",
    })
  }
})

app.post("/api/orders/:orderId/payment", async (req, res) => {
  try {
    const { orderId } = req.params
    const { payment_method, payment_gateway } = req.body

    if (!payment_method) {
      return res.status(400).json({
        message: "Metode pembayaran wajib diisi",
      })
    }

    const order = await pool.query(
      `
      SELECT
        id,
        total_pembayaran,
        status_order
      FROM orders
      WHERE id = $1
      `,
      [orderId]
    )

    if (order.rows.length === 0) {
      return res.status(404).json({
        message: "Order tidak ditemukan",
      })
    }

    const existingPayment = await pool.query(
      `
      SELECT id
      FROM payments
      WHERE order_id = $1
      `,
      [orderId]
    )

    if (existingPayment.rows.length > 0) {
      return res.status(409).json({
        message: "Payment untuk order ini sudah tersedia",
      })
    }

    const result = await pool.query(
      `
      INSERT INTO payments
        (
          order_id,
          payment_method,
          payment_gateway,
          amount
        )
      VALUES
        ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        orderId,
        payment_method,
        payment_gateway || null,
        order.rows[0].total_pembayaran,
      ]
    )

    res.status(201).json({
      message: "Payment berhasil dibuat",
      payment: result.rows[0],
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal membuat payment",
    })
  }
})

app.get("/api/orders/:orderId/payment", async (req, res) => {
  try {
    const { orderId } = req.params

    const result = await pool.query(
      `
      SELECT
        id,
        order_id,
        payment_method,
        payment_gateway,
        transaction_id,
        amount,
        status_pembayaran,
        paid_at,
        created_at,
        updated_at
      FROM payments
      WHERE order_id = $1
      `,
      [orderId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Payment tidak ditemukan",
      })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal mengambil data payment",
    })
  }
})

app.post("/api/customers/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: "Email dan password wajib diisi",
      })
    }

    const result = await pool.query(
      `
    SELECT
      id,
      nama,
      email,
      password,
      no_telepon,
      role
    FROM customers
      WHERE email = $1
      `,
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Email atau password salah",
      })
    }

    const customer = result.rows[0]

    if (customer.password !== password) {
      return res.status(401).json({
        message: "Email atau password salah",
      })
    }

    res.json({
      message: "Login berhasil",
      customer: {
        id: customer.id,
        nama: customer.nama,
        email: customer.email,
        no_telepon: customer.no_telepon,
        role: customer.role,
      },
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: "Gagal melakukan login",
    })
  }
})

app.post("/api/orders/:orderId/payment/snap", async (req, res) => {
  try {
    const { orderId } = req.params

    // Ambil data order + customer
    const orderResult = await pool.query(
      `
      SELECT
        orders.id,
        orders.nomor_order,
        orders.total_pembayaran,
        customers.nama,
        customers.email
      FROM orders
      JOIN customers
        ON orders.customer_id = customers.id
      WHERE orders.id = $1
      `,
      [orderId]
    )

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        message: "Order tidak ditemukan",
      })
    }

    const order = orderResult.rows[0]

    // Cek apakah payment sudah tersedia
    const existingPayment = await pool.query(
      `
      SELECT id
      FROM payments
      WHERE order_id = $1
      `,
      [orderId]
    )

    // Kalau belum ada, buat payment pending
    if (existingPayment.rows.length === 0) {
      await pool.query(
        `
        INSERT INTO payments
          (
            order_id,
            payment_method,
            payment_gateway,
            amount,
            status_pembayaran
          )
        VALUES
          ($1, $2, $3, $4, $5)
        `,
        [
          orderId,
          "midtrans",
          "midtrans",
          order.total_pembayaran,
          "pending",
        ]
      )
    }

    // Buat transaksi Midtrans
    const parameter = {
        transaction_details: {
            order_id: order.nomor_order,
            gross_amount: Number(order.total_pembayaran),
        },

        customer_details: {
            first_name: order.nama,
            email: order.email,
        },

        callbacks: {
            finish: `http://localhost:5173/payment-finish?tokita_order_id=${order.id}`,
        },
    }

    const transaction = await snap.createTransaction(parameter)

    res.json({
      message: "Snap token berhasil dibuat",
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    })
  } catch (error) {
    console.error("MIDTRANS ERROR:")
    console.error("message:", error.message)
    console.error("status:", error.httpStatusCode)
    console.error("api response:", error.ApiResponse)

    res.status(500).json({
      message: "Gagal membuat transaksi Midtrans",
      error: error.message,
      midtrans_status: error.httpStatusCode,
      midtrans_response: error.ApiResponse,
    })
  }
})

app.post("/api/payments/webhook", async (req, res) => {
  try {
    const notification = req.body

    console.log("MIDTRANS WEBHOOK:")
    console.log(notification)

    const {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
      status_code,
      gross_amount,
      signature_key,
    } = notification

    // Verifikasi signature dari Midtrans

    const serverKey = process.env.MIDTRANS_SERVER_KEY

    const signature = crypto
      .createHash("sha512")
      .update(
        order_id +
        status_code +
        gross_amount +
        serverKey
      )
      .digest("hex")

    if (signature !== signature_key) {
      return res.status(401).json({
        message: "Signature tidak valid",
      })
    }

    // Cari order berdasarkan nomor_order
    const orderResult = await pool.query(
      `
      SELECT id
      FROM orders
      WHERE nomor_order = $1
      `,
      [order_id]
    )

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        message: "Order tidak ditemukan",
      })
    }

    const order = orderResult.rows[0]

    // Tentukan status pembayaran
    let statusPembayaran = "pending"
    let statusOrder = "menunggu_pembayaran"

    if (
      transaction_status === "settlement" ||
      (
        transaction_status === "capture" &&
        fraud_status === "accept"
      )
    ) {
      statusPembayaran = "paid"
      statusOrder = "diproses"
    } else if (transaction_status === "pending") {
      statusPembayaran = "pending"
      statusOrder = "menunggu_pembayaran"
    } else if (transaction_status === "expire") {
      statusPembayaran = "expired"
      statusOrder = "expired"
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel"
    ) {
      statusPembayaran = "failed"
      statusOrder = "gagal"
    }

    // Cek status payment saat ini
    const paymentResult = await pool.query(
      `
      SELECT
        id,
        status_pembayaran
      FROM payments
      WHERE order_id = $1
      `,
      [order.id]
    )

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        message: "Payment tidak ditemukan",
      })
    }

    const payment = paymentResult.rows[0]

    // Update payment
    const updatedPayment = await pool.query(
      `
      UPDATE payments
      SET
        transaction_id = $1,
        payment_method = $2,
        status_pembayaran = $3::varchar,
        paid_at = CASE
          WHEN $3::varchar = 'paid' THEN CURRENT_TIMESTAMP
          ELSE paid_at
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $4
        AND status_pembayaran <> 'paid'
      RETURNING id
      `,
      [
        transaction_id,
        payment_type,
        statusPembayaran,
        order.id,
      ]
    )

    // Kurangi stok hanya ketika payment baru berubah menjadi paid
    if (
      statusPembayaran === "paid" &&
      updatedPayment.rows.length > 0
    ) {
      const orderDetails = await pool.query(
        `
        SELECT
          product_id,
          jumlah
        FROM order_details
        WHERE order_id = $1
        `,
        [order.id]
      )

      for (const item of orderDetails.rows) {
        await pool.query(
          `
          UPDATE products
          SET stok = stok - $1
          WHERE id = $2
          `,
          [
            item.jumlah,
            item.product_id,
          ]
        )
      }

      console.log(
        `Stok order ${order_id} berhasil dikurangi`
      )
    }

    // Update order
    await pool.query(
      `
      UPDATE orders
      SET status_order = $1
      WHERE id = $2
      `,
      [
        statusOrder,
        order.id,
      ]
    )

    console.log(
      `Order ${order_id}: ${statusPembayaran}`
    )

    res.json({
      message: "Webhook berhasil diproses",
      order_id,
      transaction_status,
      status_pembayaran: statusPembayaran,
      status_order: statusOrder,
    })

  } catch (error) {
    console.error("WEBHOOK ERROR:")
    console.error(error)

    res.status(500).json({
      message: "Gagal memproses webhook",
    })
  }
})

app.post("/api/upload", upload.single("gambar"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Gambar wajib dipilih",
      })
    }

    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`

    res.json({
      message: "Gambar berhasil diupload",
      url: imageUrl,
    })
  } catch (error) {
    console.error("UPLOAD ERROR:", error)

    res.status(500).json({
      message: "Gagal mengupload gambar",
    })
  }
})

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `
      DELETE FROM products
      WHERE id = $1
      RETURNING *
      `,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Produk tidak ditemukan",
      })
    }

    res.json({
      message: "Produk berhasil dihapus",
      product: result.rows[0],
    })
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error)

    if (error.code === "23503") {
      return res.status(409).json({
        message:
          "Produk tidak dapat dihapus karena sudah digunakan dalam riwayat pesanan.",
      })
    }

    res.status(500).json({
      message: "Gagal menghapus produk",
    })
  }
})

app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params

    const {
      nama,
      kategori,
      harga,
      stok,
      gambar,
      deskripsi,
    } = req.body

    if (
      !nama ||
      !kategori ||
      harga === undefined ||
      stok === undefined
    ) {
      return res.status(400).json({
        message:
          "Nama, kategori, harga, dan stok wajib diisi",
      })
    }

    const categoryResult = await pool.query(
      `
      SELECT id
      FROM categories
      WHERE nama = $1
      `,
      [kategori]
    )

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        message: "Kategori tidak ditemukan",
      })
    }

    const result = await pool.query(
      `
      UPDATE products
      SET
        nama = $1,
        category_id = $2,
        harga = $3,
        stok = $4,
        gambar = $5,
        deskripsi = $6
      WHERE id = $7
      RETURNING *
      `,
      [
        nama,
        categoryResult.rows[0].id,
        harga,
        stok,
        gambar || null,
        deskripsi || null,
        id,
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Produk tidak ditemukan",
      })
    }

    res.json({
      message: "Produk berhasil diperbarui",
      product: result.rows[0],
    })
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error)

    res.status(500).json({
      message: "Gagal memperbarui produk",
    })
  }
})

app.post("/api/products", async (req, res) => {
  try {
    const {
      nama,
      kategori,
      harga,
      stok,
      gambar,
      deskripsi,
    } = req.body

    if (
      !nama ||
      !kategori ||
      harga === undefined ||
      stok === undefined
    ) {
      return res.status(400).json({
        message:
          "Nama, kategori, harga, dan stok wajib diisi",
      })
    }

    const categoryResult = await pool.query(
      `
      SELECT id
      FROM categories
      WHERE nama = $1
      `,
      [kategori]
    )

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        message: "Kategori tidak ditemukan",
      })
    }

    const result = await pool.query(
      `
      INSERT INTO products
        (
          nama,
          category_id,
          harga,
          stok,
          gambar,
          deskripsi
        )
      VALUES
        ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        nama,
        categoryResult.rows[0].id,
        harga,
        stok,
        gambar || null,
        deskripsi || null,
      ]
    )

    res.status(201).json({
      message: "Produk berhasil ditambahkan",
      product: result.rows[0],
    })
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error)

    res.status(500).json({
      message: "Gagal menambahkan produk",
    })
  }
})

app.get("/api/admin/dashboard", async (req, res) => {
  try {
    const productResult = await pool.query(`
      SELECT COUNT(*) AS total_produk
      FROM products
    `)

    const stockResult = await pool.query(`
      SELECT COALESCE(SUM(stok), 0) AS total_stok
      FROM products
    `)

    const orderResult = await pool.query(`
      SELECT COUNT(*) AS total_pesanan
      FROM orders
    `)

    const recentOrdersResult = await pool.query(`
      SELECT
        id,
        nomor_order,
        total_pembayaran,
        status_order,
        created_at
      FROM orders
      ORDER BY id DESC
      LIMIT 5
    `)

    res.json({
      total_produk: Number(productResult.rows[0].total_produk),
      total_stok: Number(stockResult.rows[0].total_stok),
      total_pesanan: Number(orderResult.rows[0].total_pesanan),
      pesanan_terbaru: recentOrdersResult.rows,
    })
  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error)

    res.status(500).json({
      message: "Gagal mengambil data dashboard admin",
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server Tokita berjalan di http://localhost:${PORT}`)
})
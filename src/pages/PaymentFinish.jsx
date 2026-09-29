import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useCart } from "../context/CartContext"

function PaymentFinish() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { clearCart } = useCart()

    useEffect(() => {
        const orderId = searchParams.get("tokita_order_id")

        if (!orderId) {
            navigate("/")
            return
        }

        let attempts = 0
        const maxAttempts = 10

        const checkPayment = async () => {
            try {
                const response = await fetch(
                    `http://localhost:5000/api/orders/${orderId}/payment`
                )

                if (!response.ok) {
                    const errorData = await response.json()

                    console.log("STATUS BACKEND:", response.status)
                    console.log("RESPON BACKEND:", errorData)

                    throw new Error(
                        errorData.message || "Gagal mengecek pembayaran"
                    )
                }

                const payment = await response.json()

                console.log("Status pembayaran:", payment.status_pembayaran)

                if (payment.status_pembayaran === "paid") {
                    clearCart()

                    navigate("/", {
                        replace: true,
                    })

                    return
                }

                attempts++

                if (attempts < maxAttempts) {
                    setTimeout(checkPayment, 1500)
                } else {
                    alert(
                        "Pembayaran belum terkonfirmasi. Silakan cek riwayat pesanan."
                    )

                    navigate("/")
                }
            } catch (error) {
                console.error(error)

                attempts++

                if (attempts < maxAttempts) {
                    setTimeout(checkPayment, 1500)
                } else {
                    alert("Gagal mengecek status pembayaran.")
                    navigate("/")
                }
            }
        }

        checkPayment()
    }, [searchParams, navigate, clearCart])

    return (
        <main className="page-container">
            <h1>Memproses Pembayaran</h1>

            <p>
                Sedang memverifikasi pembayaran kamu...
            </p>
        </main>
    )
}

export default PaymentFinish
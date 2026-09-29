import { createContext, useContext, useState } from "react"

const CartContext = createContext()

export function CartProvider({ children }) {
    const [cart, setCart] = useState(() => {
        const savedCart = sessionStorage.getItem("tokita-cart")
        return savedCart ? JSON.parse(savedCart) : []
    })

    const addToCart = (product) => {
        setCart((currentCart) => {
            const existingProduct = currentCart.find(
                (item) => item.id === product.id
            )

            let updatedCart

            if (existingProduct) {
                if (existingProduct.jumlah >= product.stok) {
                    return currentCart
                }

                updatedCart = currentCart.map((item) =>
                    item.id === product.id
                        ? { ...item, jumlah: item.jumlah + 1 }
                        : item
                )
            } else {
                updatedCart = [
                    ...currentCart,
                    {
                        ...product,
                        jumlah: 1,
                    },
                ]
            }

            sessionStorage.setItem(
                "tokita-cart",
                JSON.stringify(updatedCart)
            )

            return updatedCart
        })
    }

    const updateQuantity = (id, jumlah) => {
        setCart((currentCart) => {
            const product = currentCart.find(
                (item) => item.id === id
            )

            if (!product) {
                return currentCart
            }

            if (jumlah < 1 || jumlah > product.stok) {
                return currentCart
            }

            const updatedCart = currentCart.map((item) =>
                item.id === id
                    ? { ...item, jumlah }
                    : item
            )

            sessionStorage.setItem(
                "tokita-cart",
                JSON.stringify(updatedCart)
            )

            return updatedCart
        })
    }

    const removeFromCart = (id) => {
        setCart((currentCart) => {
            const updatedCart = currentCart.filter(
                (item) => item.id !== id
            )

            sessionStorage.setItem(
                "tokita-cart",
                JSON.stringify(updatedCart)
            )

            return updatedCart
        })
    }

    const clearCart = () => {
        setCart([])
        sessionStorage.removeItem("tokita-cart")
    }

    const totalHarga = cart.reduce(
        (total, item) => total + item.harga * item.jumlah,
        0
    )

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                updateQuantity,
                removeFromCart,
                clearCart,
                totalHarga,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    return useContext(CartContext)
}
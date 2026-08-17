import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
    variantId: string;
    quantity: number;
    price: number;
    productName: string;
    sku: string;
    imageUrl: string;
    attributes: string;
}

interface CartState {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (variantId: string) => void;
    updateQuantity: (variantId: string, delta: number) => void;
    clearCart: () => void;
    getTotalAmount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (newItem) => {
                set((state) => {
                    const existingItem = state.items.find(
                        (item) => item.variantId === newItem.variantId,
                    );
                    if (existingItem) {
                        return {
                            items: state.items.map((item) =>
                                item.variantId === newItem.variantId
                                    ? {
                                          ...item,
                                          quantity:
                                              item.quantity + newItem.quantity,
                                      }
                                    : item,
                            ),
                        };
                    }
                    return { items: [...state.items, newItem] };
                });
            },

            removeItem: (variantId) => {
                set((state) => ({
                    items: state.items.filter(
                        (item) => item.variantId !== variantId,
                    ),
                }));
            },

            updateQuantity: (variantId, delta) => {
                set((state) => ({
                    items: state.items.map((item) => {
                        if (item.variantId === variantId) {
                            const newQuantity = Math.max(
                                1,
                                item.quantity + delta,
                            );
                            return { ...item, quantity: newQuantity };
                        }
                        return item;
                    }),
                }));
            },

            clearCart: () => set({ items: [] }),

            getTotalAmount: () => {
                return get().items.reduce(
                    (total, item) => total + item.price * item.quantity,
                    0,
                );
            },
        }),
        {
            name: "mini-erp-cart", // key name in localStorage
        },
    ),
);

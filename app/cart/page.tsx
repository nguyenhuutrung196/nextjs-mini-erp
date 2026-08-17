"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCartStore } from "../store/cartStore";

export default function CartPage() {
    const [isMounted, setIsMounted] = useState(false);

    const { items, addItem, updateQuantity, removeItem, getTotalAmount } =
        useCartStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    //form delivery
    const [customerName, setCustomerName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const handleUpdateQuantity = (
        variantId: string,
        currentQty: number,
        delta: number,
    ) => {
        const newQty = currentQty + delta;
        if (newQty <= 0) {
            removeItem(variantId);
            toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
            return;
        }
        updateQuantity(variantId, delta);
    };

    const handleCheckoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerName || !phone || !address) {
            toast.warning(
                "Vui lòng nhập tên khách hàng, số điện thoại và địa chỉ đến nhận hàng.",
            );
            return;
        }

        if (items.length === 0) {
            toast.warning("Giỏ hàng đang trống");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Đang xử lý đơn hàng...");

        try {
            //send all items cart from client to api checkout
            const checkoutRes = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName,
                    phone,
                    address,
                    notes,
                    items,
                }),
            });

            const checkoutData = await checkoutRes.json();
            if (!checkoutData.success) {
                throw new Error(
                    checkoutData.error || "Lỗi lưu thông tin đặt hàng",
                );
            }

            toast.loading("Đang khởi tạo kết nối cổng VNPay...", {
                id: toastId,
            });

            //call API Payment VNPay
            const paymentRes = await fetch("/api/payment/vnpay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: checkoutData.data.id,
                }),
            });

            const paymentData = await paymentRes.json();
            if (paymentData.success && paymentData.data?.checkoutUrl) {
                toast.success("Đang chuyển hướng sang cổng VNPay...", {
                    id: toastId,
                });

                window.location.href = paymentData.data.checkoutUrl;
            } else {
                throw new Error(paymentData.error || "Lỗi liên kết VNPay");
            }
        } catch (error: any) {
            toast.error(error.message || "Có lỗi", { id: toastId });
            setIsSubmitting(false);
        }
    };

    if (!isMounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-10">
            <div className="max-w-6xl mx-auto px-4">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
                    Giỏ hàng
                </h1>

                {/* NÚT TEST LUỒNG - CÓ THỂ XÓA */}
                {/* <button
                    type="button"
                    onClick={() => {
                        addItem({
                            variantId: "cafbf02e-5c08-4282-ad03-2b72490d4f43",
                            quantity: 1,
                            price: 150000, // Giá hiển thị tạm, khi thanh toán hệ thống sẽ tự lấy giá chuẩn từ DB
                            productName: "Sản phẩm Test VNPay",
                            sku: "TEST-SKU-01",
                            imageUrl: "",
                            attributes: "Màu: Đỏ, Size: M",
                        });
                        toast.success("Đã nhồi sản phẩm test vào giỏ!");
                    }}
                    className="mb-6 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm"
                >
                    🧪 Thêm Sản Phẩm Test Vào Giỏ
                </button> */}

                {items.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm space-y-4">
                        <div className="text-6xl">🛒</div>
                        <h2 className="text-xl font-bold text-gray-800">
                            Giỏ hàng đang trống trơn!
                        </h2>
                        <p className="text-sm text-gray-500">
                            Hãy chọn cho mình sản phẩm ưng ý nhất.
                        </p>
                        <Link
                            href="/"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-sm"
                        >
                            Quay lại mua sắm ngay
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Column Left: PRODUCTS LIST FROM ZUDSTAND */}
                        <div className="lg:col-span-7 space-y-4">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
                                <h2 className="text-lg font-bold text-gray-800 border-b pb-4">
                                    Chi tiết giỏ sản phẩm
                                </h2>
                                {items.map((item) => (
                                    <div
                                        key={item.variantId}
                                        className="flex gap-4 items-center justify-between border-b last:border-b-0 pb-6 last:pb-0"
                                    >
                                        <div className="flex gap-4 items-center">
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt="img"
                                                    className="w-16 h-16 object-cover rounded-xl border border-gray-100"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-400">
                                                    No img
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-sm md:text-base leading-tight">
                                                    {item.productName}
                                                </h3>
                                                <div className="mt-1 text-xs font-semibold text-gray-600 bg-gray-100 inline-block px-2 py-0.5 rounded">
                                                    {item.attributes}
                                                </div>
                                                <div className="text-xs text-gray-400 font-mono mt-1">
                                                    SKU: {item.sku}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <span className="font-extrabold text-gray-900 text-sm">
                                                {(
                                                    item.price * item.quantity
                                                ).toLocaleString("vi-VN")}{" "}
                                                đ
                                            </span>
                                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleUpdateQuantity(
                                                            item.variantId,
                                                            item.quantity,
                                                            -1,
                                                        )
                                                    }
                                                    className="px-2.5 py-1 text-gray-500 hover:bg-gray-200 font-extrabold transition-all"
                                                >
                                                    -
                                                </button>
                                                <span className="px-3 text-xs font-bold text-gray-800 w-8 text-center bg-white border-x border-gray-200 flex items-center justify-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleUpdateQuantity(
                                                            item.variantId,
                                                            item.quantity,
                                                            1,
                                                        )
                                                    }
                                                    className="px-2.5 py-1 text-gray-500 hover:bg-gray-200 font-extrabold transition-all"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Column Right: FORM FOR CHECKOUT */}
                        <div className="lg:col-span-5 space-y-6">
                            <form
                                onSubmit={handleCheckoutSubmit}
                                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6"
                            >
                                <h2 className="text-lg font-bold text-gray-800 border-b pb-4">
                                    Thông tin giao hàng
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            Họ và tên khách hàng *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={customerName}
                                            onChange={(e) =>
                                                setCustomerName(e.target.value)
                                            }
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                            placeholder="Nguyễn Văn A"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            Số điện thoại *
                                        </label>
                                        <input
                                            required
                                            type="tel"
                                            value={phone}
                                            onChange={(e) =>
                                                setPhone(e.target.value)
                                            }
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                            placeholder="0912345678"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            Địa chỉ giao hàng *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={address}
                                            onChange={(e) =>
                                                setAddress(e.target.value)
                                            }
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                            placeholder="Số nhà, đường..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            Ghi chú (Nếu có)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={notes}
                                            onChange={(e) =>
                                                setNotes(e.target.value)
                                            }
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                            placeholder="Giao giờ hành chính..."
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-blue-800">
                                        <span>Phương thức thanh toán:</span>
                                        <span>Cổng VNPay 🏦</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                                        <span className="text-sm font-bold text-gray-700">
                                            Tổng thanh toán:
                                        </span>
                                        <span className="text-xl font-extrabold text-blue-700">
                                            {getTotalAmount().toLocaleString(
                                                "vi-VN",
                                            )}{" "}
                                            đ
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting
                                        ? "Đang xử lý..."
                                        : "Thanh Toán Qua VNPAY"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

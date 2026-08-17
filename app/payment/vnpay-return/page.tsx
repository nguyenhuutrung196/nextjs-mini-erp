"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useCartStore } from "../../store/cartStore";

export default function VNPayReturnPage() {
    const searchParams = useSearchParams();
    const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
    const vnp_TxnRef = searchParams.get("vnp_TxnRef");
    const vnp_Amount = searchParams.get("vnp_Amount");

    const amount = vnp_Amount
        ? (Number(vnp_Amount) / 100).toLocaleString("vi-VN")
        : "0";
    const isSuccess = vnp_ResponseCode === "00";

    const clearCart = useCartStore((state) => state.clearCart);
    useEffect(() => {
        if (isSuccess) {
            clearCart();
        }
    }, [isSuccess, clearCart]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-6 border border-gray-100">
                {isSuccess ? (
                    /* Success layout */
                    <>
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-50 border border-green-100 text-5xl">
                            🎉
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Thanh Toán Thành Công!
                            </h1>
                            <p className="text-sm text-gray-500">
                                Cảm ơn bạn đã mua sắm tại cửa hàng của chúng
                                tôi.
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-left text-sm font-medium border border-gray-100">
                            <div className="flex justify-between text-gray-600">
                                <span>Mã đơn hàng:</span>
                                <span className="font-mono text-gray-900 font-bold">
                                    #{vnp_TxnRef?.slice(0, 8).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Số tiền đã thanh toán:</span>
                                <span className="text-green-600 font-bold">
                                    {amount} VND
                                </span>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Failed layout */
                    <>
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 border border-red-100 text-5xl">
                            💔
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Giao Dịch Thất Bại
                            </h1>
                            <p className="text-sm text-gray-500">
                                Giao dịch thanh toán đã bị hủy hoặc gặp sự cố từ
                                phía ngân hàng.
                            </p>
                        </div>
                        <p className="text-xs text-gray-400 italic">
                            Bạn không bị trừ bất kỳ chi phí nào từ giao dịch
                            này.
                        </p>
                    </>
                )}

                {/* Action Button */}
                <div className="pt-4">
                    <Link
                        href="/"
                        className={`block w-full py-3 rounded-xl font-bold text-white shadow-md transition-all ${
                            isSuccess
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-gray-800 hover:bg-gray-900"
                        }`}
                    >
                        Quay lại Trang Chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}

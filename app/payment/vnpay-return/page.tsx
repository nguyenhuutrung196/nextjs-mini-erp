"use client";

import { useSearchParams } from "next/navigation";

export default function VNPayReturnPage() {
    const searchParams = useSearchParams();
    const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
    const vnp_TxnRef = searchParams.get("vnp_TxnRef");

    const isSuccess = vnp_ResponseCode === "00";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <h1
                className={`text-4xl font-bold ${isSuccess ? "text-green-600" : "text-red-600"}`}
            >
                {isSuccess
                    ? "Giao dịch thành công!"
                    : "Giao dịch thất bại hoặc bị hủy!"}
            </h1>
            <p className="mt-4 text-gray-600">Mã đơn hàng: {vnp_TxnRef}</p>
            <p className="mt-2 text-sm text-gray-600">
                Hệ thống đang đồng bộ dữ liệu. Bạn có thể quay lại trang chủ.
            </p>
        </div>
    );
}

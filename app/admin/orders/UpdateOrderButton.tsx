"use client";

import { useState } from "react";
import { updateOrderStatus } from "./actions";

export default function UpdateOrderButton({ orderId }: { orderId: string }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = async () => {
        if (!confirm("Bạn có chắc chắn muốn xác nhận giao đơn hàng này?"))
            return;

        try {
            setIsLoading(true);

            //call server action to update order status
            await updateOrderStatus(orderId);
        } catch (error) {
            if (error instanceof Error) {
                alert(error.message || "Lỗi hệ thống khi cập nhật!");
                setIsLoading(false);
            }
        }
    };

    return (
        <button
            onClick={handleUpdate}
            className={`px-4 py-2 rounded shadow transition-colors font-semibold ${
                isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
        >
            {isLoading ? "Đang xác nhận..." : "Xác nhận giao hàng"}
        </button>
    );
}

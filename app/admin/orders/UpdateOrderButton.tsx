"use client";

import { useState } from "react";
import { updateOrderStatus } from "./actions";
import { toast } from "sonner";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function UpdateOrderButton({ orderId }: { orderId: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleUpdate = async () => {
        try {
            setIsLoading(true);

            //call server action to update order status
            await updateOrderStatus(orderId);
            setIsModalOpen(false);
            toast.success("Cập nhật trạng thái đơn hàng thành công!");
        } catch (error) {
            if (error instanceof Error) {
                setIsLoading(false);
                toast.error(error.message || "Lỗi hệ thống khi cập nhật!");
            }
        }
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className={`px-4 py-2 rounded shadow transition-colors font-semibold cursor-pointer ${
                    isLoading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
            >
                Xác nhận giao hàng
            </button>

            <ConfirmModal
                isOpen={isModalOpen}
                title="Xác nhận giao hàng"
                message={`Bạn có chắc chắn muốn xác nhận giao đơn hàng "${orderId}" này?`}
                onConfirm={handleUpdate}
                onCancel={() => setIsModalOpen(false)}
                isLoading={isLoading}
            />
        </>
    );
}

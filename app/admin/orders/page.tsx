import prisma from "@/lib/prisma";

export default async function AdminOrdersPage() {
    const paidOrders = await prisma.order.findMany({
        where: { status: "PAID" },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            user: true,
            items: true,
        },
    });

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
                Đơn hàng chờ xử lý để giao
            </h1>
            {paidOrders.length === 0 ? (
                <p>Chưa có đơn hàng nào được thanh toán</p>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-200 text-gray-700">
                                <th className="p-4 border-b">
                                    Mã đơn hàng (VNPay Ref)
                                </th>
                                <th className="p-4 border-b">Khách hàng</th>
                                <th className="p-4 border-b">Tổng tiền</th>
                                <th className="p-4 border-b">Trạng thái</th>
                                <th className="p-4 border-b">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paidOrders.map((order: any) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="p-4 border-b text-sm font-mono text-gray-300">
                                        {order.id.slice(0, 8)}
                                    </td>
                                    <td className="p-4 border-b">
                                        {order.user?.name || "Khách vãng lai"}
                                    </td>
                                    <td className="p-4 border-b font-bold text-green-600">
                                        {order.total.toLocaleString("vi-VN")}{" "}
                                        VNĐ
                                    </td>
                                    <td className="p-4 border-b">
                                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                                            Đã thanh toán
                                        </span>
                                    </td>
                                    <td className="p-4 border-b">
                                        <button className="bg-blue-600 hover:bg-blue-700 transition text-white py-2 px-4 rounded shadow">
                                            Xác nhận giao hàng
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
    try {
        await requireAdmin();

        const orders = await prisma.order.findMany({
            orderBy: { createdAt: "desc" },
            include: { user: true },
        });

        //BOM (\uFEFF) required for Google Sheets and Excel not to be confused Font
        let csvContent =
            "\uFEFFMã dơn hàng,Ngày tạo,Khách hàng,Số điện thoại,Địa chỉ,Trạng thái,Tổng tiền (VNĐ)\n";

        //map data to each row
        orders.forEach((order) => {
            const id = order.id;
            const date = order.createdAt.toLocaleDateString("vi-VN");
            const name = `"${(order.customerName || order.user?.name || "Khách vãng lai").replace(/"/g, '""')}"`;
            const phone = order.phone || "N/A";
            const address = `"${(order.address || "N/A").replace(/"/g, '""')}"`;
            const status = order.status;
            const total = order.total;

            csvContent += `${id},${date},${name},${phone},${address},${status},${total}\n`;
        });

        //return file csv
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="bao_cao_don_hang.csv"`,
            },
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        console.error(error);
    }
}

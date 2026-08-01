import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleError } from "@/lib/error-handler";

export async function GET() {
    try {
        await prisma.order.updateMany({
            where: { status: "SHIPPED" },
            data: { status: "PAID" },
        });

        return NextResponse.json(
            { success: true, message: "Đơn hàng đã được reset thành công" },
            { status: 200 },
        );
    } catch (error) {
        return handleError(error, "Lỗi khi reset đơn hàng");
    }
}

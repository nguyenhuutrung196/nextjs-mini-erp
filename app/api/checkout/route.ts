import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleError } from "@/lib/error-handler";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customerName, phone, address, notes } = body;

        if (!customerName || !phone || !address || !notes) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Thiếu thông tin bắt buộc để thanh toán đơn hàng",
                },
                { status: 400 },
            );
        }

        const activeOrder = await prisma.order.findFirst({
            where: { status: "PENDING" },
            include: {
                items: true,
            },
        });

        if (!activeOrder || activeOrder.items.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Giỏ hàng đang trống, không thể tiến hành thanh toán",
                },
                { status: 400 },
            );
        }

        const updatedOrder = await prisma.order.update({
            where: { id: activeOrder.id },
            data: {
                customerName,
                phone,
                address,
                notes: notes || null,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Xác nhận thông tin giao hàng thành công",
                data: updatedOrder,
            },
            { status: 200 },
        );
    } catch (error) {
        return handleError(error, "Lỗi trong quá trình thanh toán đơn hàng");
    }
}

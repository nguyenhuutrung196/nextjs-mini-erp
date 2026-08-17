import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleError } from "@/lib/error-handler";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customerName, phone, address, notes, items } = body;

        if (!customerName || !phone || !address) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Thiếu thông tin bắt buộc để thanh toán đơn hàng",
                },
                { status: 400 },
            );
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    messge: "Giỏ hàng đang trống, không thể thanh toán",
                },
                { status: 400 },
            );
        }

        //use transaction to ensure atomicity
        const newOrder = await prisma.$transaction(async (tx) => {
            let calculatedTotal = 0;
            const orderItemData = [];

            for (const item of items) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                });

                if (!variant) {
                    throw new Error(
                        `Không tìm thấy biến thể ${item.variantId}`,
                    );
                }

                if (variant.stock < item.quantity) {
                    throw new Error(
                        `Mã sản phẩm ${variant.sku} còn ${item.quantity} sản phẩm, không đủ đáp ứng `,
                    );
                }

                calculatedTotal += item.quantity * variant.price;

                orderItemData.push({
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: variant.price,
                });
            }

            const order = await tx.order.create({
                data: {
                    total: calculatedTotal,
                    status: "PENDING",
                    customerName,
                    phone,
                    address,
                    notes: notes || null,
                    items: {
                        create: orderItemData,
                    },
                },
                include: {
                    items: true,
                },
            });

            return order;
        });

        return NextResponse.json(
            {
                success: true,
                message: "Xác nhận thông tin giao hàng thành công",
                data: newOrder,
            },
            { status: 200 },
        );
    } catch (error) {
        return handleError(error, "Lỗi trong quá trình thanh toán đơn hàng");
    }
}

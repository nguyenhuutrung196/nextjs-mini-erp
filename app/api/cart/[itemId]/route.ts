import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleError } from "@/lib/error-handler";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ itemId: string }> },
) {
    try {
        const { itemId } = await params;
        const body = await request.json();
        const { quantity } = body;

        // validation check input
        if (!itemId || !quantity || quantity <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Mã sản phẩm ${itemId} và số lượng ${quantity} không hợp lệ`,
                },
                { status: 400 },
            );
        }

        // use transaction to ensure atomicity
        const updatedCart = await prisma.$transaction(async (tx) => {
            //task A: find order item need to update
            const orderItem = await tx.orderItem.findUnique({
                where: { id: itemId },
                include: {
                    variant: true,
                },
            });

            if (!orderItem) {
                throw new Error(
                    `Không tìm thấy sản phẩm ${itemId} trong giỏ hàng`,
                );
            }

            //task B: check stock is enough or not
            if (orderItem.variant.stock < quantity) {
                throw new Error(
                    `Sản phẩm ${itemId} còn ${quantity} sản phẩm, không đủ đáp ứng `,
                );
            }

            //task C: update order item
            await tx.orderItem.update({
                where: { id: itemId },
                data: {
                    quantity: quantity,
                },
            });

            //task D: calculate new total amount
            const allItems = await tx.orderItem.findMany({
                where: { orderId: orderItem.orderId },
            });

            //use reduce to calculate total amount
            const newTotal = allItems.reduce((sum, item) => {
                return sum + item.quantity * item.price;
            }, 0);

            //task E: update new total amount to main order
            await tx.order.update({
                where: { id: orderItem.orderId },
                data: { total: newTotal },
            });

            //task F: return full order data to client
            return await tx.order.findUnique({
                where: { id: orderItem.orderId },
                include: {
                    items: {
                        include: {
                            variant: {
                                include: {
                                    product: {
                                        include: {
                                            translations: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
        });

        return NextResponse.json(
            { success: true, data: updatedCart },
            { status: 200 },
        );
    } catch (error) {
        return handleError(error, "Lỗi khi xóa sản phẩm trong giỏ hàng");
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ itemId: string }> },
) {
    try {
        const { itemId } = await params;

        const updatedCart = await prisma.$transaction(async (tx) => {
            //task A: find order item need to delete
            const orderItem = await tx.orderItem.findUnique({
                where: { id: itemId },
                include: {
                    variant: true,
                },
            });

            if (!orderItem) {
                throw new Error(
                    `Không tìm thấy sản phẩm ${itemId} trong giỏ hàng`,
                );
            }

            //task B: update order item
            await tx.orderItem.delete({
                where: { id: itemId },
            });

            //task C: calculate new total amount
            const allItems = await tx.orderItem.findMany({
                where: { orderId: orderItem.orderId },
            });

            //use reduce to calculate total amount
            const newTotal = allItems.reduce((sum, item) => {
                return sum + item.quantity * item.price;
            }, 0);

            //task D: update new total amount to main order
            await tx.order.update({
                where: { id: orderItem.orderId },
                data: { total: newTotal },
            });

            //task E: return full order data to client
            return await tx.order.findUnique({
                where: { id: orderItem.orderId },
                include: {
                    items: {
                        include: {
                            variant: {
                                include: {
                                    product: {
                                        include: {
                                            translations: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
        });

        return NextResponse.json(
            { success: true, data: updatedCart },
            { status: 200 },
        );
    } catch (error) {
        return handleError(error, "Lỗi khi xóa sản phẩm trong giỏ hàng");
    }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleError } from "@/lib/error-handler";

export async function GET() {
    try {
        const activeCart = await prisma.order.findFirst({
            where: { status: "PENDING" },
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

        if (!activeCart) {
            return NextResponse.json({
                success: true,
                data: {
                    id: null,
                    total: 0,
                    status: "PENDING",
                    items: [],
                },
            });
        }

        return NextResponse.json(
            { success: true, data: activeCart },
            { status: 200 },
        );
    } catch (error) {
        return handleError(
            error,
            "Lỗi khi lấy danh sách sản phẩm trong giỏ hàng",
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { variantId, quantity } = body;

        // validation check input
        if (!variantId || !quantity || quantity <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Mã biến thể ${variantId} và số lượng ${quantity} không hợp lệ`,
                },
                { status: 400 },
            );
        }

        // use transaction to ensure atomicity
        const updatedCart = await prisma.$transaction(async (tx) => {
            //task A: check variant product exist and stock is enough or not
            const variant = await tx.productVariant.findUnique({
                where: { id: variantId },
            });

            if (!variant) {
                throw new Error(`Không tìm thấy biến thể ${variantId}`);
            }

            if (variant.stock < quantity) {
                throw new Error(
                    `Biến thể ${variantId} còn ${quantity} sản phẩm, không đủ đáp ứng `,
                );
            }

            //task B: find currently order PENDING
            let order = await tx.order.findFirst({
                where: { status: "PENDING" },
            });

            //task C: if no order found, create new order
            if (!order) {
                order = await tx.order.create({
                    data: {
                        total: 0,
                        status: "PENDING",
                    },
                });
            }

            //task D: check the order item exist or not in cart
            const existingItem = await tx.orderItem.findFirst({
                where: {
                    orderId: order.id,
                    variantId: variantId,
                },
            });

            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;

                if (variant.stock < newQuantity) {
                    throw new Error(
                        `Không thêm được sản phẩm vì vượt quá số lượng tồn kho`,
                    );
                }

                await tx.orderItem.update({
                    where: {
                        id: existingItem.id,
                    },
                    data: {
                        quantity: newQuantity,
                        price: variant.price,
                    },
                });
            } else {
                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        variantId: variantId,
                        quantity: quantity,
                        price: variant.price,
                    },
                });
            }

            //task E: check all order item list, calculate total amount
            const allItems = await tx.orderItem.findMany({
                where: { orderId: order.id },
            });

            //use reduce to calculate total amount
            const newTotal = allItems.reduce((sum, item) => {
                return sum + item.quantity * item.price;
            }, 0);

            //task F: update new total amount to main order
            await tx.order.update({
                where: { id: order.id },
                data: { total: newTotal },
            });

            //task G: return full order data to client
            return await tx.order.findUnique({
                where: { id: order.id },
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
        return handleError(error, "Lỗi khi thêm sản phẩm vào giỏ hàng");
    }
}

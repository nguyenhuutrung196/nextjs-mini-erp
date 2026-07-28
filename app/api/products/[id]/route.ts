import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleError } from "@/lib/error-handler";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: {
                    include: {
                        translations: true,
                    },
                },
                translations: true,
                options: {
                    include: {
                        values: true,
                    },
                },
                variants: {
                    include: {
                        optionValues: {
                            include: {
                                option: true,
                            },
                        },
                    },
                },
            },
        });

        if (!product) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Không tìm thấy sản phẩm này",
                },
                { status: 404 },
            );
        }

        return NextResponse.json(
            { success: true, data: product },
            { status: 200 },
        );
    } catch (error) {
        return handleError(error, "Lỗi khi lấy sản phẩm theo ID");
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            slug,
            basePrice,
            images,
            categoryId,
            translations,
            options,
            variants,
        } = body;

        if (
            !slug ||
            !basePrice ||
            !categoryId ||
            !translations ||
            !options ||
            !variants
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Thiếu thông tin bắt buộc để cập nhật dữ liệu sản phẩm",
                },
                { status: 400 },
            );
        }

        const updateProduct = await prisma.$transaction(async (tx) => {
            //task A: update main product info
            await tx.product.update({
                where: { id },
                data: {
                    slug,
                    basePrice: parseFloat(basePrice),
                    images: images || [],
                    categoryId,
                },
            });

            //task B: delete all translations of this product
            await tx.productTranslation.deleteMany({
                where: { productId: id },
            });

            //task C: create new translations array send from client
            await tx.productTranslation.createMany({
                data: translations.map(
                    (t: {
                        locale: string;
                        name: string;
                        description: string;
                    }) => ({
                        productId: id,
                        locale: t.locale,
                        name: t.name,
                        description: t.description,
                    }),
                ),
            });

            //task D: get all complete translations of this product after update
            return await tx.product.findUnique({
                where: { id },
                include: {
                    translations: true,
                    options: {
                        include: {
                            values: true,
                        },
                    },
                    variants: true,
                },
            });
        });

        return NextResponse.json(
            { success: true, data: updateProduct },
            { status: 200 },
        );
    } catch (error) {
        return handleError(error, "Lỗi khi cập nhật sản phẩm");
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                translations: true,
                options: {
                    include: {
                        values: true,
                    },
                },
                variants: true,
            },
        });

        if (!product) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Không tìm thấy sản phẩm này",
                },
                { status: 404 },
            );
        }

        await prisma.product.delete({
            where: { id },
        });

        return NextResponse.json(
            { success: true, message: "Sản phẩm đã xóa thành công" },
            { status: 200 },
        );
    } catch (error) {
        return handleError(error, "Lỗi khi xóa sản phẩm");
    }
}

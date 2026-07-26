import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { slug, translations } = body;

        if (
            !slug ||
            !translations ||
            !Array.isArray(translations) ||
            translations.length === 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Dữ liệu không hợp lệ",
                },
                { status: 400 },
            );
        }

        const updateCategory = await prisma.$transaction(async (tx) => {
            //task A: update Slug main category
            await tx.category.update({
                where: { id },
                data: { slug },
            });

            //task B: delete all translations of this category
            await tx.categoryTranslation.deleteMany({
                where: { categoryId: id },
            });

            //task C: create new translations send from Client
            await tx.categoryTranslation.createMany({
                data: translations.map(
                    (t: {
                        locale: string;
                        name: string;
                        description?: string;
                    }) => ({
                        categoryId: id,
                        locale: t.locale,
                        name: t.name,
                        description: t.description || null,
                    }),
                ),
            });

            //task D: get all complete translations of this category after update
            return await tx.category.findUnique({
                where: { id },
                include: {
                    translations: true,
                },
            });
        });

        return NextResponse.json(
            { success: true, data: updateCategory },
            { status: 200 },
        );
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Slug của danh mục đã tồn tại",
                },
                { status: 400 },
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: error.message || "Lỗi khi tạo danh mục sản phẩm",
            },
            { status: 500 },
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;

        await prisma.category.delete({
            where: { id },
        });

        return NextResponse.json(
            { success: true, message: "Danh mục sản phẩm đã xóa" },
            { status: 200 },
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Lỗi khi xóa danh mục sản phẩm",
            },
            { status: 500 },
        );
    }
}

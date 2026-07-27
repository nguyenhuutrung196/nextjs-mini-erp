import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleError } from "@/lib/error-handler";

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            include: {
                translations: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(
            { success: true, data: categories },
            { status: 200 },
        );
    } catch (error) {
        return handleError(error, "Lỗi khi lấy danh sách danh mục");
    }
}

export async function POST(request: Request) {
    try {
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

        const newCategory = await prisma.category.create({
            data: {
                slug,
                translations: {
                    createMany: {
                        data: translations.map(
                            (t: {
                                locale: string;
                                name: string;
                                description?: string;
                            }) => ({
                                locale: t.locale,
                                name: t.name,
                                description: t.description || null,
                            }),
                        ),
                    },
                },
            },
            include: {
                translations: true,
            },
        });

        return NextResponse.json(
            { success: true, data: newCategory },
            { status: 200 },
        );
    } catch (error) {
        return handleError(error, "Lỗi khi tạo danh mục sản phẩm");
    }
}

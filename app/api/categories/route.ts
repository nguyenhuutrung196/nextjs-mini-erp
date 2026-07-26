import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json(
                {
                    success: false,
                    message: error.message,
                },
                { status: 500 },
            );
        } else {
            console.error(error);
        }
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
    } catch (error: unknown) {
        // check error type from Prisma Client
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Slug của danh mục đã tồn tại",
                    },
                    { status: 400 },
                );
            } else {
                console.error(error);
            }
        }

        if (error instanceof Error) {
            return NextResponse.json(
                {
                    success: false,
                    message: error.message,
                },
                { status: 500 },
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: "Lỗi khi tạo danh mục sản phẩm",
            },
            { status: 500 },
        );
    }
}

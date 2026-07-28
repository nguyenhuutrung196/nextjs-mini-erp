import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleError } from "@/lib/error-handler";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> },
) {
    try {
        const { slug } = await params;
        const product = await prisma.product.findUnique({
            where: { slug: slug },
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
                    message: `Không tìm thấy sản phẩm nào ứng với slug ${slug}`,
                },
                { status: 404 },
            );
        }

        return NextResponse.json(
            { success: true, data: product },
            { status: 200 },
        );
    } catch (error) {
        return handleError(error, "Lỗi khi lấy sản phẩm theo slug");
    }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleError } from "@/lib/error-handler";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> },
) {
    try {
        const { slug } = await params;
        const category = await prisma.category.findUnique({
            where: { slug },
            include: {
                translations: true,
            },
        });

        if (!category) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Không tìm thấy danh mục sản phẩm nào ứng với slug ${slug}`,
                },
                { status: 404 },
            );
        }

        return NextResponse.json(
            { success: true, data: category },
            { status: 200 },
        );
    } catch (error) {
        return handleError(error, "Lỗi khi lấy danh mục sản phẩm theo slug");
    }
}

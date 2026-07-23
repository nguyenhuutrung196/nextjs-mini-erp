import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: {
                variants: true,
                translations: true,
            },
        });

        return NextResponse.json(
            { success: true, data: products },
            { status: 200 },
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Lỗi kết nối cơ sở dữ liệu",
            },
            { status: 500 },
        );
    }
}

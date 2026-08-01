import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const existingAdmin = await prisma.user.findFirst({
            where: {
                email: "admin@my-mini-erp.com",
            },
        });

        if (existingAdmin) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Admin đã tồn tại trong hệ thống",
                },
                { status: 400 },
            );
        }
        const newAdmin = await prisma.user.create({
            data: {
                email: "admin@my-mini-erp.com",
                name: "Admin",
                role: "ADMIN",
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Admin đã tạo thành công",
                data: newAdmin,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            {
                success: false,
                message: "Lỗi khi tạo admin",
            },
            { status: 500 },
        );
    }
}

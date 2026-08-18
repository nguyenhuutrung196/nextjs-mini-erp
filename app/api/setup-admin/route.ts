import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

        //set password default
        const hashedPassword = await bcrypt.hash("admin123", 10);

        const newAdmin = await prisma.user.create({
            data: {
                email: "admin@my-mini-erp.com",
                password: hashedPassword,
                name: "Admin",
                role: "ADMIN",
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Admin đã tạo thành công với mật khẩu mặc định",
                data: { email: newAdmin.email, role: newAdmin.role },
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

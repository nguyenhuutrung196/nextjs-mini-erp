import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export function handleError(
    error: unknown,
    defaultMessage = "Lỗi hệ thống không xác định",
) {
    console.error("[API ERROR SYSTEM LOG]: ", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2002": // unique constraint
                return NextResponse.json(
                    {
                        success: false,
                        message: "Dữ liệu đã tồn tại trong hệ thống",
                    },
                    { status: 400 },
                );
            case "P2003": // foreign key constraint
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Dữ liệu không hợp lệ do vi phạm liên kết dữ liệu",
                    },
                    { status: 400 },
                );
            case "P2025": // cannot find record table
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Không tìm thấy bản ghi yêu cầu trong cơ sở dữ liệu",
                    },
                    { status: 404 },
                );
            default:
                return NextResponse.json(
                    {
                        success: false,
                        message: `Lỗi truy vấn cơ sở dữ liệu: ${error.message}`,
                    },
                    { status: 500 },
                );
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
            message: defaultMessage,
        },
        { status: 500 },
    );
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { VNPay, ProductCode, VnpLocale, HashAlgorithm } from "vnpay";

const vnpay = new VNPay({
    tmnCode: process.env.VNP_TMNCODE!,
    secureSecret: process.env.VNP_HASHSECRET!,
    vnpayHost: "https://sandbox.vnpayment.vn",
    testMode: true,
    hashAlgorithm: HashAlgorithm.SHA512,
});

export async function POST(request: Request) {
    try {
        // find current pending order
        const activeOrder = await prisma.order.findFirst({
            where: { status: "PENDING" },
        });

        if (!activeOrder) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Không tìm thấy đơn hàng nào đang chờ thanh toán",
                },
                { status: 400 },
            );
        }

        //create url for VNPay payment
        const urlString = vnpay.buildPaymentUrl({
            vnp_Amount: activeOrder.total, // Thư viện tự động nhân 100 cho VNPay
            vnp_IpAddr: "127.0.0.1", // Trong thực tế, bạn lấy IP từ request header
            vnp_TxnRef: activeOrder.id, // Dùng chính UUID của đơn hàng làm mã giao dịch
            vnp_OrderInfo: `Thanh toan don hang ${activeOrder.id}`,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: process.env.VNP_RETURN_URL!,
            vnp_Locale: VnpLocale.VN, // translation locale
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    checkoutUrl: urlString,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            {
                success: false,
                error: "Lỗi tạo link VNPay",
            },
            { status: 500 },
        );
    }
}

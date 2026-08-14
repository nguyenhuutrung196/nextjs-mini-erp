import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
    VNPay,
    IpnSuccess,
    IpnFailChecksum,
    IpnOrderNotFound,
    IpnInvalidAmount,
    InpOrderAlreadyConfirmed,
    ReturnQueryFromVNPay,
    IpnUnknownError,
    HashAlgorithm,
} from "vnpay";

const vnpay = new VNPay({
    tmnCode: process.env.VNP_TMNCODE!,
    secureSecret: process.env.VNP_HASHSECRET!,
    vnpayHost: "https://sandbox.vnpayment.vn",
    testMode: true,
    hashAlgorithm: HashAlgorithm.SHA512,
});

export async function GET(request: Request) {
    try {
        //get params from url vnpay
        const { searchParams } = new URL(request.url);
        const query = Object.fromEntries(
            searchParams.entries(),
        ) as unknown as ReturnQueryFromVNPay;

        //checksum validation by library
        const verify = vnpay.verifyIpnCall(query);
        if (!verify.isVerified) {
            return NextResponse.json(IpnFailChecksum);
        }

        //find order in db
        const orderId = verify.vnp_TxnRef;
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: { variant: true },
                },
            },
        });

        if (!order) return NextResponse.json(IpnOrderNotFound);

        //check amount is correct
        if (order.total !== verify.vnp_Amount) {
            return NextResponse.json(IpnInvalidAmount);
        }

        //check Idepotency complete or not
        if (order.status === "PAID" || order.status === "CANCELED") {
            return NextResponse.json(InpOrderAlreadyConfirmed);
        }

        //Handle payment status from vnpay
        if (verify.isSuccess) {
            //run transaction to update and minus stock
            await prisma.$transaction(async (tx) => {
                //update order status
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        status: "PAID",
                    },
                });

                //write log order history
                await tx.orderStatusHistory.create({
                    data: {
                        orderId,
                        status: "PAID",
                        note: `Thanh toán thành công qua VNPay. Mã giao dịch: ${query.vnp_TransactionNo}`,
                        changeBy: "SYSTEM_VNPAY",
                    },
                });

                //create payment
                await tx.payment.create({
                    data: {
                        orderId,
                        method: "VNPAY",
                        status: "SUCCESS",
                        transactionId: query.vnp_TransactionNo
                            ? String(query.vnp_TransactionNo)
                            : undefined,
                    },
                });

                //asynchronously update stock
                for (const item of order.items) {
                    const variant = item.variant;
                    const newStock = variant.stock - item.quantity;

                    if (newStock < 0) {
                        throw new Error(
                            `Sản phẩm ${variant.sku} đã hết hàng trong quá trình xử lý`,
                        );
                    }

                    await tx.productVariant.update({
                        where: { id: variant.id },
                        data: {
                            stock: newStock,
                        },
                    });
                }
            });
        } else {
            //payment failed, guest canceled or other reason
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: "CANCELED",
                },
            });
        }

        return NextResponse.json(IpnSuccess);
    } catch (error) {
        console.error(error);
        return NextResponse.json(IpnUnknownError);
    }
}

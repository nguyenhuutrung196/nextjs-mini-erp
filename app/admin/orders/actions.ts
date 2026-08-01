"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(orderId: string) {
    //get current user
    const currentUser = await prisma.user.findFirst();

    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "EMPLOYEE") {
        throw new Error("403 - Không có quyền truy cập");
    }

    //update database
    await prisma.order.update({
        where: { id: orderId },
        data: { status: "SHIPPED" },
    });

    //clear cache to reload data table
    revalidatePath("/admin/orders");
    return { success: true };
}

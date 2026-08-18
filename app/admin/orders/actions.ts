"use server";

import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(orderId: string) {
    await requireAdmin();

    //update database
    await prisma.order.update({
        where: { id: orderId },
        data: { status: "SHIPPED" },
    });

    //clear cache to reload data table
    revalidatePath("/admin/orders");
    return { success: true };
}

"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";

export async function createCategoryAction(formData: FormData) {
    try {
        const name = formData.get("name") as string;
        const slug = formData.get("slug") as string;
        const description = formData.get("description") as string;

        if (!name || !slug) {
            throw new Error(
                "Thiếu thông tin bắt buộc để tạo danh mục sản phẩm",
            );
        }

        const currentUser = await prisma.user.findFirst();
        if (currentUser?.role !== "ADMIN" && currentUser?.role !== "EMPLOYEE") {
            throw new Error("403 - Không có quyền truy cập");
        }

        const existingCategory = await prisma.category.findUnique({
            where: { slug },
        });

        if (existingCategory) {
            throw new Error("Danh mục sản phẩm đã tồn tại trong hệ thống");
        }

        await prisma.category.create({
            data: {
                slug,
                translations: {
                    create: [
                        {
                            locale: "vi",
                            name: name,
                            description: description,
                        },
                    ],
                },
            },
        });

        revalidatePath("/admin/categories");
        return { success: true };
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error creating category:", error.message);
        }
    }
}

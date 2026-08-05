import prisma from "@/lib/prisma";
import AdminCategoriesClient from "./AdminCategoriesClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
    const categories = await prisma.category.findMany({
        orderBy: {
            createdAt: "desc",
        },
        include: {
            translations: true,
            _count: {
                select: {
                    products: true, // đếm số lượng sản phẩm trong danh mục
                },
            },
        },
    });

    return (
        <div>
            <AdminCategoriesClient initialCategories={categories} />
        </div>
    );
}

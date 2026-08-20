import prisma from "@/lib/prisma";
import AdminProductsClient from "./AdminProductsClient";
import { getCategoriesForSelectAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
    // 1. Fetch all products with option values of variants
    const products = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            translations: true,
            category: {
                include: {
                    translations: {
                        where: { locale: "vi" },
                    },
                },
            },
            variants: {
                include: {
                    optionValues: {
                        include: {
                            option: true,
                        },
                    },
                },
            },
        },
    });

    // 2. Fetch category list in dropdown
    const categories = await getCategoriesForSelectAction();

    return (
        <div className="p-6">
            <AdminProductsClient
                initialProducts={products}
                categories={categories}
            />
        </div>
    );
}

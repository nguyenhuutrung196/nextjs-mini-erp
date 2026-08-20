import prisma from "@/lib/prisma";
import AdminProductsClient from "./AdminProductsClient";
import { getCategoriesForSelectAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const currentPage = Number(params?.page) || 1;
    const searchQuery = (params?.search as string) || "";
    const ITEMS_PER_PAGE = 1; //limit items per page

    // create condition for search
    const whereCondition = searchQuery
        ? {
              translations: {
                  some: {
                      locale: "vi",
                      name: {
                          contains: searchQuery,
                          mode: "insensitive" as const,
                      },
                  },
              },
          }
        : {};

    //fetch total amount of products to show pagination
    const totalItems = await prisma.product.count({
        where: whereCondition,
    });
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    // 1. Fetch all products with option values of variants
    const products = await prisma.product.findMany({
        where: whereCondition,
        orderBy: { createdAt: "desc" },
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
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
                currentPage={currentPage}
                totalPages={totalPages}
                initialSearch={searchQuery}
            />
        </div>
    );
}

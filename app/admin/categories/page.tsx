import prisma from "@/lib/prisma";
import CategoryForm from "./CategoryForm";

export default async function AdminCategoriesPage() {
    const categories = await prisma.category.findMany({
        orderBy: {
            createdAt: "desc",
        },
        include: {
            translations: {
                where: { locale: "vi" },
            },
            _count: {
                select: {
                    products: true, // đếm số lượng sản phẩm trong danh mục
                },
            },
        },
    });

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
                Quản lý danh mục sản phẩm
            </h1>

            <CategoryForm />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-200 text-gray-700">
                            <th className="p-4 border-b">
                                Tên danh mục sản phẩm
                            </th>
                            <th className="p-4 border-b">
                                Đường dẫn danh mục sản phẩm
                            </th>
                            <th className="p-4 border-b">Số lượng sản phẩm</th>
                            <th className="p-4 border-b">Ngày tạo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.length === 0 ? (
                            <tr className="hover:bg-gray-50">
                                <td colSpan={4} className="p-4 text-center">
                                    Chưa có danh mục sản phẩm nào
                                </td>
                            </tr>
                        ) : (
                            categories.map((category) => {
                                const viTranslation = category[
                                    "translations"
                                ].find((t) => t.locale === "vi");

                                return (
                                    <tr
                                        key={category.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="p-4 border-b font-medium text-gray-900">
                                            {viTranslation?.name ||
                                                "Chưa có tên"}
                                        </td>
                                        <td className="p-4 border-b text-sm font-mono text-gray-500">
                                            /{category.slug}
                                        </td>
                                        <td className="p-4 border-b">
                                            <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs font-bold">
                                                {category._count.products} SP
                                            </span>
                                        </td>
                                        <td className="p-4 border-b text-sm text-gray-600">
                                            {category.createdAt.toLocaleDateString(
                                                "vi-VN",
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

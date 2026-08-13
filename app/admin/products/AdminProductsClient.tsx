"use client";

import { useState } from "react";
import ProductModal from "./ProductModal";
import Link from "next/link";

export default function AdminProductsClient({
    initialProducts,
    categories,
}: {
    initialProducts: any[];
    categories: { id: string; name: string }[];
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");

    const handleEditClick = (product: any) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    //filter in Warehouse 5
    const filteredProducts =
        selectedCategoryFilter === "ALL"
            ? initialProducts
            : initialProducts.filter(
                  (product) =>
                      product?.categoryId?.trim() ===
                      selectedCategoryFilter?.trim(),
              );
    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        Quản lý Sản Phẩm
                    </h1>
                    <p className="text-sm text-gray-500">
                        Quản lý kho hàng, thông tin bản dịch và các biến thể sản
                        phẩm.
                    </p>
                </div>

                <button
                    onClick={handleAddClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-md transition-all flex items-center gap-1"
                >
                    ➕ Thêm Sản Phẩm Mới
                </button>
            </div>

            {/* Lọc danh mục */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                <button
                    onClick={() => setSelectedCategoryFilter("ALL")}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                        selectedCategoryFilter === "ALL"
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                    }`}
                >
                    Tất cả danh mục
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryFilter(cat.id)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                            selectedCategoryFilter === cat.id
                                ? "bg-gray-900 text-white"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                        }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-100">
                            <th className="p-4">Hình ảnh</th>
                            <th className="p-4">Tên Sản Phẩm (VI)</th>
                            <th className="p-4">Danh mục</th>
                            <th className="p-4">Đường dẫn / Slug</th>
                            <th className="p-4">Giá cơ bản</th>
                            <th className="p-4">Kho hàng (Std)</th>
                            <th className="p-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="p-8 text-center text-gray-500"
                                >
                                    Chưa có sản phẩm nào thuộc bộ lọc này. Hãy
                                    thêm sản phẩm mới!
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product: any) => {
                                const viTrans = product.translations.find(
                                    (t: any) => t.locale === "vi",
                                );
                                const totalStock = product.variants.reduce(
                                    (acc: number, curr: any) =>
                                        acc + curr.stock,
                                    0,
                                );
                                const viCategoryTrans =
                                    product.category?.translations?.[0];
                                const categoryName =
                                    viCategoryTrans?.name || "Chưa phân loại";

                                return (
                                    <tr
                                        key={product.id}
                                        className="hover:bg-gray-50/80 transition-colors border-b border-gray-50"
                                    >
                                        <td className="p-4">
                                            {product.images?.[0] ? (
                                                <img
                                                    src={product.images[0]}
                                                    alt="SP"
                                                    className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                                                    Không ảnh
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-gray-900">
                                                {viTrans?.name ||
                                                    "Chưa đặt tên"}
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono">
                                                ID: {product.id.slice(0, 8)}...
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-blue-50 text-blue-800 py-1 px-3 rounded-full text-xs font-semibold border border-blue-100 whitespace-nowrap">
                                                {categoryName}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-mono text-gray-500">
                                            /product/{product.slug}
                                        </td>
                                        <td className="p-4 font-semibold text-gray-800">
                                            {product.basePrice.toLocaleString(
                                                "vi-VN",
                                            )}{" "}
                                            đ
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    totalStock > 0
                                                        ? "bg-green-50 text-green-700 border border-green-100"
                                                        : "bg-red-50 text-red-700 border border-red-100"
                                                }`}
                                            >
                                                {totalStock} trong kho
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() =>
                                                    handleEditClick(product)
                                                }
                                                className="bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-bold px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-200 transition text-sm mr-2"
                                            >
                                                ✏️ Sửa
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal - Chỉ render khi thực sự mở để ép mount mới */}
            {isModalOpen && (
                <ProductModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    productData={selectedProduct}
                />
            )}
        </div>
    );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteProductAction, restoreProductAction } from "./actions";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { AdminProduct, AdminTranslation } from "@/types/erp";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";

//lazy load modal
const ProductModal = dynamic(() => import("./ProductModal"), {
    ssr: false, //turn off server side rendering cause it's UI
    loading: () => (
        <p className="text-xs text-gray-400 p-4">Đang tải công cụ sửa...</p>
    ),
});

export default function AdminProductsClient({
    initialProducts,
    categories,
    currentPage,
    totalPages,
    initialSearch,
}: {
    initialProducts: AdminProduct[];
    categories: { id: string; name: string }[];
    currentPage: number;
    totalPages: number;
    initialSearch: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchInput, setSearchInput] = useState(initialSearch);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(
        null,
    );
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState<
        "ALL" | "ACTIVE" | "HIDDEN"
    >("ALL");

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleEditClick = (product: AdminProduct) => {
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

    const handleDeleteClick = async (id: string, name: string) => {
        setProductToDelete({ id, name });
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;

        setIsUpdating(true);
        const toastId = toast.loading(
            `Đang xóa sản phẩm ${productToDelete?.name}...`,
        );
        try {
            const res = await deleteProductAction(productToDelete?.id);
            if (res?.success) {
                toast.success(
                    `Đã xóa sản phẩm ${productToDelete?.name} thành công!`,
                    {
                        id: toastId,
                    },
                );
                setIsDeleteModalOpen(false);
            } else {
                toast.error(`Lỗi xóa sản phẩm ${productToDelete?.name}`, {
                    id: toastId,
                });
            }
        } catch {
            toast.error(`Lỗi xóa sản phẩm ${productToDelete?.name}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRestoreClick = async (id: string, name: string) => {
        setIsUpdating(true);

        const toastId = toast.loading(`Đang khôi phục sản phẩm ${name}...`);

        try {
            const res = await restoreProductAction(id);
            if (res?.success) {
                toast.success(`Đã khôi phục sản phẩm ${name} thành công!`, {
                    id: toastId,
                });
            } else {
                toast.error(`Lỗi: ${res?.error}`, { id: toastId });
            }
        } catch {
            toast.error("Lỗi hệ thống", { id: toastId });
        } finally {
            setIsUpdating(false);
        }
    };

    //filter in Warehouse 5
    const filteredProducts = initialProducts.filter((product) => {
        const matchCategory =
            selectedCategoryFilter === "ALL" ||
            product.categoryId === selectedCategoryFilter;

        const isProductActive = product.isActive != false;

        const matchStatus =
            statusFilter === "ALL" ||
            (statusFilter === "ACTIVE" && isProductActive) ||
            (statusFilter === "HIDDEN" && !isProductActive);

        return matchCategory && matchStatus;
    });

    //handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (searchInput) {
            params.set;
        } else {
            params.delete("search");
        }
        params.set("page", "1"); // restore page to 1
        router.push(`/admin/products?${params.toString()}`);
    };

    //handle pagination
    const handlePageChange = (nesPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", nesPage.toString());
        router.push(`/admin/products?${params.toString()}`);
    };

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

            {/* Search Bar */}
            <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
                <form
                    onSubmit={handleSearch}
                    className="flex gap-2 w-full md:w-1/3 "
                >
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Tìm kiếm..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-md transition-all flex items-center gap-1"
                    >
                        Tìm
                    </button>
                </form>
            </div>

            {/* Lọc trạng thái */}
            <div className="mb-6 flex flex-col gap-4">
                <div className="flex gap-2">
                    {["ALL", "ACTIVE", "HIDDEN"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                                statusFilter === status
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {status === "ALL"
                                ? "Tất cả trạng thái"
                                : status === "ACTIVE"
                                  ? "Đang bán"
                                  : "Đã ẩn"}
                        </button>
                    ))}
                </div>
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
                            filteredProducts.map((product: AdminProduct) => {
                                const viTrans = product.translations.find(
                                    (t: AdminTranslation) => t.locale === "vi",
                                );
                                const totalStock = product.variants.reduce(
                                    (acc: number, curr: { stock: number }) =>
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
                                        className={`transition-colors border-b border-gray-50 ${!product.isActive ? "bg-gray-50 opacity-75" : "hover:bg-gray-50/80"}`}
                                    >
                                        <td className="p-4">
                                            {product.images?.[0] ? (
                                                <Image
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
                                            {!product.isActive && (
                                                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-lg mr-3">
                                                    Đã ẩn
                                                </span>
                                            )}

                                            <button
                                                onClick={() =>
                                                    handleEditClick(product)
                                                }
                                                className="bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-bold px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-200 transition text-sm mr-2"
                                            >
                                                Sửa
                                            </button>

                                            {product.isActive ? (
                                                <button
                                                    onClick={() =>
                                                        handleDeleteClick(
                                                            product.id,
                                                            viTrans?.name ||
                                                                "Sản phẩm",
                                                        )
                                                    }
                                                    disabled={isUpdating}
                                                    className="bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-100 transition text-sm"
                                                >
                                                    Ẩn
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        handleRestoreClick(
                                                            product.id,
                                                            viTrans?.name ||
                                                                "Sản phẩm",
                                                        )
                                                    }
                                                    disabled={isUpdating}
                                                    className="bg-green-50 text-green-700 font-bold px-3 py-1.5 rounded-lg border border-green-100 hover:bg-green-100 transition text-sm"
                                                >
                                                    Khôi phục
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-sm text-gray-500 font-medium">
                        Trang {currentPage} / {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-gray-50"
                        >
                            Trước
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-gray-50"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}

            {/* Modal - Chỉ render khi thực sự mở để ép mount mới */}
            {isModalOpen && (
                <ProductModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    productData={selectedProduct}
                />
            )}

            {isDeleteModalOpen && (
                <ConfirmDeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Xác nhận ẩn sản phẩm"
                    itemName={productToDelete?.name || "sản phẩm"}
                    warningMessage="Khách hàng sẽ không thể nhìn thấy hoặc mua sản phẩm này nữa."
                    isLoading={isUpdating}
                    actionType="hide"
                />
            )}
        </div>
    );
}

"use client";

import { useState } from "react";
import CategoryModal from "./CategoryModal";
import { toast } from "sonner";
import { deleteCategoryAction } from "./actions";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { AdminCategory, AdminTranslation } from "@/types/erp";

export default function AdminCategoriesClient({
    initialCategories,
}: {
    initialCategories: AdminCategory[];
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] =
        useState<AdminCategory | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEditClick = (category: AdminCategory) => {
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setSelectedCategory(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCategory(null);
    };

    const handleDeleteClick = async (id: string, name: string) => {
        setCategoryToDelete({ id, name });
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return;
        setIsDeleting(true);
        const toastId = toast.loading(
            `Đang xóa danh mục ${categoryToDelete.name}...`,
        );

        try {
            const res = await deleteCategoryAction(categoryToDelete.id);
            if (res?.success) {
                toast.success(
                    `Đã xóa danh mục ${categoryToDelete.name} thành công!`,
                    {
                        id: toastId,
                    },
                );
                setIsDeleteModalOpen(false);
                setCategoryToDelete(null);
            } else {
                toast.error(`Lỗi xóa danh mục ${categoryToDelete.name}`, {
                    id: toastId,
                });
            }
        } catch {
            toast.error(`Lỗi xóa danh mục ${categoryToDelete.name}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    Quản lý Danh Mục
                </h1>
                <button
                    onClick={handleAddClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-1"
                >
                    + Thêm Danh Mục Mới
                </button>
            </div>

            {/* Bảng hiển thị danh mục */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-700 font-bold">
                            <th className="p-4 border-b">Tên Danh Mục (VI)</th>
                            <th className="p-4 border-b">Tên (EN)</th>
                            <th className="p-4 border-b">Đường dẫn (Slug)</th>
                            <th className="p-4 border-b">Số Sản Phẩm</th>
                            <th className="p-4 border-b text-right">
                                Hành Động
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialCategories.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="p-8 text-center text-gray-500"
                                >
                                    Chưa có danh mục nào. Hãy click vào nút phía
                                    trên để thêm mới!
                                </td>
                            </tr>
                        ) : (
                            initialCategories.map((category) => {
                                const viTrans = category.translations.find(
                                    (t: AdminTranslation) => t.locale === "vi",
                                );
                                const enTrans = category.translations.find(
                                    (t: AdminTranslation) => t.locale === "en",
                                );

                                return (
                                    <tr
                                        key={category.id}
                                        className="hover:bg-gray-50/80 transition-colors"
                                    >
                                        <td className="p-4 border-b font-semibold text-gray-900">
                                            {viTrans?.name || "Chưa dịch"}
                                        </td>
                                        <td className="p-4 border-b text-gray-600">
                                            {enTrans?.name || (
                                                <span className="text-gray-400 italic text-xs">
                                                    Chưa dịch
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 border-b text-sm font-mono text-gray-500">
                                            /{category.slug}
                                        </td>
                                        <td className="p-4 border-b">
                                            <span className="bg-blue-50 text-blue-700 py-1 px-3 rounded-full text-xs font-bold border border-blue-100">
                                                {category._count?.products} SP
                                            </span>
                                        </td>
                                        <td className="p-4 border-b text-right">
                                            <button
                                                onClick={() =>
                                                    handleEditClick(category)
                                                }
                                                className="bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-bold px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-200 transition text-sm mr-2"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDeleteClick(
                                                        category.id,
                                                        viTrans?.name ||
                                                            "Danh mục",
                                                    )
                                                }
                                                disabled={isDeleting}
                                                className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg border border-red-100 hover:border-red-300 transition text-sm disabled:opacity-50"
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <CategoryModal
                    key={
                        selectedCategory ? selectedCategory.id : "new-category"
                    }
                    isOpen={isModalOpen}
                    onClose={() => handleCloseModal()}
                    categoryData={selectedCategory}
                />
            )}

            {isDeleteModalOpen && (
                <ConfirmDeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Xác nhận xóa danh mục"
                    itemName={categoryToDelete?.name || "danh mục"}
                    warningMessage="Hệ thống sẽ từ chối xóa nếu danh mục này đang chứa sản phẩm."
                    isLoading={isDeleting}
                />
            )}
        </div>
    );
}

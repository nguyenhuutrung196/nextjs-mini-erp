"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { autoTranslateAction, upsertCategoryAction } from "./actions";

const SUPPORT_LOCALES = [
    { code: "vi", label: "Tiếng Việt" },
    { code: "en", label: "English" },
    { code: "ja", label: "Japanese" },
];

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    categoryData: any | null; //create category or update category
}

function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") //xóa dấu
        .replace(/[^a-z0-9]+/g, "-") //xóa các ký tự không phải chữ cái
        .replace(/\s+/g, "-") //thay thế khoảng trắng bằng dấu gạch nối
        .replace(/-+/g, "-"); // xóa gạch nối thừa
}

export default function CategoryModal({
    isOpen,
    onClose,
    categoryData,
}: CategoryModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("vi");
    const [slug, setSlug] = useState("");

    // declare state for translations
    const [translations, setTranslations] = useState<
        Record<string, { name: string; description: string }>
    >({
        vi: { name: "", description: "" },
        en: { name: "", description: "" },
        ja: { name: "", description: "" },
    });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleTranslationChange = (
        locale: string,
        field: "name" | "description",
        value: string,
    ) => {
        setTranslations((prevState) => ({
            ...prevState,
            [locale]: {
                ...prevState[locale],
                [field]: value,
            },
        }));

        if (locale === "vi" && field === "name" && !categoryData) {
            setSlug(generateSlug(value));
        }
    };

    const handleAutoTranslate = async (targetLocale: string) => {
        const sourceName = translations.vi.name;
        const sourceDesc = translations.vi.description;

        if (!sourceName) {
            toast.warning(
                "Vui lòng nhập tên danh mục Tiếng Việt trước khi dịch",
            );
        }

        const langLabel = targetLocale === "en" ? "English" : "Japanese";
        const toastId = toast.loading(`Đang dịch thành ${langLabel}...`);

        try {
            const nameRes = await autoTranslateAction(
                sourceName,
                "vi",
                targetLocale,
            );

            if (nameRes && nameRes.success) {
                handleTranslationChange(
                    targetLocale,
                    "name",
                    nameRes.text || "",
                );

                if (sourceDesc) {
                    const descRes = await autoTranslateAction(
                        sourceDesc,
                        "vi",
                        targetLocale,
                    );
                    if (descRes && descRes.success) {
                        handleTranslationChange(
                            targetLocale,
                            "description",
                            descRes.text || "",
                        );
                    }
                }
                toast.success(`Đã dịch thành ${langLabel} thành công!`, {
                    id: toastId,
                });
            } else {
                toast.error(`Lỗi dịch thuật: ${nameRes?.error}`, {
                    id: toastId,
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi kết nối với Google Translate", { id: toastId });
        }
    };

    // handle submit to save database
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const formattedTranslations = Object.entries(translations)
            .map(([locale, data]) => ({
                locale,
                name: data.name.trim(),
                description: data.description.trim() || null,
            }))
            .filter((t) => t.name !== "");
        const res = await upsertCategoryAction(
            categoryData ? categoryData.id : null,
            slug.trim(),
            formattedTranslations,
        );

        if (res?.success) {
            toast.success(
                categoryData
                    ? "Cập nhật danh mục sản phẩm thành công!"
                    : "Tạo danh mục sản phẩm thành công!",
            );
            onClose();
        } else {
            toast.error("Lỗi hệ thống khi cập nhật danh mục sản phẩm!");
        }

        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">
                        {categoryData
                            ? "✏️ Chỉnh Sửa Danh Mục"
                            : "➕ Thêm Danh Mục Mới"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 font-bold text-xl transition-colors"
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                {/* Form Body */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto p-6 space-y-6"
                >
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2">
                        <label className="block text-xs font-extrabold text-blue-800 uppercase tracking-wider">
                            Đường dẫn tĩnh (Slug)
                        </label>
                        <input
                            required
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            className="w-full px-4 py-2.5 border border-blue-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm transition-all"
                            placeholder="duong-dan-danh-muc-vi-du"
                        />
                        <p className="text-xs text-blue-600/80">
                            💡 Khuyên dùng: Giữ slug ở dạng không dấu và phân
                            tách bằng dấu gạch ngang (-) để tối ưu hóa SEO
                        </p>
                    </div>

                    {/* Tab Selection */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Ngôn Ngữ Nhập Liệu
                        </label>
                        <div className="flex bg-gray-100 p-1 rounded-lg gap-1 border border-gray-200">
                            {SUPPORT_LOCALES.map((tab) => (
                                <button
                                    key={tab.code}
                                    type="button"
                                    onClick={() => setActiveTab(tab.code)}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                                        activeTab === tab.code
                                            ? "bg-white text-blue-600 shadow-sm"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                                    }`}
                                >
                                    {tab.label}{" "}
                                    {translations[tab.code].name ? "✅" : ""}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Tab Inputs */}
                    {SUPPORT_LOCALES.map((tab) => {
                        if (tab.code !== activeTab) return null;
                        return (
                            <div
                                key={tab.code}
                                className="space-y-4 p-5 border border-gray-100 rounded-xl bg-white shadow-sm duration-200 animate-fadeIn"
                            >
                                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                    <span className="text-sm font-bold text-gray-800">
                                        Thông tin [{tab.label}]
                                    </span>
                                    {tab.code !== "vi" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleAutoTranslate(tab.code)
                                            }
                                            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full font-bold transition-colors flex items-center gap-1.5 border border-blue-200 shadow-sm"
                                        >
                                            🤖 Tự động dịch từ Tiếng Việt
                                        </button>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Tên danh mục{" "}
                                        <span className="text-red-500">
                                            {tab.code === "vi" ? "*" : ""}
                                        </span>
                                    </label>
                                    <input
                                        required={tab.code === "vi"}
                                        type="text"
                                        value={translations[tab.code].name}
                                        onChange={(e) =>
                                            handleTranslationChange(
                                                tab.code,
                                                "name",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder={`Nhập tên bằng ${tab.label}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Mô tả danh mục
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={
                                            translations[tab.code].description
                                        }
                                        onChange={(e) =>
                                            handleTranslationChange(
                                                tab.code,
                                                "description",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder={`Nhập mô tả chi tiết bằng ${tab.label}`}
                                    />
                                </div>
                            </div>
                        );
                    })}

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-all disabled:opacity-50"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {isLoading
                                ? "Đang lưu..."
                                : categoryData
                                  ? "Lưu cập nhật"
                                  : "Tạo danh mục"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

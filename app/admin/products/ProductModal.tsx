"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getCategoriesForSelectAction, upsertProductAction } from "./actions";
import { autoTranslateAction } from "../categories/actions";

const SUPPORTED_LOCALES = [
    { code: "vi", label: "Tiếng Việt" },
    { code: "en", label: "English" },
    { code: "ja", label: "Japanese" },
];

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    productData: any | null; //create product or update product
}

function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/đ/g, "d") //chuyển đ thành d
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") //xóa dấu
        .replace(/[^a-z0-9]+/g, "-") //xóa các ký tự không phải chữ cái
        .replace(/\s+/g, "-") //thay thế khoảng trắng bằng dấu gạch nối
        .replace(/-+/g, "-"); // xóa gạch nối thừa
}

export default function ProductModal({
    isOpen,
    onClose,
    productData,
}: ProductModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("vi");
    const [categories, setCategories] = useState<
        { id: string; name: string }[]
    >([]);

    //category states
    const [categoryId, setCategoryId] = useState(
        productData ? productData?.category?.id : "",
    );
    const [slug, setSlug] = useState(productData ? productData.slug : "");
    const [basePrice, setBasePrice] = useState(
        productData ? productData.basePrice : 0,
    );
    const [imageUrl, setImageUrl] = useState(productData?.images?.[0] || "");

    const [translations, setTranslations] = useState<
        Record<string, { name: string; description: string }>
    >(() => {
        const tempTrans = {
            vi: { name: "", description: "" },
            en: { name: "", description: "" },
            ja: { name: "", description: "" },
        };
        if (productData) {
            productData.translations.forEach((t: any) => {
                if (t.locale in tempTrans) {
                    tempTrans[t.locale as keyof typeof tempTrans] = {
                        name: t.name,
                        description: t.description || "",
                    };
                }
            });
        }
        return tempTrans;
    });

    const [variantColor, setVariantColor] = useState<string>(() => {
        if (productData?.variants?.[0]?.optionValues) {
            const colorOption = productData.variants[0].optionValues.find(
                (ov: any) => ov.option?.name === "Màu sắc",
            );
            return colorOption?.value || "Tiêu chuẩn";
        }
        return "Tiêu chuẩn";
    });
    const [variantSize, setVariantSize] = useState<string>(() => {
        if (productData?.variants?.[0]?.optionValues) {
            const sizeOption = productData.variants[0].optionValues.find(
                (ov: any) => ov.option?.name === "Kích cỡ",
            );
            return sizeOption?.value || "Size M";
        }
    });
    const [sku, setSku] = useState(() => {
        return productData ? productData?.variants?.[0]?.sku : "";
    });
    const [price, setPrice] = useState<number>(() => {
        return productData?.variants?.[0]?.price !== undefined
            ? productData?.variants?.[0]?.price
            : productData?.basePrice || 0;
    });
    const [stock, setStock] = useState(() => {
        return productData?.variants?.[0]?.stock !== undefined
            ? productData?.variants?.[0]?.stock
            : 10;
    });

    useEffect(() => {
        getCategoriesForSelectAction().then((data) => {
            setCategories(data);
            if (data.length > 0 && !categoryId) {
                setCategoryId(data[0].id);
            }
        });
    }, [categoryId]);

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

        if (locale === "vi" && field === "name" && !productData) {
            setSlug(generateSlug(value));
            setSku("SKU - " + generateSlug(value).toUpperCase() + "- STD");
        }
    };

    const handleAutoTranslate = async (targetLocale: string) => {
        const sourceName = translations.vi.name;
        const sourceDesc = translations.vi.description;

        if (!sourceName) {
            toast.warning(
                "Vui lòng nhập tên sản phẩm Tiếng Việt trước khi dịch",
            );
            return;
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
            toast.error(`Lỗi dịch thuật: ${error}`);
        }
    };

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

        const variantList = [
            {
                sku:
                    sku.trim() ||
                    `SKU-${slug.toUpperCase()}-${variantColor.toUpperCase()}-${variantSize.toUpperCase()}`,
                price: Number(price) || Number(basePrice),
                stock: Number(stock),
                options: [
                    { optionName: "Màu sắc", value: variantColor },
                    { optionName: "Kích cỡ", value: variantSize },
                ],
            },
        ];

        const res = await upsertProductAction(
            productData ? productData.id : null,
            categoryId,
            slug.trim(),
            Number(basePrice),
            imageUrl ? [imageUrl.trim()] : [],
            formattedTranslations,
            variantList,
        );

        if (res?.success) {
            toast.success(
                productData
                    ? "Đã cập nhật sản phẩm thành công"
                    : "Đã tạo sản phẩm thành công",
            );
        } else {
            toast.error("Lỗi hệ thống khi cập nhật sản phẩm");
        }
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">
                        {productData
                            ? "✏️ Chỉnh Sửa Sản Phẩm"
                            : "🚀 Thêm Sản Phẩm Mới"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 font-bold text-xl"
                    >
                        ✕
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto p-6 space-y-6"
                >
                    {/* Cấu hình chung */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                Danh mục sản phẩm
                            </label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                Đường dẫn tĩnh (Slug)
                            </label>
                            <input
                                required
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                Giá bán cơ bản (VND)
                            </label>
                            <input
                                required
                                type="number"
                                value={basePrice}
                                onChange={(e) => {
                                    setBasePrice(Number(e.target.value));
                                    if (!price)
                                        setPrice(Number(e.target.value));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                Link ảnh sản phẩm (URL)
                            </label>
                            <input
                                type="text"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>
                    </div>

                    {/* Tabs Ngôn Ngữ */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Thông Tin Bản Dịch
                        </label>
                        <div className="flex bg-gray-100 p-1 rounded-lg gap-1 border border-gray-200">
                            {SUPPORTED_LOCALES.map((tab) => (
                                <button
                                    key={tab.code}
                                    type="button"
                                    onClick={() => setActiveTab(tab.code)}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                                        activeTab === tab.code
                                            ? "bg-white text-blue-600 shadow-sm"
                                            : "text-gray-600 hover:bg-gray-200/50"
                                    }`}
                                >
                                    {tab.label}{" "}
                                    {translations[tab.code].name ? "✅" : ""}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Inputs Đa Ngôn Ngữ */}
                    {SUPPORTED_LOCALES.map((tab) => {
                        if (tab.code !== activeTab) return null;
                        return (
                            <div
                                key={tab.code}
                                className="space-y-4 p-4 border border-gray-100 rounded-xl bg-white shadow-sm"
                            >
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-sm font-bold text-gray-800">
                                        Thông tin [{tab.label}]
                                    </span>
                                    {tab.code !== "vi" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleAutoTranslate(tab.code)
                                            }
                                            className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-100 transition"
                                        >
                                            🤖 Dịch tự động từ Tiếng Việt
                                        </button>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Tên sản phẩm *
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Mô tả sản phẩm
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        );
                    })}

                    {/* Cấu hình Biến Thể (80/20 core value) */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                        <h3 className="text-sm font-bold text-blue-900 border-b border-blue-100 pb-2">
                            📦 Thiết lập Phiên bản & Kho hàng (Standard Variant)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-blue-800 uppercase mb-1">
                                    Màu sắc
                                </label>
                                <input
                                    type="text"
                                    value={variantColor}
                                    onChange={(e) =>
                                        setVariantColor(e.target.value)
                                    }
                                    className="w-full px-2.5 py-1.5 border border-blue-200 bg-white rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-blue-800 uppercase mb-1">
                                    Size / Kích thước
                                </label>
                                <input
                                    type="text"
                                    value={variantSize}
                                    onChange={(e) =>
                                        setVariantSize(e.target.value)
                                    }
                                    className="w-full px-2.5 py-1.5 border border-blue-200 bg-white rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-blue-800 uppercase mb-1">
                                    Số lượng kho
                                </label>
                                <input
                                    type="number"
                                    value={stock}
                                    onChange={(e) =>
                                        setStock(Number(e.target.value))
                                    }
                                    className="w-full px-2.5 py-1.5 border border-blue-200 bg-white rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-blue-800 uppercase mb-1">
                                    Mã SKU
                                </label>
                                <input
                                    type="text"
                                    value={sku}
                                    onChange={(e) => setSku(e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-blue-200 bg-white rounded-md text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md"
                        >
                            {isLoading
                                ? "Đang lưu..."
                                : productData
                                  ? "Cập nhật"
                                  : "Tạo sản phẩm"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

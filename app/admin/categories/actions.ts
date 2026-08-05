"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface TranslationInput {
    locale: string;
    name: string;
    description?: string | null;
}

export async function upsertCategoryAction(
    id: string | null, //if id is null, create a new category, otherwise update the existing category
    slug: string,
    translations: TranslationInput[],
) {
    try {
        const currentUser = await prisma.user.findFirst();
        if (currentUser?.role !== "ADMIN" && currentUser?.role !== "EMPLOYEE") {
            throw new Error("403 - Không có quyền truy cập");
        }

        if (!slug || translations.length === 0) {
            throw new Error("Điền thông tin bắt buộc");
        }

        const defaultTranslation = translations.find((t) => t.locale === "vi");
        if (!defaultTranslation || !defaultTranslation.name) {
            throw new Error("Tên danh mục sản phẩm là bắt buộc");
        }

        const duplicateCategory = await prisma.category.findFirst({
            where: {
                slug: slug,
                NOT: id ? { id: id } : undefined, // exclude the current category if updating
            },
        });

        if (duplicateCategory) {
            throw new Error("Danh mục sản phẩm đã tồn tại");
        }

        if (id) {
            await prisma.category.update({
                where: { id },
                data: {
                    slug,
                    translations: {
                        upsert: translations.map((t) => ({
                            where: {
                                categoryId_locale: {
                                    categoryId: id,
                                    locale: t.locale,
                                },
                            },
                            update: {
                                name: t.name,
                                description: t.description || null,
                            },
                            create: {
                                locale: t.locale,
                                name: t.name,
                                description: t.description || null,
                            },
                        })),
                    },
                },
            });
        } else {
            await prisma.category.create({
                data: {
                    slug,
                    translations: {
                        create: translations.map((t) => ({
                            locale: t.locale,
                            name: t.name,
                            description: t.description || null,
                        })),
                    },
                },
            });
        }
        revalidatePath("/admin/categories");
        return { success: true };
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error creating category:", error.message);
        }
    }
}

export async function autoTranslateAction(
    text: string,
    fromLocale: string,
    toLocale: string,
) {
    try {
        if (!text) return { success: false, text: "" };

        const MAX_CHARS = 4000; // max characters for google translate
        if (text.length > MAX_CHARS) {
            throw new Error(
                `Văn bản quá dài (${text.length} ký tự). Giới hạn tối đa là ${MAX_CHARS} ký tự cho một lần dịch.`,
            );
        }

        //get API google translate
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLocale}&tl=${toLocale}&dt=t&q=${encodeURIComponent(text)}`;

        const response = await fetch(url, {
            method: "GET",
            next: { revalidate: 86400 },
        });

        if (!response.ok) throw new Error("Lỗi truy vấn API Google Translate");

        const data = await response.json();

        if (data?.[0] && Array.isArray(data[0])) {
            const translatedText = data[0]
                .map((item: any) => item?.[0] || "")
                .join("");

            return { success: true, text: translatedText || text };
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error in auto-translate:", error.message);
            return { success: false, error: error.message };
        }
    }
}

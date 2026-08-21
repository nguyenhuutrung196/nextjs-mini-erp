"use server";

import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ProductTranslationInput {
    locale: string;
    name: string;
    description?: string | null;
}

export interface VariantInput {
    sku: string;
    price: number;
    costPrice: number;
    stock: number;
    options: { optionName: string; value: string }[];
}

export async function getCategoriesForSelectAction() {
    try {
        const categories = await prisma.category.findMany({
            include: {
                translations: {
                    where: { locale: "vi" },
                },
            },
        });

        return categories.map((category) => ({
            id: category.id,
            name: category.translations?.[0]?.name || "Danh mục chưa dịch",
        }));
    } catch (error: unknown) {
        console.error(error);
        return [];
    }
}

export async function upsertProductAction(
    id: string | null,
    categoryId: string,
    slug: string,
    basePrice: number,
    images: string[],
    translations: ProductTranslationInput[],
    variants: VariantInput[],
) {
    try {
        await requireAdmin();

        if (
            !categoryId ||
            !slug ||
            translations.length === 0 ||
            variants.length === 0
        ) {
            throw new Error("Nhập đầy đủ thông tin bắt buộc");
        }

        //check slug is exist
        const duplicateProduct = await prisma.product.findFirst({
            where: {
                slug,
                NOT: id ? { id: id } : undefined, // exclude the current product if updating
            },
        });
        if (duplicateProduct) {
            throw new Error("Đường dẫn ${slug} đã tồn tại");
        }

        //validate basic data
        if (!variants || variants.length === 0) {
            throw new Error("Sản phẩm phải có ít nhất 1 biến thể");
        }

        //handle database through transaction
        const result = await prisma.$transaction(async (tx) => {
            if (id) {
                await tx.productTranslation.deleteMany({
                    where: { productId: id },
                });
                await tx.productOption.deleteMany({ where: { productId: id } });
                await tx.productVariant.deleteMany({
                    where: { productId: id },
                });
            }

            const product = id
                ? await tx.product.update({
                      where: { id },
                      data: { categoryId, slug, basePrice, images },
                  })
                : await tx.product.create({
                      data: { categoryId, slug, basePrice, images },
                  });

            const productId = product.id;

            //create product translation

            await tx.productTranslation.createMany({
                data: translations.map((t) => ({
                    productId,
                    locale: t.locale,
                    name: t.name,
                    description: t.description || null,
                })),
            });

            //create product option
            const optionsMap: Record<string, Set<string>> = {};
            variants.forEach((v) => {
                v.options.forEach((opt) => {
                    if (!optionsMap[opt.optionName]) {
                        optionsMap[opt.optionName] = new Set();
                    }
                    optionsMap[opt.optionName].add(opt.value);
                });
            });

            //save product option and option value to database
            const createdOptionValues: Record<
                string,
                Record<string, string>
            > = {};

            for (const [optionName, valuesSet] of Object.entries(optionsMap)) {
                const option = await tx.productOption.create({
                    data: {
                        productId,
                        name: optionName,
                    },
                });

                createdOptionValues[optionName] = {};
                for (const valueText of valuesSet) {
                    const optVal = await tx.productOptionValue.create({
                        data: {
                            optionId: option.id,
                            value: valueText,
                        },
                    });
                    createdOptionValues[optionName][valueText] = optVal.id;
                }
            }

            for (const v of variants) {
                const optionValueIds = v.options
                    .map((opt) => {
                        return createdOptionValues[opt.optionName]?.[opt.value];
                    })
                    .filter(Boolean);

                await tx.productVariant.create({
                    data: {
                        productId,
                        sku: v.sku,
                        price: v.price,
                        costPrice: v.costPrice,
                        stock: v.stock,
                        optionValues: {
                            connect: optionValueIds.map((id) => ({ id })),
                        },
                    },
                });
            }

            return product;
        });

        revalidatePath("/admin/products");
        return { success: true, product: result };
    } catch (error: unknown) {
        console.error(error);
        return {
            success: false,
            error: "Lỗi hệ thống khi thao tác với sản phẩm",
        };
    }
}

export async function deleteProductAction(id: string) {
    try {
        await requireAdmin();

        await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id },
            });

            if (!product) {
                throw new Error("Không tìm thấy sản phẩm này");
            }

            await tx.product.update({
                where: { id },
                data: { isActive: false },
            });

            const variants = await tx.productVariant.findMany({
                where: { productId: id },
            });

            for (const variant of variants) {
                await tx.productVariant.update({
                    where: { id: variant.id },
                    data: { isActive: false },
                });
            }
        });

        revalidatePath("/admin/products");
        return { success: true };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Lỗi hệ thống khi xóa sản phẩm" };
    }
}

export async function restoreProductAction(id: string) {
    try {
        await requireAdmin();

        await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id },
            });

            if (!product) {
                throw new Error("Không tìm thấy sản phẩm này");
            }

            await tx.product.update({
                where: { id },
                data: { isActive: true },
            });

            const variants = await tx.productVariant.findMany({
                where: { productId: id },
            });

            for (const variant of variants) {
                await tx.productVariant.update({
                    where: { id: variant.id },
                    data: { isActive: true },
                });
            }
        });

        revalidatePath("/admin/products");
        return { success: true };
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Lỗi hệ thống khi xóa sản phẩm" };
    }
}

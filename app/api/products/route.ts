import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleError } from "@/lib/error-handler";

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: {
                category: {
                    include: {
                        translations: true,
                    },
                },
                translations: true,
                options: {
                    include: {
                        values: true,
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
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(
            { success: true, data: products },
            { status: 200 },
        );
    } catch (error) {
        return handleError(error, "Lỗi khi lấy danh sách sản phẩm");
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            slug,
            basePrice,
            images,
            categoryId,
            translations,
            options,
            variants,
        } = body;

        if (
            !slug ||
            !basePrice ||
            !categoryId ||
            !translations ||
            !options ||
            !variants
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Thiếu thông tin bắt buộc để tạo dữ liệu sản phẩm",
                },
                { status: 400 },
            );
        }

        const newProductResult = await prisma.$transaction(async (tx) => {
            //task A: check Category exist
            const categoryExist = await tx.category.findUnique({
                where: { id: categoryId },
            });

            if (!categoryExist) {
                throw new Error("Danh mục sản phẩm không tồn tại");
            }

            //task B: create new Product and translations
            const product = await tx.product.create({
                data: {
                    slug,
                    basePrice: parseFloat(basePrice),
                    images: images || [],
                    categoryId,
                    translations: {
                        createMany: {
                            data: translations.map(
                                (t: {
                                    locale: string;
                                    name: string;
                                    description: string;
                                }) => ({
                                    locale: t.locale,
                                    name: t.name,
                                    description: t.description,
                                }),
                            ),
                        },
                    },
                },
            });

            // task C: create new options and values
            const optionValueIdMap = new Map<string, string>();
            for (const opt of options) {
                const createdOption = await tx.productOption.create({
                    data: {
                        productId: product.id,
                        name: opt.name,
                        values: {
                            create: opt.values.map((v: string) => ({
                                value: v,
                            })),
                        },
                    },
                    include: {
                        values: true,
                    },
                });

                createdOption.values.forEach((val) => {
                    optionValueIdMap.set(`${opt.name}: ${val.value}`, val.id);
                });
            }

            // task D: create new variants
            for (const variantData of variants) {
                const { sku, price, stock, optionCombo } = variantData;
                const connectedOptionValueIds = Object.entries(optionCombo).map(
                    ([optName, valName]) => {
                        const key = `${optName}: ${valName}`;
                        const id = optionValueIdMap.get(key);

                        if (!id) {
                            throw new Error(
                                `Không tìm thấy giá trị tùy chọn ${key}`,
                            );
                        }
                        return id;
                    },
                );

                // create new variant and link N-N relationship with optione value
                await tx.productVariant.create({
                    data: {
                        productId: product.id,
                        sku,
                        price: parseFloat(price),
                        stock: parseInt(stock),
                        optionValues: {
                            connect: connectedOptionValueIds.map(
                                (id: string) => ({ id }),
                            ),
                        },
                    },
                });

                // task E: get all info and return to client
                return await tx.product.findUnique({
                    where: { id: product.id },
                    include: {
                        translations: true,
                        options: {
                            include: {
                                values: true,
                            },
                        },
                        variants: {
                            include: {
                                optionValues: true,
                            },
                        },
                    },
                });
            }
        });

        return NextResponse.json(
            { success: true, data: newProductResult },
            { status: 201 },
        );
    } catch (error) {
        return handleError(error, "Lỗi khi tạo sản phẩm");
    }
}

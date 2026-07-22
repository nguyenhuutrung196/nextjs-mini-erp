export interface Translation {
    locale: "vi" | "en";
    name: string;
    description?: string;
}

export type UserRole = "ADMIN" | "EMPLOYEE" | "CUSTOMER";

export interface User {
    readonly id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
}

export interface ProductOptionValue {
    id: string;
    value: string;
}

export interface ProductOption {
    id: string;
    name: string;
    values: ProductOptionValue[];
}

export interface ProductVariant {
    id: string;
    sku: string;
    price: number;
    stock: number;
    optionValueIds: string[];
}

export interface Product {
    id: string;
    slug: string;
    basePrice: number;
    images: string[];
    category: {
        id: string;
        name: string;
    };
    options: ProductOption[];
    variants: ProductVariant[];
    translations: Translation[];
    createdAt: Date;
}

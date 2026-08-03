"use client";

import { useState } from "react";
import { createCategoryAction } from "./actions";
import { toast } from "sonner";

function generateSlug(text: string) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") //xóa dấu
        .replace(/[^a-z0-9]+/g, "-") //xóa các ký tự không phải chữ cái
        .replace(/\s+/g, "-") //thay thế khoảng trắng bằng dấu gạch nối
        .replace(/-+/g, "-"); // xóa gạch nối thừa
}

export default function CategoryForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        setSlug(generateSlug(newName));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const res = await createCategoryAction(formData);

        if (res?.success) {
            toast.success("Tạo danh mục sản phẩm thành công!");

            // Reset form fields
            setName("");
            setSlug("");
            (e.target as HTMLFormElement).reset();
        } else {
            toast.error("Lỗi hệ thống khi tạo danh mục sản phẩm!");
        }

        setIsLoading(false);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8"
        >
            <h2 className="text-xl font-bold mb-4 text-gray-800">
                Thêm danh mục sản phẩm mới
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên danh mục sản phẩm
                    </label>
                    <input
                        required
                        type="text"
                        name="name"
                        id="name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Tên danh mục sản phẩm"
                        value={name}
                        onChange={handleNameChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Đường dẫn danh mục sản phẩm
                    </label>
                    <input
                        required
                        type="text"
                        name="slug"
                        id="slug"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Đường dẫn danh mục sản phẩm"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                    />
                </div>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả danh mục sản phẩm
                </label>
                <textarea
                    name="description"
                    id="description"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Mô tả danh mục sản phẩm"
                    rows={3}
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-70"
                >
                    {isLoading ? "Đang tạo..." : "Tạo"}
                </button>
            </div>
        </form>
    );
}

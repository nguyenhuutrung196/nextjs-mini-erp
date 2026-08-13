import prisma from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const currentUser = await prisma.user.findFirst();

    if (!currentUser) {
        redirect("/login");
    }

    if (currentUser.role !== "ADMIN") {
        return (
            <div className="flex h-screen items-center justify-center text-red-600 font-bold text-2xl">
                403 - Không có quyền truy cập
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <aside className="w-64 bg-gray-900 text-white p-6">
                <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
                <ul className="space-y-4">
                    <li className="font-medium text-blue-400">
                        Quản lý đơn hàng
                    </li>
                    <li className="hover:text-gray-300 cursor-pointer">
                        <Link href={"/admin/categories"}>Danh mục</Link>
                    </li>
                    <li className="hover:text-gray-300 cursor-pointer">
                        <Link href={"/admin/products"}>Sản phẩm</Link>
                    </li>
                    <li className="hover:text-gray-300 cursor-pointer">
                        Khách hàng
                    </li>
                </ul>
            </aside>

            <main className="flex-1 p-8">{children}</main>

            <Toaster position="bottom-right" richColors />
        </div>
    );
}

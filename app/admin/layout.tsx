import Link from "next/link";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/login");
    }

    //check role admin and employee allow access
    if (session.user.role !== "ADMIN" && session.user.role !== "EMPLOYEE") {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-red-100">
                    <span className="text-5xl mb-4 block">🚫</span>
                    <h1 className="text-red-600 font-bold text-2xl mb-2">
                        403 - Truy cập bị từ chối
                    </h1>
                    <p className="text-gray-600 text-sm">
                        Tài khoản của bạn không có quyền truy cập khu vực này.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col">
                <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
                <ul className="space-y-4 flex-1">
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">
                        <Link href={"/admin/orders"}>Quản lý đơn hàng</Link>
                    </li>
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">
                        <Link href={"/admin/categories"}>Danh mục</Link>
                    </li>
                    <li className="hover:text-blue-400 cursor-pointer transition-colors">
                        <Link href={"/admin/products"}>Sản phẩm</Link>
                    </li>
                </ul>

                {/* show user info login */}
                <div className="pt-4 border-t border-gray-700 mt-auto">
                    <p className="text-xs text-gray-400 mb-1">
                        Đang đăng nhập:
                    </p>
                    <p className="text-sm font-bold truncate">
                        {session.user.email}
                    </p>
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded mt-2 inline-block">
                        {session.user.role}
                    </span>
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto">{children}</main>

            <Toaster position="bottom-right" richColors />
        </div>
    );
}

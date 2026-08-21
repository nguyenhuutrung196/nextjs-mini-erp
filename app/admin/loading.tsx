export default function AdminLoading() {
    return (
        <div className="flex h-full w-full items-center justify-center p-10">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
                <p className="text-sm font-semibold text-gray-500 animate-pulse">
                    Đang đồng bộ dữ liệu hệ thống...
                </p>
            </div>
        </div>
    );
}

import React from "react";
import prisma from "@/lib/prisma";

import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarningIcon from "@mui/icons-material/Warning";
import {
    Box,
    Card,
    CardContent,
    Container,
    Grid,
    LinearProgress,
    Typography,
} from "@mui/material";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
    const successfulOrders = await prisma.order.findMany({
        where: {
            status: {
                in: ["PAID", "SHIPPED"],
            },
        },
        select: {
            total: true,
        },
    });

    //count real data analytics from database
    const currentOrdersCount = successfulOrders.length;
    const currentRevenue = successfulOrders.reduce(
        (sum, order) => sum + order.total,
        0,
    );

    //count bussiness products
    const activeProducts = await prisma.product.count({
        where: { isActive: true },
    });

    const LOW_STOCK_THRESHOLD = 5;
    const lowStockCount = await prisma.productVariant.count({
        where: {
            isActive: true,
            stock: { lte: LOW_STOCK_THRESHOLD },
            product: { isActive: true },
        },
    });

    const totalVariantsCount = await prisma.productVariant.count({
        where: { isActive: true, product: { isActive: true } },
    });

    const lowStockPercentage =
        totalVariantsCount > 0
            ? Math.round((lowStockCount / totalVariantsCount) * 100)
            : 0;

    //add target bussiness
    const TARGET_ORDERS = 1025;
    const TARGET_REVENUE = 10000000;

    const orderProgress = Math.min(
        (currentOrdersCount / TARGET_ORDERS) * 100,
        100,
    );
    const revenueProgress = Math.min(
        (currentRevenue / TARGET_REVENUE) * 100,
        100,
    );

    const metrics = [
        {
            title: "Tiến độ Doanh thu năm nay",
            value: `${currentRevenue.toLocaleString("vi-VN")} đ`,
            target: `Mục tiêu: ${TARGET_REVENUE.toLocaleString("vi-VN")} đ`,
            progress: revenueProgress,
            color: "primary",
            icon: <ShoppingBagIcon sx={{ color: "#1976d2" }} />,
        },
        {
            title: "Tiến độ Đơn hàng năm nay",
            value: `${currentOrdersCount} đơn`,
            target: `Mục tiêu: ${TARGET_ORDERS} đơn`,
            progress: orderProgress,
            color: "success",
            icon: <CheckCircleIcon sx={{ color: "#2e7d32" }} />,
        },
        {
            title: "Mã Sản phẩm đang kinh doanh",
            value: `${activeProducts} mã SP`,
            target: "Đang hiển thị trên E-commerce",
            progress: 100,
            color: "warning",
            icon: <InventoryIcon sx={{ color: "#ed6c02" }} />,
        },
        {
            title: "Cảnh báo tồn kho",
            value: `${lowStockCount} biến thể`,
            target: `Sắp hết hàng (<= ${LOW_STOCK_THRESHOLD} sản phẩm)`,
            progress: lowStockPercentage,
            color: lowStockPercentage > 20 ? "error" : "warning",
            icon: (
                <WarningIcon
                    sx={{
                        color: lowStockPercentage > 20 ? "#d32f2f" : "#ed6c02",
                    }}
                />
            ),
        },
    ];

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{ fontWeight: "bold", color: "text.primary" }}
                >
                    Tổng quan Kinh doanh thiết bị điện
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Theo dõi tiến độ hoàn thành KPI năm nay.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {metrics.map((metric, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                        <Card
                            sx={{
                                height: "100%",
                                borderRadius: 3,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            }}
                        >
                            <CardContent>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        mb: 2,
                                    }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            fontWeight: "bold",
                                            color: "text.secondary",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        {metric.title}
                                    </Typography>
                                    <Box>{metric.icon}</Box>
                                </Box>

                                <Typography
                                    variant="h4"
                                    component="p"
                                    sx={{
                                        fontWeight: "900",
                                        mb: 1,
                                        color: "text.primary",
                                    }}
                                >
                                    {metric.value}
                                </Typography>

                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "text.secondary",
                                        mb: 2,
                                        display: "block",
                                    }}
                                >
                                    {metric.target}
                                </Typography>

                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        mt: 2,
                                    }}
                                >
                                    <Box sx={{ width: "100%", mr: 1 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={metric.progress}
                                            color={
                                                metric.color as
                                                    | "primary"
                                                    | "success"
                                                    | "warning"
                                            }
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                    </Box>
                                    <Box sx={{ minWidth: 35 }}>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ fontWeight: "bold" }}
                                        >
                                            {Math.round(metric.progress)}%
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}

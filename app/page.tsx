import React from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Grid,
    Typography,
} from "@mui/material";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";

export default function DashboardHome() {
    const metrics = [
        {
            title: "Doanh thu hôm nay",
            value: "15,240,000 đ",
            color: "#2e7d32",
            icon: <ShoppingBagIcon />,
        },
        {
            title: "Đơn hàng mới",
            value: "42 đơn",
            color: "#0288d1",
            icon: <DashboardIcon />,
        },
        {
            title: "Khách hàng hoạt động",
            value: "128 người",
            color: "#ed6c02",
            icon: <PeopleIcon />,
        },
    ];

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box
                sx={{
                    mb: 4,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{ fontWeight: "bold", color: "primary.main" }}
                >
                    Hệ thống quản trị Mini ERP
                </Typography>
                <Button variant="contained" color="primary">
                    Tạo đơn hàng mới
                </Button>
            </Box>

            <Grid container spacing={3}>
                {metrics.map((metric, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                        <Card>
                            <CardContent>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        mb: 2,
                                    }}
                                >
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: "medium",
                                            color: "text.secondary",
                                        }}
                                    >
                                        {metric.title}
                                    </Typography>
                                    <Box sx={{ color: metric.color }}>
                                        {metric.icon}
                                    </Box>
                                </Box>
                                <Typography
                                    variant="h5"
                                    component="p"
                                    sx={{
                                        fontWeight: "bold",
                                        color: "primary.main",
                                    }}
                                >
                                    {metric.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}

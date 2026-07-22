import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#1976d2",
        },
        secondary: {
            main: "#9c27b0",
        },
        background: {
            default: "f5f5f5",
        },
    },
    typography: {
        fontFamily: "var(--font-geist-sans), Roboto, Arial, sans-serif",
        button: {
            textTransform: "none",
        },
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
                },
            },
        },
    },
});

export default theme;

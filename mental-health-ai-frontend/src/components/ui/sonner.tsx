"use client";

import {
    CheckCircle,
    Info,
    Loader2,
    Octagon,
    AlertTriangle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme();

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            position="top-center"
            toastOptions={{
                style: {
                    backgroundColor: "rgba(255, 255, 255, 0.09)",
                    backdropFilter: "blur(15px)",
                    WebkitBackdropFilter: "blur(15px)",
                    color: "var(--text)",
                    fontSize: "14px",
                    padding: "12px 16px",
                    border: "none",
                },
            }}
            icons={{
                success: <CheckCircle className="size-4 !text-green-400" />,
                info: <Info className="size-4 text-blue-400" />,
                warning: <AlertTriangle className="size-4 text-yellow-400" />,
                error: <Octagon className="size-4 text-red-400" />,
                loading: <Loader2 className="size-4 animate-spin text-gray-300" />,
            }}
            style={
                {
                    "--normal-bg": "var(--popover)",
                    "--normal-text": "var(--popover-foreground)",
                    "--normal-border": "var(--border)",
                    "--border-radius": "var(--radius)",
                } as React.CSSProperties
            }
            {...props}
        />
    );
};

export { Toaster };

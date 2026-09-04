import { ThemeProvider } from "@/Components/ThemeProvider";
import { AdminShell } from "@/Components/admin/AdminShell";

export default function AdminLayout({ children }) {
    return (
        <ThemeProvider>
            <AdminShell>{children}</AdminShell>
        </ThemeProvider>
    );
}

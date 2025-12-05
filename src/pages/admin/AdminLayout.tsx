// src/pages/admin/AdminLayout.tsx
import { Outlet } from "react-router-dom";
import { AdminNavbar } from "./components/AdminNavbar";
import { AdminSidebar } from "./components/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import "@/styles/AdminLayout.css";

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full bg-gradient-subtle">
        {/* Sidebar bên trái */}
        <AdminSidebar />

        {/* Cột bên phải */}
        <div className="flex flex-1 flex-col pl-4 lg:pl-6">
          <AdminNavbar />

          <div className="flex-1">
            {/* giảm padding ngang + hơi bất đối xứng: trái nhiều hơn phải */}
            <main className="pr-3 pl-2 py-6 lg:pr-6 lg:pl-4 lg:py-8">
              <Outlet />
            </main>
          </div>
        </div>

      </div>
    </SidebarProvider>
  );
}

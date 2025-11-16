// src/pages/admin/AdminLayout.tsx
import { Outlet } from "react-router-dom";
import { AdminNavbar } from "./components/AdminNavbar";
import { AdminSidebar } from "./components/AdminSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import "@/styles/AdminLayout.css";

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="min-h-screen flex flex-col bg-gradient-subtle">
        {/* Navbar cố định trên, không padding ở đây */}
        <AdminNavbar />
        {/* Nội dung chính */}
        <main className="flex-1 px-4 md:px-6 py-4 md:py-6">
          <div className="mx-auto w-full max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

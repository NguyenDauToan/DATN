// src/pages/admin/components/AdminTopNavLinks.tsx
import { NavLink, useLocation } from "react-router-dom";

const LINKS = [
  { to: "/admin", label: "Trang chủ" },
  { to: "/admin/users", label: "Người dùng" },
  { to: "/admin/tests", label: "Đề thi" },
  { to: "/admin/questions", label: "Câu hỏi" },
];

export function AdminTopNavLinks() {
  const location = useLocation();
  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive: rrActive }) =>
            [
              "px-3 py-1.5 text-sm rounded-lg transition-colors",
              (rrActive || isActive(l.to))
                ? "bg-sidebar-accent/80 text-sidebar-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            ].join(" ")
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}

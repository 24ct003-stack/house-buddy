import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarItem {
  icon: ReactNode;
  label: string;
  path: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  sidebarItems: SidebarItem[];
  roleLabel: string;
  roleColor?: string;
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  sidebarItems,
  roleLabel,
}: DashboardLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 bg-sidebar flex-col fixed top-16 bottom-0 left-0 z-40 border-r border-sidebar-border">
        <div className="p-4 border-b border-sidebar-border">
          <span className="text-sidebar-foreground text-xs font-semibold uppercase tracking-widest opacity-60">
            {roleLabel}
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn("sidebar-nav-item", active && "active")}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile sidebar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border flex justify-around py-2">
        {sidebarItems.slice(0, 5).map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs transition-colors",
                active ? "text-sidebar-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
              )}
            >
              {item.icon}
              <span className="hidden xs:block">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="lg:ml-60 flex-1 min-h-screen pb-20 lg:pb-0">
        <div className="page-container py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

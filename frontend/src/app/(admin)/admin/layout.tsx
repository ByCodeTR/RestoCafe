'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import {
  LayoutDashboard,
  Store,
  Settings,
  Users,
  ChefHat,
  Coffee,
  Menu,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Masalar",
    href: "/admin/tables",
    icon: Store,
  },
  {
    title: "Kategoriler",
    href: "/admin/categories",
    icon: Menu,
  },
  {
    title: "Ürünler",
    href: "/admin/products",
    icon: Coffee,
  },
  {
    title: "Mutfak",
    href: "/admin/kitchen",
    icon: ChefHat,
  },
  {
    title: "Kullanıcılar",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Ayarlar",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 -translate-x-full border-r border-gray-200 bg-white transition-transform lg:translate-x-0",
          isSidebarOpen && "translate-x-0"
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-gray-200">
            <Link href="/admin" className="text-xl font-bold">
              RestoCafe
            </Link>
          </div>

          {/* Menu */}
          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-4 py-2 text-sm font-medium",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="min-h-screen bg-gray-100 px-4 py-4">
          {children}
        </main>
      </div>

      {/* Toast */}
      <Toaster />
    </div>
  );
} 
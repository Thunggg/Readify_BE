"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Truck,
  DollarSign,
  Tag,
  FolderTree,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  Book,
  UserCog,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const sidebarGroups = [
  {
    title: "General",
    items: [
      {
        title: "Income Statistic",
        href: "/admin/income",
        icon: DollarSign,
        badge: null,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Account Management",
        href: "/admin/accounts",
        icon: Users,
        badge: null,
      },
      {
        title: "Book Management",
        href: "/admin/books",
        icon: Book,
        badge: null,
      },
      {
        title: "Stock Management",
        href: "/admin/stock/viewlist",
        icon: Package,
        badge: null,
      },
      {
        title: "Supplier Management",
        href: "/admin/supplier",
        icon: Truck,
        badge: null,
      },
      {
        title: "Staff Management",
        href: "/admin/staff",
        icon: UserCog,
        badge: null,
      },
      {
        title: "Category Management",
        href: "/admin/categories",
        icon: FolderTree,
        badge: null,
      },
      {
        title: "Promotion Management",
        href: "/admin/promotion",
        icon: Tag,
        badge: "New",
      },
    ],
  },
  {
    title: "Others",
    items: [
      {
        title: "Orders",
        href: "/admin/orders",
        icon: ShoppingCart,
        badge: "5",
      },
      {
        title: "Notification",
        href: "/admin/notification",
        icon: Bell,
        badge: null,
      },
      {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
        badge: null,
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookie
      await fetch("/api/logout", {
        method: "POST",
      });

      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-card shadow-sm transition-all duration-300",
        isCollapsed ? "w-16" : "w-72"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6 justify-between">
        {!isCollapsed && (
          <Link
            href="/admin"
            className="flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold group-hover:text-primary transition-colors">
                Readify
              </span>
              <span className="text-sm font-light group-hover:text-primary transition-colors">
                Admin
              </span>
            </div>
          </Link>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 space-y-8 p-6 overflow-y-auto">
        {sidebarGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            {/* Group Title */}
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-4">
                {group.title}
              </h3>
            )}

            {/* Group Items */}
            <div className="space-y-2">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 hover:bg-muted",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                        : "text-muted-foreground hover:text-foreground",
                      isCollapsed && "justify-center px-3 py-4"
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <Icon
                      className={cn(
                        "transition-all duration-200",
                        isCollapsed ? "h-5 w-5" : "h-4 w-4",
                        isActive && !isCollapsed && "text-primary-foreground"
                      )}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="group-hover:translate-x-0.5 transition-transform duration-200 flex-1">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={cn(
                              "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
                              isActive
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-6 border-t">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950",
            isCollapsed && "justify-center px-0"
          )}
          onClick={handleLogout}
        >
          <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Building2,
  LayoutDashboard,
  Settings,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/companies", label: "Companies", icon: Building2 },
];

const SUPPORT_ITEMS = [
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  function renderItem(item: (typeof NAV_ITEMS)[number]) {
    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
        )}
      >
        <Icon className="size-4" />
        {item.label}
      </Link>
    );
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Briefcase className="size-4" />
        </div>
        <span className="font-semibold">IREWIN</span>
      </div>
      <nav className="flex-1 space-y-6 px-4 py-2">
        <div>
          <p className="px-3.5 pb-2 text-xs font-medium tracking-wide text-muted-foreground">
            GENERAL
          </p>
          <div className="space-y-1">{NAV_ITEMS.map(renderItem)}</div>
        </div>
        <div>
          <p className="px-3.5 pb-2 text-xs font-medium tracking-wide text-muted-foreground">
            SUPPORT
          </p>
          <div className="space-y-1">{SUPPORT_ITEMS.map(renderItem)}</div>
        </div>
      </nav>
    </aside>
  );
}

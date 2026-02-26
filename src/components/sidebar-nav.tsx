"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BookOpen, LayoutDashboard, LogOut, Menu, Search, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Översikt", icon: LayoutDashboard },
  { href: "/research", label: "Forskning", icon: Library },
  { href: "/search", label: "Sök artiklar", icon: Search },
];

interface SidebarNavProps {
  userName: string;
  userRole: string;
}

function SidebarContent({
  userName,
  userRole,
  onNavClick,
}: SidebarNavProps & { onNavClick?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex items-center gap-2 border-b p-4">
        <BookOpen className="h-6 w-6" />
        <div>
          <h1 className="text-lg font-bold leading-tight">C-uppsats</h1>
          <p className="text-xs text-muted-foreground">Socionom</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3 space-y-2">
        <div className="px-3 py-1">
          <p className="text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {userRole === "owner" ? "Student" : "Handledare"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Logga ut
        </Button>
      </div>
    </>
  );
}

export function SidebarNav({ userName, userRole }: SidebarNavProps) {
  return (
    <aside className="hidden md:flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <SidebarContent userName={userName} userRole={userRole} />
    </aside>
  );
}

export function MobileSidebar({ userName, userRole }: SidebarNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex md:hidden items-center border-b bg-background px-4 py-3 gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Öppna meny</span>
      </Button>
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5" />
        <span className="font-bold">C-uppsats</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0 flex flex-col bg-sidebar text-sidebar-foreground">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent
            userName={userName}
            userRole={userRole}
            onNavClick={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

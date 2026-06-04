"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, MessageSquare, Workflow, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/agents", label: "Agentes", icon: <Users className="h-4 w-4" /> },
  { href: "/chat", label: "Chat", icon: <MessageSquare className="h-4 w-4" /> },
  { href: "/automacoes", label: "Automações", icon: <Workflow className="h-4 w-4" /> },
];

interface Props {
  user: { name: string; email: string | null };
}

export function AppNav({ user }: Props) {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      className="flex items-center justify-between px-4 md:px-8 py-3 sticky top-0 z-30"
      style={{
        background: "rgba(27,23,40,0.72)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "inset 0 -1px 0 hsla(0,0%,100%,0.08)",
      }}
    >
      <Link href="/chat" className="flex items-center gap-2 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/totum-logo.webp" alt="totum" className="h-5 w-auto" />
        <span className="text-xs text-muted-foreground hidden sm:inline">agentes</span>
      </Link>

      <ul className="flex items-center gap-1">
        {ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-md text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "text-white"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
                style={
                  active
                    ? {
                        background:
                          "linear-gradient(to bottom, var(--brand-purple-bright), var(--tertiary))",
                      }
                    : undefined
                }
              >
                {item.icon}
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex flex-col items-end leading-tight">
          <span className="text-xs text-white truncate max-w-[180px]">{user.name}</span>
          <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
            {user.email}
          </span>
        </div>
        <div
          className="h-8 w-8 rounded-full bg-elevated flex items-center justify-center text-xs text-white"
          aria-hidden="true"
        >
          {user.name?.slice(0, 1).toUpperCase() ?? "?"}
        </div>
        <a
          href="/api/auth/logout"
          className="text-muted-foreground hover:text-white transition-colors p-1"
          title="Sair"
          aria-label="Sair"
        >
          <LogOut className="h-4 w-4" />
        </a>
      </div>
    </nav>
  );
}

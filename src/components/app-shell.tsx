"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  LogOut,
  MessageCircle,
  PanelsLeftBottom,
  Users,
  FolderKanban,
} from "lucide-react";
import { useSupabase } from "./supabase-provider";
import { useMemo } from "react";

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/team", label: "Team", icon: PanelsLeftBottom },
  { href: "/messages", label: "Messages", icon: MessageCircle },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut } = useSupabase();

  const currentEmail = useMemo(
    () => session?.user?.email ?? "Unknown user",
    [session],
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 flex-none border-r border-slate-200 bg-white/80 backdrop-blur md:block">
        <div className="flex items-center gap-2 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-semibold">
            CRM
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Customer Manager
            </p>
            <p className="text-xs text-slate-500">Field Service</p>
          </div>
        </div>
        <nav className="mt-2 space-y-1 px-3">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2 md:hidden">
            <span className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white">
              Menu
            </span>
            <p className="text-sm font-semibold text-slate-900">
              Customer Manager
            </p>
          </div>
          <div className="flex flex-1 items-center justify-end gap-3 text-sm">
            <span className="rounded-md bg-slate-100 px-3 py-1 text-slate-700">
              {currentEmail}
            </span>
            <button
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

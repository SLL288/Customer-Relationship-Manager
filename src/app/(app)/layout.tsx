"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/app-shell";
import { useSupabase } from "../../components/supabase-provider";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Checking session...
      </div>
    );
  }

  if (!session) return null;

  return <AppShell>{children}</AppShell>;
}

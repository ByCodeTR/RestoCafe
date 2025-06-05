'use client';

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Toaster } from "../../components/ui/toaster";

export default function TabletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/tablet/login');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-background">
      {!loading && !user && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 flex">
              <a className="mr-6 flex items-center space-x-2" href="/tablet">
                <span className="font-bold">RestoCafe</span>
              </a>
            </div>
          </div>
        </header>
      )}
      <main>
        {children}
      </main>
      <Toaster />
    </div>
  );
} 
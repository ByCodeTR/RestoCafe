'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from "@/components/ui/toaster";

export default function TabletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/tablet/login';

  return (
    <div className="min-h-screen bg-background">
      {!isLoginPage && (
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
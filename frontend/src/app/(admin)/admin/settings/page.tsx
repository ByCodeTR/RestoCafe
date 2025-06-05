'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from "lucide-react";

// Client-side rendering için dinamik import
const SettingsPage = dynamic(() => import('@/components/settings/SettingsPage'), {
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
  ssr: false
});

export default function Settings() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <SettingsPage />
    </Suspense>
  );
} 
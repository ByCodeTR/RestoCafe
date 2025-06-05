import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Yönetici Paneli | RestoCafe",
  description: "RestoCafe yönetici kontrol paneli",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 
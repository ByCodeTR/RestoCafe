import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Yönetici Girişi | RestoCafe",
  description: "RestoCafe yönetici giriş paneli",
}

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 
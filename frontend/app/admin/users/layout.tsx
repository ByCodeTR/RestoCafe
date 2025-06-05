import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kullanıcı Yönetimi | RestoCafe",
  description: "RestoCafe kullanıcı yönetimi paneli",
}

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 
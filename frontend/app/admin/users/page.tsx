"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEffect, useState } from "react"
import { UserFormModal } from "@/components/users/UserFormModal"
import { toast } from "sonner"

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
}

interface User {
  id: string
  username: string
  name: string
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN'
  createdAt: string
  updatedAt: string
  orders: Order[]
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users')
      if (!response.ok) {
        throw new Error('Kullanıcılar yüklenirken bir hata oluştu')
      }
      const data = await response.json()
      setUsers(data)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      setLoading(false)
    }
  }

  const handleAddUser = async (formData: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Kullanıcı eklenirken bir hata oluştu')
      }

      toast.success('Kullanıcı başarıyla eklendi')
      fetchUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu')
      throw err
    }
  }

  const handleEditUser = async (formData: any) => {
    if (!selectedUser) return

    try {
      const response = await fetch(`http://localhost:5000/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Kullanıcı güncellenirken bir hata oluştu')
      }

      toast.success('Kullanıcı başarıyla güncellendi')
      fetchUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu')
      throw err
    }
  }

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Kullanıcı silinirken bir hata oluştu')
      }

      toast.success('Kullanıcı başarıyla silindi')
      fetchUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  const getRoleLabel = (role: User['role']) => {
    const labels = {
      ADMIN: 'Yönetici',
      MANAGER: 'Müdür',
      CASHIER: 'Kasiyer',
      WAITER: 'Garson',
      KITCHEN: 'Mutfak'
    }
    return labels[role]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getRoleLabel(user.role).toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kullanıcı Yönetimi</h1>
          <p className="text-muted-foreground">Kullanıcıları görüntüle, ekle ve düzenle</p>
        </div>
        <Button onClick={() => {
          setSelectedUser(null)
          setModalOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kullanıcı
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kullanıcılar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Kullanıcı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı Adı</TableHead>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead>Son Sipariş</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {getRoleLabel(user.role)}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    {user.orders?.length > 0 ? (
                      <span className="text-sm">
                        {formatDate(user.orders[user.orders.length - 1].createdAt)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Sipariş yok</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user)
                        setModalOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Düzenle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Sil
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={selectedUser ? handleEditUser : handleAddUser}
        initialData={selectedUser || undefined}
        mode={selectedUser ? "edit" : "add"}
      />
    </div>
  )
} 
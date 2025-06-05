"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { TableFormModal } from "@/components/tables/TableFormModal"
import { AreaFormModal } from "@/components/areas/AreaFormModal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface Table {
  id: string
  name: string
  capacity: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE'
  areaId: string
  area: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

interface Area {
  id: string
  name: string
  tables: Table[]
}

export default function TablesPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [isTableModalOpen, setIsTableModalOpen] = useState(false)
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [deletingTable, setDeletingTable] = useState<Table | null>(null)
  const [deletingArea, setDeletingArea] = useState<Area | null>(null)

  useEffect(() => {
    fetchAreas()
  }, [])

  const fetchAreas = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/areas?include=tables')
      if (!response.ok) {
        throw new Error('Bölgeler yüklenirken bir hata oluştu')
      }
      const data = await response.json()
      setAreas(data)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      setLoading(false)
    }
  }

  const handleAddTable = async (data: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, status: 'AVAILABLE' }),
      })

      if (!response.ok) {
        throw new Error('Masa eklenirken bir hata oluştu')
      }

      fetchAreas()
    } catch (error) {
      console.error('Add table error:', error)
      throw error
    }
  }

  const handleEditTable = async (data: any) => {
    if (!editingTable) return

    try {
      const response = await fetch(`http://localhost:5000/api/tables/${editingTable.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Masa güncellenirken bir hata oluştu')
      }

      fetchAreas()
    } catch (error) {
      console.error('Edit table error:', error)
      throw error
    }
  }

  const handleDeleteTable = async () => {
    if (!deletingTable) return

    try {
      const response = await fetch(`http://localhost:5000/api/tables/${deletingTable.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Masa silinirken bir hata oluştu')
      }

      toast.success('Masa başarıyla silindi')
      setIsDeleteDialogOpen(false)
      setDeletingTable(null)
      fetchAreas()
    } catch (error) {
      console.error('Delete table error:', error)
      toast.error('Masa silinirken bir hata oluştu')
    }
  }

  const handleAddArea = async (data: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Bölge eklenirken bir hata oluştu')
      }

      fetchAreas()
    } catch (error) {
      console.error('Add area error:', error)
      throw error
    }
  }

  const handleEditArea = async (data: any) => {
    if (!editingArea) return

    try {
      const response = await fetch(`http://localhost:5000/api/areas/${editingArea.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Bölge güncellenirken bir hata oluştu')
      }

      fetchAreas()
    } catch (error) {
      console.error('Edit area error:', error)
      throw error
    }
  }

  const handleDeleteArea = async () => {
    if (!deletingArea) return

    try {
      const response = await fetch(`http://localhost:5000/api/areas/${deletingArea.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Bölge silinirken bir hata oluştu')
      }

      toast.success('Bölge başarıyla silindi')
      setIsDeleteDialogOpen(false)
      setDeletingArea(null)
      fetchAreas()
    } catch (error) {
      console.error('Delete area error:', error)
      toast.error('Bölge silinirken bir hata oluştu')
    }
  }

  const getStatusColor = (status: Table['status']) => {
    const colors = {
      AVAILABLE: 'bg-green-100 text-green-700 ring-green-700/10',
      OCCUPIED: 'bg-red-100 text-red-700 ring-red-700/10',
      RESERVED: 'bg-yellow-100 text-yellow-700 ring-yellow-700/10',
      MAINTENANCE: 'bg-gray-100 text-gray-700 ring-gray-700/10',
    }
    return colors[status]
  }

  const getStatusLabel = (status: Table['status']) => {
    const labels = {
      AVAILABLE: 'Müsait',
      OCCUPIED: 'Dolu',
      RESERVED: 'Rezerve',
      MAINTENANCE: 'Bakımda',
    }
    return labels[status]
  }

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  if (error) {
    return <div>Hata: {error}</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Masa ve Bölge Yönetimi</h1>
        <div className="space-x-2">
          <Button onClick={() => setIsTableModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Masa
          </Button>
          <Button onClick={() => setIsAreaModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Bölge
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {areas.map((area) => (
          <Card key={area.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{area.name}</CardTitle>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingArea(area)
                    setIsAreaModalOpen(true)
                  }}
                >
                  Düzenle
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDeletingArea(area)
                    setIsDeleteDialogOpen(true)
                  }}
                >
                  Sil
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {area.tables.map((table) => (
                  <div
                    key={table.id}
                    className="border rounded-lg p-4 flex flex-col space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{table.name}</h3>
                        <p className="text-sm text-gray-500">
                          Kapasite: {table.capacity} kişi
                        </p>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(
                            table.status
                          )}`}
                        >
                          {getStatusLabel(table.status)}
                        </span>
                      </div>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingTable(table)
                            setIsTableModalOpen(true)
                          }}
                        >
                          Düzenle
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeletingTable(table)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          Sil
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TableFormModal
        isOpen={isTableModalOpen}
        onClose={() => {
          setIsTableModalOpen(false)
          setEditingTable(null)
        }}
        onSubmit={editingTable ? handleEditTable : handleAddTable}
        editingTable={editingTable || undefined}
        areas={areas}
      />

      <AreaFormModal
        isOpen={isAreaModalOpen}
        onClose={() => {
          setIsAreaModalOpen(false)
          setEditingArea(null)
        }}
        onSubmit={editingArea ? handleEditArea : handleAddArea}
        editingArea={editingArea || undefined}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setDeletingTable(null)
          setDeletingArea(null)
        }}
        onConfirm={deletingTable ? handleDeleteTable : handleDeleteArea}
        title={`${deletingTable ? 'Masayı' : 'Bölgeyi'} Sil`}
        description={`${deletingTable ? 'Bu masayı' : 'Bu bölgeyi'} silmek istediğinizden emin misiniz?`}
      />
    </div>
  )
} 
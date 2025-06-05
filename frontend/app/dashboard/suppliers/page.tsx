'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2 } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  contactName: string | null
  phone: string | null
  email: string | null
  address: string | null
  createdAt: string
  updatedAt: string
}

interface SupplierFormData {
  name: string
  contactName: string
  phone: string
  email: string
  address: string
}

export default function SuppliersPage() {
  const { toast } = useToast()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: ''
  })

  // Tedarikçileri getir
  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      if (!response.ok) throw new Error('Tedarikçiler getirilemedi')
      const data = await response.json()
      setSuppliers(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Tedarikçiler yüklenirken bir hata oluştu."
      })
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  // Form verilerini sıfırla
  const resetFormData = () => {
    setFormData({
      name: '',
      contactName: '',
      phone: '',
      email: '',
      address: ''
    })
  }

  // Form verilerini API'ye göndermek için hazırla
  const prepareFormData = (data: SupplierFormData) => {
    return {
      name: data.name,
      contactName: data.contactName.trim() || null,
      phone: data.phone.trim() || null,
      email: data.email.trim() || null,
      address: data.address.trim() || null
    }
  }

  // Tedarikçi ekle
  const handleAdd = async () => {
    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prepareFormData(formData))
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Tedarikçi eklenemedi')
      }

      await fetchSuppliers()
      setIsAddDialogOpen(false)
      resetFormData()
      toast({
        title: "Başarılı",
        description: "Tedarikçi başarıyla eklendi."
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Tedarikçi eklenirken bir hata oluştu."
      })
    }
  }

  // Tedarikçi güncelle
  const handleEdit = async () => {
    if (!selectedSupplier) return

    try {
      const response = await fetch(`/api/suppliers/${selectedSupplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prepareFormData(formData))
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Tedarikçi güncellenemedi')
      }

      await fetchSuppliers()
      setIsEditDialogOpen(false)
      setSelectedSupplier(null)
      resetFormData()
      toast({
        title: "Başarılı",
        description: "Tedarikçi başarıyla güncellendi."
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Tedarikçi güncellenirken bir hata oluştu."
      })
    }
  }

  // Tedarikçi sil
  const handleDelete = async () => {
    if (!selectedSupplier) return

    try {
      const response = await fetch(`/api/suppliers/${selectedSupplier.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Tedarikçi silinemedi')
      }

      await fetchSuppliers()
      setIsDeleteDialogOpen(false)
      setSelectedSupplier(null)
      toast({
        title: "Başarılı",
        description: "Tedarikçi başarıyla silindi."
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Tedarikçi silinirken bir hata oluştu."
      })
    }
  }

  // Düzenleme modalını aç
  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setFormData({
      name: supplier.name,
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || ''
    })
    setIsEditDialogOpen(true)
  }

  // Silme modalını aç
  const openDeleteDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tedarikçiler</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Tedarikçi Ekle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Tedarikçi Ekle</DialogTitle>
              <DialogDescription>
                Tedarikçi bilgilerini girin.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Firma Adı
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contactName" className="text-right">
                  Yetkili Adı
                </Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Telefon
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  E-posta
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Adres
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleAdd}>Ekle</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Firma Adı</TableHead>
              <TableHead>Yetkili</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Adres</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell>{supplier.name}</TableCell>
                <TableCell>{supplier.contactName}</TableCell>
                <TableCell>{supplier.phone}</TableCell>
                <TableCell>{supplier.email}</TableCell>
                <TableCell>{supplier.address}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEditDialog(supplier)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openDeleteDialog(supplier)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Düzenleme Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tedarikçi Düzenle</DialogTitle>
            <DialogDescription>
              Tedarikçi bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Firma Adı
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-contactName" className="text-right">
                Yetkili Adı
              </Label>
              <Input
                id="edit-contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                Telefon
              </Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                E-posta
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-address" className="text-right">
                Adres
              </Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleEdit}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silme Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tedarikçi Sil</DialogTitle>
            <DialogDescription>
              Bu tedarikçiyi silmek istediğinizden emin misiniz?
              {selectedSupplier && (
                <p className="mt-2 font-semibold">{selectedSupplier.name}</p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
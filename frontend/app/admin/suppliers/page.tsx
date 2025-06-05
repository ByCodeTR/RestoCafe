'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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
import api from '@/lib/api'

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

interface FormErrors {
  name?: string
  phone?: string
  email?: string
}

export default function SuppliersPage() {
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
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form validasyonu
  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    if (!formData.name.trim()) {
      errors.name = 'Firma adı zorunludur'
    }

    // Telefon formatı kontrolü (5XX XXX XX XX)
    const phoneRegex = /^5[0-9]{2}[0-9]{3}[0-9]{2}[0-9]{2}$/
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Geçerli bir telefon numarası girin (5XX XXX XX XX)'
    }

    // Email formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = 'Geçerli bir e-posta adresi girin'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Telefon numarası formatı
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`
    if (numbers.length <= 8) return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6)}`
    return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 8)} ${numbers.slice(8, 10)}`
  }

  // Tedarikçileri getir
  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers')
      console.log('Suppliers response:', response) // Debug için
      setSuppliers(response.data)
    } catch (error: any) {
      console.error('Fetch suppliers error:', error) // Debug için
      toast.error(error.response?.data?.message || "Tedarikçiler yüklenirken bir hata oluştu.")
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
    setFormErrors({})
  }

  // Tedarikçi ekle
  const handleAdd = async () => {
    if (!validateForm() || isSubmitting) return
    setIsSubmitting(true)

    try {
      console.log('Adding supplier with data:', formData) // Debug için
      const response = await api.post('/suppliers', {
        name: formData.name.trim(),
        contactName: formData.contactName.trim() || null,
        phone: formData.phone ? formData.phone.replace(/\D/g, '') : null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null
      })
      console.log('Add supplier response:', response) // Debug için
      await fetchSuppliers()
      setIsAddDialogOpen(false)
      resetFormData()
      toast.success("Tedarikçi başarıyla eklendi.")
    } catch (error: any) {
      console.error('Add supplier error:', error) // Debug için
      toast.error(error.response?.data?.message || "Tedarikçi eklenirken bir hata oluştu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Tedarikçi güncelle
  const handleEdit = async () => {
    if (!selectedSupplier || !validateForm() || isSubmitting) return
    setIsSubmitting(true)

    try {
      console.log('Updating supplier with data:', formData) // Debug için
      const response = await api.put(`/suppliers/${selectedSupplier.id}`, {
        name: formData.name.trim(),
        contactName: formData.contactName.trim() || null,
        phone: formData.phone ? formData.phone.replace(/\D/g, '') : null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null
      })
      console.log('Update supplier response:', response) // Debug için
      await fetchSuppliers()
      setIsEditDialogOpen(false)
      setSelectedSupplier(null)
      resetFormData()
      toast.success("Tedarikçi başarıyla güncellendi.")
    } catch (error: any) {
      console.error('Update supplier error:', error) // Debug için
      toast.error(error.response?.data?.message || "Tedarikçi güncellenirken bir hata oluştu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Tedarikçi sil
  const handleDelete = async () => {
    if (!selectedSupplier || isSubmitting) return
    setIsSubmitting(true)

    try {
      await api.delete(`/suppliers/${selectedSupplier.id}`)
      await fetchSuppliers()
      setIsDeleteDialogOpen(false)
      setSelectedSupplier(null)
      toast.success("Tedarikçi başarıyla silindi.")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Tedarikçi silinirken bir hata oluştu.")
    } finally {
      setIsSubmitting(false)
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
    setFormErrors({})
    setIsEditDialogOpen(true)
  }

  // Silme modalını aç
  const openDeleteDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsDeleteDialogOpen(true)
  }

  // Form input değişikliği
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'phone') {
      setFormData(prev => ({
        ...prev,
        [name]: formatPhoneNumber(value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }

    // Hata mesajını temizle
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
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
                  Firma Adı *
                </Label>
                <div className="col-span-3">
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={formErrors.name ? "border-red-500" : ""}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contactName" className="text-right">
                  Yetkili Adı
                </Label>
                <Input
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Telefon
                </Label>
                <div className="col-span-3">
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="5XX XXX XX XX"
                    maxLength={13}
                    className={formErrors.phone ? "border-red-500" : ""}
                  />
                  {formErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  E-posta
                </Label>
                <div className="col-span-3">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={formErrors.email ? "border-red-500" : ""}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Adres
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                resetFormData()
                setIsAddDialogOpen(false)
              }}>
                İptal
              </Button>
              <Button onClick={handleAdd} disabled={isSubmitting}>
                {isSubmitting ? 'Ekleniyor...' : 'Ekle'}
              </Button>
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
                <TableCell className="font-medium">{supplier.name}</TableCell>
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

      {/* Edit Dialog */}
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
                Firma Adı *
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-contactName" className="text-right">
                Yetkili Adı
              </Label>
              <Input
                id="edit-contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                Telefon
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="5XX XXX XX XX"
                  maxLength={13}
                  className={formErrors.phone ? "border-red-500" : ""}
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                E-posta
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={formErrors.email ? "border-red-500" : ""}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-address" className="text-right">
                Adres
              </Label>
              <Input
                id="edit-address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetFormData()
              setIsEditDialogOpen(false)
            }}>
              İptal
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tedarikçi Sil</DialogTitle>
            <DialogDescription>
              Bu tedarikçiyi silmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              <strong>{selectedSupplier?.name}</strong> isimli tedarikçi silinecek. Bu işlem geri alınamaz.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Siliniyor...' : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
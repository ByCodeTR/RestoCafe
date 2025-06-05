import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface Area {
  id: string
  name: string
}

const tableFormSchema = z.object({
  name: z.string().min(1, "Masa adı zorunludur"),
  capacity: z.string().min(1, "Kapasite zorunludur"),
  areaId: z.string().min(1, "Bölge seçimi zorunludur"),
  status: z.string().min(1, "Durum seçimi zorunludur"),
})

interface TableFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  editingTable?: {
    id: string
    name: string
    capacity: number
    areaId: string
    status: string
  }
  areas: Area[]
}

export function TableFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingTable,
  areas,
}: TableFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof tableFormSchema>>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: {
      name: "",
      capacity: "",
      areaId: "",
      status: "AVAILABLE",
    },
  })

  useEffect(() => {
    if (editingTable) {
      form.reset({
        name: editingTable.name,
        capacity: String(editingTable.capacity),
        areaId: editingTable.areaId,
        status: editingTable.status,
      })
    } else {
      form.reset({
        name: "",
        capacity: "",
        areaId: "",
        status: "AVAILABLE",
      })
    }
  }, [editingTable, form])

  const handleSubmit = async (values: z.infer<typeof tableFormSchema>) => {
    try {
      setIsLoading(true)
      await onSubmit({
        ...values,
        capacity: parseInt(values.capacity),
      })
      form.reset()
      onClose()
      toast.success(editingTable ? "Masa güncellendi" : "Yeni masa eklendi")
    } catch (error) {
      toast.error("Bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingTable ? "Masayı Düzenle" : "Yeni Masa Ekle"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Masa Adı</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Örn: Pencere Kenarı 1"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kapasite</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Örn: 4"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durum</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Durum seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Müsait</SelectItem>
                      <SelectItem value="OCCUPIED">Dolu</SelectItem>
                      <SelectItem value="RESERVED">Rezerve</SelectItem>
                      <SelectItem value="MAINTENANCE">Bakımda</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="areaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bölge</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Bölge seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {editingTable ? "Güncelle" : "Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 
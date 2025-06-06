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
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  categoryId: string
  stock: number
  minStock: number
}

const productFormSchema = z.object({
  name: z.string().min(1, "Ürün adı zorunludur"),
  description: z.string().optional(),
  price: z.string().min(1, "Fiyat zorunludur"),
  categoryId: z.string().min(1, "Kategori seçimi zorunludur"),
  stock: z.string().min(1, "Stok miktarı zorunludur"),
  minStock: z.string().min(1, "Minimum stok miktarı zorunludur"),
})

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  editingProduct?: Product | null
  categories: Category[]
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingProduct,
  categories,
}: ProductFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      categoryId: "",
      stock: "0",
      minStock: "10",
    },
  })

  useEffect(() => {
    if (editingProduct) {
      form.reset({
        name: editingProduct.name,
        description: editingProduct.description || "",
        price: String(editingProduct.price),
        categoryId: editingProduct.categoryId,
        stock: String(editingProduct.stock),
        minStock: String(editingProduct.minStock),
      })
    } else {
      form.reset({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        stock: "0",
        minStock: "10",
      })
    }
  }, [editingProduct, form])

  const handleSubmit = async (values: z.infer<typeof productFormSchema>) => {
    try {
      setIsLoading(true)
      await onSubmit({
        ...values,
        price: parseFloat(values.price),
        stock: parseInt(values.stock),
        minStock: parseInt(values.minStock),
      })
      form.reset()
      onClose()
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
            {editingProduct ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ürün Adı</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Örn: Karışık Pizza"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ürün açıklaması..."
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
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fiyat</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategori seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stok</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
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
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stok</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {editingProduct ? "Güncelle" : "Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
}

const categoryFormSchema = z.object({
  name: z.string().min(1, "Kategori adı zorunludur"),
})

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  editingCategory?: Category
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingCategory,
}: CategoryFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
    },
  })

  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
      })
    } else {
      form.reset({
        name: "",
      })
    }
  }, [editingCategory, form])

  const handleSubmit = async (values: z.infer<typeof categoryFormSchema>) => {
    try {
      setIsLoading(true)
      await onSubmit(values)
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
            {editingCategory ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori Adı</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Örn: Ana Yemekler"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
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
                {editingCategory ? "Güncelle" : "Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 
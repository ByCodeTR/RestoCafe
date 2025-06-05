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
import { useState } from "react"
import { toast } from "sonner"

const areaFormSchema = z.object({
  name: z.string().min(1, "Bölge adı zorunludur"),
})

interface AreaFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  editingArea?: {
    id: string
    name: string
  }
}

export function AreaFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingArea,
}: AreaFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof areaFormSchema>>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: {
      name: editingArea ? editingArea.name : "",
    },
  })

  const handleSubmit = async (values: z.infer<typeof areaFormSchema>) => {
    try {
      setIsLoading(true)
      await onSubmit(values)
      form.reset()
      onClose()
      toast.success(editingArea ? "Bölge güncellendi" : "Yeni bölge eklendi")
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
            {editingArea ? "Bölgeyi Düzenle" : "Yeni Bölge Ekle"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bölge Adı</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Örn: Bahçe"
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
                {editingArea ? "Güncelle" : "Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 
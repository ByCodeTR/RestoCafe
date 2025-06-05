"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CategoryFormModal } from "@/components/menu/CategoryFormModal"
import { ProductFormModal } from "@/components/menu/ProductFormModal"
import api from "@/lib/api"

interface Category {
  id: string
  name: string
  products: Product[]
  createdAt: string
  updatedAt: string
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  categoryId: string
  stock: number
  minStock: number
  category: Category
  createdAt: string
  updatedAt: string
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Kategorileri getir
  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories")
      const data = response.data
      // Ensure data is an array before setting it
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error("Kategoriler yüklenirken bir hata oluştu")
      setCategories([]) // Set empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Kategori işlemleri
  const handleCategorySubmit = async (data: any) => {
    try {
      const method = selectedCategory ? "PUT" : "POST"
      const url = selectedCategory
        ? `/categories/${selectedCategory.id}`
        : "/categories"

      const response = selectedCategory
        ? await api.put(url, data)
        : await api.post(url, data)

      toast.success(
        selectedCategory ? "Kategori güncellendi" : "Yeni kategori eklendi"
      )
      fetchCategories()
      setIsCategoryModalOpen(false)
      setSelectedCategory(null)
    } catch (error) {
      toast.error("Bir hata oluştu")
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return

    try {
      await api.delete(`/categories/${category.id}`)

      toast.success("Kategori silindi")
      fetchCategories()
    } catch (error) {
      toast.error("Kategori silinirken bir hata oluştu")
    }
  }

  // Ürün işlemleri
  const handleProductSubmit = async (data: any) => {
    try {
      const method = selectedProduct ? "PUT" : "POST"
      const url = selectedProduct
        ? `/products/${selectedProduct.id}`
        : "/products"

      const response = selectedProduct
        ? await api.put(url, data)
        : await api.post(url, data)

      toast.success(selectedProduct ? "Ürün güncellendi" : "Yeni ürün eklendi")
      fetchCategories()
      setIsProductModalOpen(false)
      setSelectedProduct(null)
    } catch (error) {
      toast.error("Bir hata oluştu")
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return

    try {
      await api.delete(`/products/${product.id}`)

      toast.success("Ürün silindi")
      fetchCategories()
    } catch (error) {
      toast.error("Ürün silinirken bir hata oluştu")
    }
  }

  if (isLoading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Menü Yönetimi</h1>
        <div className="space-x-2">
          <Button
            onClick={() => {
              setSelectedCategory(null)
              setIsCategoryModalOpen(true)
            }}
          >
            Yeni Kategori
          </Button>
          <Button
            onClick={() => {
              setSelectedProduct(null)
              setIsProductModalOpen(true)
            }}
          >
            Yeni Ürün
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {Array.isArray(categories) && categories.length > 0 && categories
          .filter(category => category.name !== 'Hammaddeler')
          .map((category) => (
          <div
            key={category.id}
            className="bg-white shadow rounded-lg overflow-hidden"
          >
            <div className="p-4 bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{category.name}</h2>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(category)
                    setIsCategoryModalOpen(true)
                  }}
                >
                  Düzenle
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteCategory(category)}
                >
                  Sil
                </Button>
              </div>
            </div>
            <div className="p-4">
              {category.products.length === 0 ? (
                <p className="text-gray-500">Bu kategoride henüz ürün yok</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-gray-50 p-4 rounded-lg relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{product.name}</h3>
                        <div className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product)
                              setIsProductModalOpen(true)
                            }}
                          >
                            Düzenle
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            Sil
                          </Button>
                        </div>
                      </div>
                      {product.description && (
                        <p className="text-gray-600 text-sm mb-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">
                          {product.price.toLocaleString("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          })}
                        </span>
                        <span
                          className={`text-sm ${
                            product.stock <= product.minStock
                              ? "text-red-500"
                              : "text-green-500"
                          }`}
                        >
                          Stok: {product.stock}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {(!Array.isArray(categories) || categories.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">Henüz kategori eklenmemiş</p>
          </div>
        )}
      </div>

      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false)
          setSelectedCategory(null)
        }}
        onSubmit={handleCategorySubmit}
        editingCategory={selectedCategory}
      />

      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false)
          setSelectedProduct(null)
        }}
        onSubmit={handleProductSubmit}
        editingProduct={selectedProduct}
        categories={categories}
      />
    </div>
  )
} 
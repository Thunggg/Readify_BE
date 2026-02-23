"use client"

import { Checkbox } from "@/components/ui/checkbox"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, X, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

// Mock authors data
const mockAuthors = [
  { id: "1", name: "Robert C. Martin" },
  { id: "2", name: "Martin Fowler" },
  { id: "3", name: "Kent Beck" },
]

type BookData = {
  id: string
  title: string
  isbn: string
  description: string
  category: string
  price: string
  pages: string
  publisher: string
  publishYear: string
  language: string
  authorId: string
  bookType: "physical" | "ebook" | "both"
  stockQuantity: string
  stockLocation: string
  status?: "draft" | "published"
  coverImage?: string
}

export function EditBookForm({ book }: { book: BookData }) {
  const router = useRouter()
  const [formData, setFormData] = useState(book)
  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(book.coverImage || null)

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSaveSuccess(false)
  }

  const validateForm = () => {
    const errors: string[] = []

    if (!formData.title) errors.push("Tên sách là bắt buộc")
    if (!formData.isbn) errors.push("Mã ISBN là bắt buộc")
    if (!formData.authorId) errors.push("Vui lòng chọn tác giả")
    if (!formData.price || Number.parseFloat(formData.price) <= 0) errors.push("Giá phải lớn hơn 0")
    if (formData.bookType !== "ebook" && !formData.stockQuantity)
      errors.push("Số lượng tồn kho là bắt buộc cho sách giấy")

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    console.log("[v0] Saving book updates:", formData)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSaving(false)
    setSaveSuccess(true)

    // Auto-hide success message after 3 seconds
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleCancel = () => {
    router.push(`/admin/books/${book.id}`)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string)
        updateFormData("coverImage", reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Có lỗi xảy ra</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success message */}
      {saveSuccess && (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>Lưu thành công</AlertTitle>
          <AlertDescription>Thông tin sách đã được cập nhật.</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
          <CardDescription>Cập nhật thông tin cơ bản về sách</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Tên sách *</Label>
              <Input
                id="title"
                placeholder="Nhập tên sách"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isbn">Mã ISBN *</Label>
              <Input
                id="isbn"
                placeholder="978-3-16-148410-0"
                value={formData.isbn}
                onChange={(e) => updateFormData("isbn", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              placeholder="Mô tả về nội dung sách..."
              rows={4}
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Danh mục</Label>
              <Select value={formData.category} onValueChange={(value) => updateFormData("category", value)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="programming">Programming</SelectItem>
                  <SelectItem value="web-dev">Web Development</SelectItem>
                  <SelectItem value="software-design">Software Design</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="devops">DevOps</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Giá (VND) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="450000"
                value={formData.price}
                onChange={(e) => updateFormData("price", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="pages">Số trang</Label>
              <Input
                id="pages"
                type="number"
                placeholder="320"
                value={formData.pages}
                onChange={(e) => updateFormData("pages", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publisher">Nhà xuất bản</Label>
              <Input
                id="publisher"
                placeholder="Nhà xuất bản"
                value={formData.publisher}
                onChange={(e) => updateFormData("publisher", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publishYear">Năm xuất bản</Label>
              <Input
                id="publishYear"
                type="number"
                placeholder="2024"
                value={formData.publishYear}
                onChange={(e) => updateFormData("publishYear", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Ngôn ngữ</Label>
            <Select value={formData.language} onValueChange={(value) => updateFormData("language", value)}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Author */}
      <Card>
        <CardHeader>
          <CardTitle>Tác giả</CardTitle>
          <CardDescription>Thông tin tác giả</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="author">Tác giả *</Label>
            <Select value={formData.authorId} onValueChange={(value) => updateFormData("authorId", value)}>
              <SelectTrigger id="author">
                <SelectValue placeholder="Chọn tác giả" />
              </SelectTrigger>
              <SelectContent>
                {mockAuthors.map((author) => (
                  <SelectItem key={author.id} value={author.id}>
                    {author.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cover Image */}
      <Card>
        <CardHeader>
          <CardTitle>Hình ảnh bìa sách</CardTitle>
          <CardDescription>Tải lên hình ảnh bìa sách</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {coverImagePreview && (
              <div className="mb-4">
                <img
                  src={coverImagePreview || "/placeholder.svg"}
                  alt="Book cover preview"
                  className="max-h-48 rounded-lg border object-cover shadow"
                />
              </div>
            )}
            <Label htmlFor="coverImage">Chọn ảnh</Label>
            <div className="flex gap-2">
              <Input
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1"
              />
              <Button type="button" variant="secondary">
                <Upload className="mr-2 size-4" />
                Tải lên
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG hoặc WebP. Tối đa 5MB.</p>
          </div>
        </CardContent>
      </Card>

      {/* Stock */}
      <Card>
        <CardHeader>
          <CardTitle>Quản lý kho</CardTitle>
          <CardDescription>Thông tin về kho hàng</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bookType">Loại sách</Label>
            <Select value={formData.bookType} onValueChange={(value: any) => updateFormData("bookType", value)}>
              <SelectTrigger id="bookType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physical">Sách giấy</SelectItem>
                <SelectItem value="ebook">Ebook</SelectItem>
                <SelectItem value="both">Cả hai</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.bookType !== "ebook" && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Số lượng tồn kho *</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    placeholder="50"
                    value={formData.stockQuantity}
                    onChange={(e) => updateFormData("stockQuantity", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stockLocation">Vị trí kho</Label>
                  <Input
                    id="stockLocation"
                    placeholder="Warehouse A - Shelf 12"
                    value={formData.stockLocation}
                    onChange={(e) => updateFormData("stockLocation", e.target.value)}
                  />
                </div>
              </div>


            </>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleCancel}>
          <X className="mr-2 size-4" />
          Hủy
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 size-4" />
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  )
}

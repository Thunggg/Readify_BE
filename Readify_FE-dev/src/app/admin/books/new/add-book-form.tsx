"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  User,
  ImageIcon,
  Package,
  CheckCircle2,
  AlertCircle,
  Plus,
  Save,
  Upload,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"


type BookStatus = "draft" | "validating" | "ready" | "published"

const steps = [
  { id: "info", label: "Thông tin sách", icon: BookOpen },
  { id: "author", label: "Tác giả", icon: User },
  { id: "media", label: "Hình ảnh", icon: ImageIcon },
  { id: "stock", label: "Kho hàng", icon: Package },
  { id: "review", label: "Kiểm tra", icon: CheckCircle2 },
]

const mockAuthors = [
  { id: "1", name: "Robert C. Martin" },
  { id: "2", name: "Martin Fowler" },
  { id: "3", name: "Kent Beck" },
]

export function AddBookForm() {
  console.log("[v0] AddBookForm rendered")

  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [bookStatus, setBookStatus] = useState<BookStatus>("draft")
  const [showAuthorDialog, setShowAuthorDialog] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    isbn: "",
    description: "",
    category: "",
    price: "",
    pages: "",
    publisher: "",
    publishYear: "",
    language: "vi",
    authorId: "",
    authorName: "",
    coverImage: null as File | null,
    previewImages: [] as File[],
    stockQuantity: "",
    stockLocation: "",
    bookType: "physical" as "physical" | "ebook" | "both",
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const errors: string[] = []

    if (!formData.title) errors.push("Tên sách là bắt buộc")
    if (!formData.isbn) errors.push("Mã ISBN là bắt buộc")
    if (!formData.authorId && !formData.authorName) errors.push("Vui lòng chọn hoặc tạo tác giả")
    if (!formData.price || Number.parseFloat(formData.price) <= 0) errors.push("Giá phải lớn hơn 0")
    if (formData.bookType !== "ebook" && !formData.stockQuantity)
      errors.push("Số lượng tồn kho là bắt buộc cho sách giấy")
    if (!formData.coverImage) errors.push("Ảnh bìa là bắt buộc")

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSaveDraft = () => {
    setBookStatus("draft")
    alert("Đã lưu bản nháp: Thông tin sách đã được lưu")
  }

  const handleValidate = () => {
    setBookStatus("validating")
    const isValid = validateForm()

    setTimeout(() => {
      if (isValid) {
        setBookStatus("ready")
        alert("Kiểm tra thành công: Sách đã sẵn sàng để xuất bản")
      } else {
        setBookStatus("draft")
      }
    }, 1000)
  }

  const handlePublish = () => {
    if (validateForm()) {
      setBookStatus("published")
      alert("Xuất bản thành công: Sách đã được thêm vào kho")
      setTimeout(() => {
        router.push("/admin/books")
      }, 1500)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tiến trình</CardTitle>
              <Badge variant={bookStatus === "published" ? "default" : "secondary"}>
                {bookStatus === "draft" && "Bản nháp"}
                {bookStatus === "validating" && "Đang kiểm tra..."}
                {bookStatus === "ready" && "Sẵn sàng xuất bản"}
                {bookStatus === "published" && "Đã xuất bản"}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(index)}
                className={`flex flex-col items-center gap-1 ${
                  index === currentStep
                    ? "text-primary"
                    : index < currentStep
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50"
                }`}
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-full border-2 ${
                    index === currentStep
                      ? "border-primary bg-primary text-primary-foreground"
                      : index < currentStep
                        ? "border-primary bg-primary/10"
                        : "border-muted"
                  }`}
                >
                  <step.icon className="size-5" />
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Validation errors */}
      {validationErrors.length > 0 && bookStatus !== "validating" && (
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

      {bookStatus === "ready" && (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>SẴN SÀNG XUẤT BẢN</AlertTitle>
          <AlertDescription>
            Thông tin sách đã được kiểm tra và hợp lệ. Bạn có thể xuất bản ngay bây giờ.
          </AlertDescription>
        </Alert>
      )}

      {/* Form tabs */}
      <Tabs value={steps[currentStep].id} className="space-y-4">
        <TabsList className="hidden">
          {steps.map((step) => (
            <TabsTrigger key={step.id} value={step.id}>
              {step.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Step 1: Book Info */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>Nhập thông tin cơ bản về sách</CardDescription>
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


        </TabsContent>

        {/* Step 2: Author */}
        <TabsContent value="author" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tác giả</CardTitle>
              <CardDescription>Chọn tác giả hiện có hoặc tạo mới</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="author">Chọn tác giả</Label>
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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Hoặc</span>
                </div>
              </div>

              <Dialog open={showAuthorDialog} onOpenChange={setShowAuthorDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Plus className="mr-2 size-4" />
                    Tạo tác giả mới
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Thêm tác giả mới</DialogTitle>
                    <DialogDescription>Nhập thông tin tác giả mới</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="authorName">Tên tác giả *</Label>
                      <Input
                        id="authorName"
                        placeholder="Nhập tên tác giả"
                        value={formData.authorName}
                        onChange={(e) => updateFormData("authorName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authorBio">Tiểu sử</Label>
                      <Textarea id="authorBio" placeholder="Thông tin về tác giả..." rows={3} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAuthorDialog(false)}>
                      Hủy
                    </Button>
                    <Button
                      onClick={() => {
                        if (formData.authorName) {
                          setShowAuthorDialog(false)
                          alert(`Đã thêm tác giả: Tác giả ${formData.authorName} đã được thêm`)
                        }
                      }}
                    >
                      Lưu tác giả
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {formData.authorId && (
                <Alert>
                  <User className="size-4" />
                  <AlertTitle>Tác giả đã chọn</AlertTitle>
                  <AlertDescription>{mockAuthors.find((a) => a.id === formData.authorId)?.name}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Media Upload */}
        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hình ảnh</CardTitle>
              <CardDescription>Upload ảnh bìa và ảnh preview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cover">Ảnh bìa *</Label>
                <div className="flex items-center gap-4">
                  {formData.coverImage ? (
                    <div className="relative size-32 rounded-lg border bg-muted">
                      <img
                        src={URL.createObjectURL(formData.coverImage) || "/placeholder.svg"}
                        alt="Cover preview"
                        className="size-full rounded-lg object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 size-6"
                        onClick={() => updateFormData("coverImage", null)}
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="cover"
                      className="flex size-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:bg-muted"
                    >
                      <Upload className="size-8 text-muted-foreground" />
                      <span className="mt-2 text-xs text-muted-foreground">Upload</span>
                      <input
                        id="cover"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) updateFormData("coverImage", file)
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ảnh preview (Tùy chọn)</Label>
                <div className="grid grid-cols-4 gap-4">
                  {formData.previewImages.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg border bg-muted">
                      <img
                        src={URL.createObjectURL(img) || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="size-full rounded-lg object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 size-6"
                        onClick={() => {
                          const newImages = formData.previewImages.filter((_, i) => i !== index)
                          updateFormData("previewImages", newImages)
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  {formData.previewImages.length < 4 && (
                    <label
                      htmlFor="preview"
                      className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:bg-muted"
                    >
                      <Plus className="size-6 text-muted-foreground" />
                      <input
                        id="preview"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          const newImages = [...formData.previewImages, ...files].slice(0, 4)
                          updateFormData("previewImages", newImages)
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 4: Stock Management */}
        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý kho</CardTitle>
              <CardDescription>
                {formData.isPreOrder
                  ? "Thông tin kho hàng sẽ được cập nhật sau khi sách phát hành"
                  : "Thêm thông tin tồn kho cho sách"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bookType">Loại sách</Label>
                <Select value={formData.bookType} onValueChange={(value) => updateFormData("bookType", value)}>
                  <SelectTrigger id="bookType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Sách giấy</SelectItem>
                    <SelectItem value="ebook">Sách điện tử</SelectItem>
                    <SelectItem value="both">Cả hai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.bookType !== "ebook" && !formData.isPreOrder && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="stockQuantity">Số lượng tồn kho *</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        placeholder="100"
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

              {formData.isPreOrder && (
                <Alert>
                  <Package className="size-4" />
                  <AlertTitle>Sách đặt trước</AlertTitle>
                  <AlertDescription>
                    Sách đang ở trạng thái đặt trước. Thông tin tồn kho sẽ được cập nhật sau ngày phát hành:{" "}
                    <strong>
                      {formData.preOrderReleaseDate
                        ? new Date(formData.preOrderReleaseDate).toLocaleDateString("vi-VN")
                        : "Chưa xác định"}
                    </strong>
                  </AlertDescription>
                </Alert>
              )}

              {formData.bookType === "ebook" && (
                <Alert>
                  <AlertCircle className="size-4" />
                  <AlertTitle>Sách điện tử</AlertTitle>
                  <AlertDescription>Sách điện tử không cần quản lý tồn kho vật lý</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 5: Review */}
        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kiểm tra thông tin</CardTitle>
              <CardDescription>Xem lại tất cả thông tin trước khi xuất bản</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Thông tin sách</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium">Tên sách</dt>
                        <dd className="text-sm text-muted-foreground">{formData.title || "Chưa nhập"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium">ISBN</dt>
                        <dd className="text-sm text-muted-foreground font-mono">{formData.isbn || "Chưa nhập"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium">Danh mục</dt>
                        <dd className="text-sm text-muted-foreground">{formData.category || "Chưa chọn"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium">Giá</dt>
                        <dd className="text-sm text-muted-foreground">
                          {formData.price
                            ? new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(Number.parseFloat(formData.price))
                            : "Chưa nhập"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {formData.isPreOrder && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Thông tin đặt trước</h4>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm font-medium">Trạng thái</dt>
                          <dd>
                            <Badge variant="secondary">Đặt trước</Badge>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium">Ngày phát hành dự kiến</dt>
                          <dd className="text-sm text-muted-foreground">
                            {formData.preOrderReleaseDate
                              ? new Date(formData.preOrderReleaseDate).toLocaleDateString("vi-VN", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "Chưa xác định"}
                          </dd>
                        </div>
                        {formData.preOrderLimit && (
                          <div>
                            <dt className="text-sm font-medium">Giới hạn đặt trước</dt>
                            <dd className="text-sm text-muted-foreground">{formData.preOrderLimit} cuốn</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Tác giả</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium">Tên tác giả</dt>
                        <dd className="text-sm text-muted-foreground">
                          {formData.authorId
                            ? mockAuthors.find((a) => a.id === formData.authorId)?.name
                            : formData.authorName || "Chưa chọn"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Hình ảnh</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium">Ảnh bìa</dt>
                        <dd className="text-sm text-muted-foreground">
                          {formData.coverImage ? "✓ Đã upload" : "✗ Chưa upload"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium">Ảnh preview</dt>
                        <dd className="text-sm text-muted-foreground">{formData.previewImages.length} ảnh</dd>
                      </div>
                    </dl>
                  </div>

                  {!formData.isPreOrder && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Kho hàng</h4>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm font-medium">Loại sách</dt>
                          <dd className="text-sm text-muted-foreground capitalize">
                            {formData.bookType === "physical"
                              ? "Sách giấy"
                              : formData.bookType === "ebook"
                                ? "Ebook"
                                : "Cả hai"}
                          </dd>
                        </div>
                        {formData.bookType !== "ebook" && (
                          <>
                            <div>
                              <dt className="text-sm font-medium">Tồn kho</dt>
                              <dd className="text-sm text-muted-foreground">
                                {formData.stockQuantity || "Chưa nhập"} cuốn
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium">Vị trí</dt>
                              <dd className="text-sm text-muted-foreground">{formData.stockLocation || "Chưa nhập"}</dd>
                            </div>
                          </>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation buttons */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
            disabled={currentStep === 0}
          >
            Quay lại
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="mr-2 size-4" />
              Lưu nháp
            </Button>

            {currentStep === steps.length - 1 ? (
              <>
                <Button variant="secondary" onClick={handleValidate} disabled={bookStatus === "validating"}>
                  {bookStatus === "validating" ? "Đang kiểm tra..." : "Kiểm tra"}
                </Button>
                <Button onClick={handlePublish} disabled={bookStatus !== "ready"}>
                  Xuất bản
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))}
                disabled={currentStep === steps.length - 1}
              >
                Tiếp tục
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

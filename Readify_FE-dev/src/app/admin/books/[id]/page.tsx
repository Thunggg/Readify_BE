import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Trash2,
  Package,
  DollarSign,
  BookOpen,
  User,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

// Mock books data - in real app, fetch from API
const mockBooks = [
  {
    id: "1",
    title: "Clean Code",
    author: "Robert C. Martin",
    authorId: "1",
    category: "Programming",
    price: 450000,
    stock: 25,
    status: "published" as const,
    publishedAt: "2024-01-15",
    isbn: "978-0132350884",
    description:
      "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code.",
    pages: 464,
    publisher: "Prentice Hall",
    publishYear: "2008",
    language: "en",
    coverImage: "/clean-code-book.jpg",
    previewImages: ["/book-page-1.jpg", "/book-page-2.jpg"],
    bookType: "physical" as const,
    stockLocation: "Warehouse A - Shelf 12",
    isPreOrder: false,
    preOrderReleaseDate: null,
    preOrderLimit: null,
    preOrderCount: 0,
  },
  {
    id: "2",
    title: "Refactoring",
    author: "Martin Fowler",
    authorId: "2",
    category: "Programming",
    price: 520000,
    stock: 15,
    status: "published" as const,
    publishedAt: "2024-02-10",
    isbn: "978-0134757599",
    description:
      "Improve the design of existing code and make software easier to maintain and extend.",
    pages: 560,
    publisher: "Addison-Wesley",
    publishYear: "2018",
    language: "en",
    coverImage: "/clean-code-book.jpg",
    previewImages: ["/book-page-1.jpg", "/book-page-2.jpg"],
    bookType: "physical" as const,
    stockLocation: "Warehouse B - Shelf 5",
    isPreOrder: false,
    preOrderReleaseDate: null,
    preOrderLimit: null,
    preOrderCount: 0,
  },
  {
    id: "3",
    title: "Design Patterns",
    author: "Gang of Four",
    authorId: "3",
    category: "Programming",
    price: 680000,
    stock: 8,
    status: "published" as const,
    publishedAt: "2024-03-05",
    isbn: "978-0201633610",
    description: "Elements of Reusable Object-Oriented Software",
    pages: 395,
    publisher: "Addison-Wesley",
    publishYear: "1994",
    language: "en",
    coverImage: "/clean-code-book.jpg",
    previewImages: ["/book-page-1.jpg", "/book-page-2.jpg"],
    bookType: "physical" as const,
    stockLocation: "Warehouse A - Shelf 8",
    isPreOrder: false,
    preOrderReleaseDate: null,
    preOrderLimit: null,
    preOrderCount: 0,
  },
  {
    id: "4",
    title: "Test Driven Development",
    author: "Kent Beck",
    authorId: "4",
    category: "Programming",
    price: 380000,
    stock: 30,
    status: "published" as const,
    publishedAt: "2024-01-20",
    isbn: "978-0321146533",
    description: "By Example - A practical guide to test-driven development",
    pages: 220,
    publisher: "Addison-Wesley",
    publishYear: "2002",
    language: "en",
    coverImage: "/clean-code-book.jpg",
    previewImages: ["/book-page-1.jpg", "/book-page-2.jpg"],
    bookType: "physical" as const,
    stockLocation: "Warehouse C - Shelf 3",
    isPreOrder: false,
    preOrderReleaseDate: null,
    preOrderLimit: null,
    preOrderCount: 0,
  },
  {
    id: "5",
    title: "Clean Architecture",
    author: "Robert C. Martin",
    authorId: "1",
    category: "Programming",
    price: 520000,
    stock: 0,
    status: "published" as const,
    publishedAt: "2024-02-14",
    isbn: "978-0134494166",
    description: "A Craftsman's Guide to Software Structure and Design",
    pages: 432,
    publisher: "Prentice Hall",
    publishYear: "2017",
    language: "en",
    coverImage: "/clean-code-book.jpg",
    previewImages: ["/book-page-1.jpg", "/book-page-2.jpg"],
    bookType: "physical" as const,
    stockLocation: "Warehouse A - Shelf 12",
    isPreOrder: false,
    preOrderReleaseDate: null,
    preOrderLimit: null,
    preOrderCount: 0,
  },
  {
    id: "6",
    title: "The Pragmatic Programmer",
    author: "David Thomas",
    authorId: "5",
    category: "Programming",
    price: 450000,
    stock: 12,
    status: "published" as const,
    publishedAt: "2024-04-01",
    isbn: "978-0201616224",
    description:
      "Your Journey to Mastery - A guide to becoming a better programmer",
    pages: 352,
    publisher: "Addison-Wesley",
    publishYear: "1999",
    language: "en",
    coverImage: "/clean-code-book.jpg",
    previewImages: ["/book-page-1.jpg", "/book-page-2.jpg"],
    bookType: "physical" as const,
    stockLocation: "Warehouse B - Shelf 10",
  },
];

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const book = mockBooks.find((b) => String(b.id) === id);

  console.log("Book detail page params:", id);

  if (!book) {
    notFound();
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/books">Quản lý sách</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{book.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
            <p className="text-muted-foreground">Chi tiết thông tin sách</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/books/${book.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Chỉnh sửa
              </Link>
            </Button>
            <Button variant="destructive">
              <Trash2 className="mr-2 size-4" />
              Xóa
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left column - Cover image */}
          <Card>
            <CardContent className="p-6">
              <img
                src={book.coverImage || "/placeholder.svg"}
                alt={book.title}
                className="w-full rounded-lg border object-cover shadow-lg"
              />
              <div className="mt-4 space-y-2">
                <Badge
                  variant={book.status === "published" ? "default" : "outline"}
                  className="w-full justify-center"
                >
                  {book.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                </Badge>
                <div className="grid grid-cols-3 gap-2 pt-4">
                  {book.previewImages.map((img, index) => (
                    <img
                      key={index}
                      src={img || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      className="rounded border"
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right column - Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Quick stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Giá bán</CardTitle>
                  <DollarSign className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(book.price)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tồn kho</CardTitle>
                  <Package className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{book.stock}</div>
                  <p className="text-xs text-muted-foreground">
                    {book.stockLocation}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Số trang
                  </CardTitle>
                  <BookOpen className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{book.pages}</div>
                  <p className="text-xs text-muted-foreground">
                    {book.language === "vi" ? "Tiếng Việt" : "English"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Book information */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin sách</CardTitle>
                <CardDescription>Chi tiết về sách</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      ISBN
                    </p>
                    <p className="text-sm font-mono">{book.isbn}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Danh mục
                    </p>
                    <p className="text-sm">{book.category}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Nhà xuất bản
                    </p>
                    <p className="text-sm">{book.publisher}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Năm xuất bản
                    </p>
                    <p className="text-sm">{book.publishYear}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Loại sách
                    </p>
                    <p className="text-sm capitalize">
                      {book.bookType === "physical" ? "Sách giấy" : "Ebook"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Ngày xuất bản
                    </p>
                    <p className="text-sm">
                      {book.publishedAt
                        ? new Date(book.publishedAt).toLocaleDateString(
                            "vi-VN",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )
                        : "Chưa xuất bản"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Author information */}
            <Card>
              <CardHeader>
                <CardTitle>Tác giả</CardTitle>
                <CardDescription>Thông tin về tác giả</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <User className="size-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{book.author}</p>
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link href={`/admin/authors/${book.authorId}`}>
                        Xem trang tác giả
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Mô tả</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {book.description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}

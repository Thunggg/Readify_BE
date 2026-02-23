"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card } from "@/components/ui/card"
import { MoreHorizontal, Pencil, Trash2, Eye, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"

// Mock data for books
const mockBooks = [
  {
    id: "1",
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Programming",
    price: 450000,
    stock: 25,
    status: "published" as const,
    publishedAt: "2024-01-15",
    isPreOrder: false,
    preOrderReleaseDate: null,
  },
  {
    id: "2",
    title: "The Pragmatic Programmer",
    author: "David Thomas, Andrew Hunt",
    category: "Programming",
    price: 520000,
    stock: 15,
    status: "published" as const,
    publishedAt: "2024-02-20",
    isPreOrder: false,
    preOrderReleaseDate: null,
  },
  {
    id: "3",
    title: "Design Patterns",
    author: "Gang of Four",
    category: "Software Design",
    price: 680000,
    stock: 8,
    status: "published" as const,
    publishedAt: "2024-01-10",
    isPreOrder: false,
    preOrderReleaseDate: null,
  },
  {
    id: "4",
    title: "JavaScript: The Good Parts",
    author: "Douglas Crockford",
    category: "Web Development",
    price: 380000,
    stock: 0,
    status: "draft" as const,
    publishedAt: null,
    isPreOrder: false,
    preOrderReleaseDate: null,
  },
  {
    id: "5",
    title: "Refactoring",
    author: "Martin Fowler",
    category: "Programming",
    price: 590000,
    stock: 12,
    status: "published" as const,
    publishedAt: "2024-03-05",
    isPreOrder: false,
    preOrderReleaseDate: null,
  },
  {
    id: "6",
    title: "Advanced React Patterns 2025",
    author: "Kent C. Dodds",
    category: "Web Development",
    price: 650000,
    stock: 0,
    status: "published" as const,
    publishedAt: "2024-12-20",
    isPreOrder: true,
    preOrderReleaseDate: "2025-02-15",
  },
]

type SortField = "title" | "author" | "price" | "stock" | "publishedAt"
type SortOrder = "asc" | "desc"

export function BooksTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("publishedAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null)

  const filteredBooks = mockBooks.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || book.status === statusFilter
    const matchesCategory = categoryFilter === "all" || book.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortField) {
      case "title":
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case "author":
        aValue = a.author.toLowerCase()
        bValue = b.author.toLowerCase()
        break
      case "price":
        aValue = a.price
        bValue = b.price
        break
      case "stock":
        aValue = a.stock
        bValue = b.stock
        break
      case "publishedAt":
        aValue = a.publishedAt || ""
        bValue = b.publishedAt || ""
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedBooks.length / itemsPerPage)
  const paginatedBooks = sortedBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const handleDelete = (id: string) => {
    console.log("[v0] Deleting book:", id)
    setDeleteBookId(null)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 size-3" />
    return sortOrder === "asc" ? <ArrowUp className="ml-1 size-3" /> : <ArrowDown className="ml-1 size-3" />
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên sách hoặc tác giả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="published">Đã xuất bản</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                <SelectItem value="Programming">Programming</SelectItem>
                <SelectItem value="Web Development">Web Development</SelectItem>
                <SelectItem value="Software Design">Software Design</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("title")} className="h-8 px-2">
                  Tên sách
                  <SortIcon field="title" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("author")} className="h-8 px-2">
                  Tác giả
                  <SortIcon field="author" />
                </Button>
              </TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort("price")} className="h-8 px-2">
                  Giá
                  <SortIcon field="price" />
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button variant="ghost" onClick={() => handleSort("stock")} className="h-8 px-2">
                  Kho
                  <SortIcon field="stock" />
                </Button>
              </TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Không tìm thấy sách nào
                </TableCell>
              </TableRow>
            ) : (
              paginatedBooks.map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium">
                    {book.title}
                    {book.isPreOrder && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Đặt trước
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>{book.category}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(book.price)}
                  </TableCell>
                  <TableCell className="text-center">
                    {book.isPreOrder ? (
                      <span className="text-sm text-muted-foreground">
                        {book.preOrderReleaseDate
                          ? new Date(book.preOrderReleaseDate).toLocaleDateString("vi-VN", {
                              month: "short",
                              day: "numeric",
                            })
                          : "TBA"}
                      </span>
                    ) : (
                      <Badge variant={book.stock === 0 ? "destructive" : "secondary"}>{book.stock}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={book.status === "published" ? "default" : "outline"}>
                      {book.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/books/${book.id}`}>
                            <Eye className="mr-2 size-4" />
                            Xem chi tiết
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/books/${book.id}/edit`}>
                            <Pencil className="mr-2 size-4" />
                            Chỉnh sửa
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={(e) => {
                            e.preventDefault()
                            setDeleteBookId(book.id)
                          }}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Hiển thị {paginatedBooks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{" "}
          {Math.min(currentPage * itemsPerPage, sortedBooks.length)} trên {sortedBooks.length} sách
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="size-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Sau
          </Button>
        </div>
      </div>

      <AlertDialog open={!!deleteBookId} onOpenChange={() => setDeleteBookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa sách</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa sách này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteBookId && handleDelete(deleteBookId)} className="bg-destructive">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

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
import { EditBookForm } from "./edit-book-form";
import { notFound } from "next/navigation";

// Mock books data - in real app, fetch from API
const mockBooks = [
  {
    id: "1",
    title: "Clean Code",
    author: "Robert C. Martin",
    authorId: "1",
    category: "programming",
    price: "450000",
    stock: 25,
    status: "published" as const,
    publishedAt: "2024-01-15",
    isbn: "978-0132350884",
    description:
      "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
    pages: "464",
    publisher: "Prentice Hall",
    publishYear: "2008",
    language: "en",
    bookType: "physical" as const,
    stockLocation: "Warehouse A - Shelf 12",
    stockQuantity: "25",
  },
  {
    id: "2",
    title: "Refactoring",
    author: "Martin Fowler",
    authorId: "2",
    category: "programming",
    price: "520000",
    stock: 15,
    status: "published" as const,
    publishedAt: "2024-02-10",
    isbn: "978-0134757599",
    description: "Improve the design of existing code",
    pages: "560",
    publisher: "Addison-Wesley",
    publishYear: "2018",
    language: "en",
    bookType: "physical" as const,
    stockLocation: "Warehouse B - Shelf 5",
    stockQuantity: "15",
  },
  {
    id: "3",
    title: "Design Patterns",
    author: "Gang of Four",
    authorId: "3",
    category: "programming",
    price: "680000",
    stock: 8,
    status: "published" as const,
    publishedAt: "2024-03-05",
    isbn: "978-0201633610",
    description: "Elements of Reusable Object-Oriented Software",
    pages: "395",
    publisher: "Addison-Wesley",
    publishYear: "1994",
    language: "en",
    bookType: "physical" as const,
    stockLocation: "Warehouse A - Shelf 8",
    stockQuantity: "8",
  },
  {
    id: "4",
    title: "Test Driven Development",
    author: "Kent Beck",
    authorId: "4",
    category: "programming",
    price: "380000",
    stock: 30,
    status: "published" as const,
    publishedAt: "2024-01-20",
    isbn: "978-0321146533",
    description: "By Example",
    pages: "220",
    publisher: "Addison-Wesley",
    publishYear: "2002",
    language: "en",
    bookType: "physical" as const,
    stockLocation: "Warehouse C - Shelf 3",
    stockQuantity: "30",
  },
  {
    id: "5",
    title: "Clean Architecture",
    author: "Robert C. Martin",
    authorId: "1",
    category: "programming",
    price: "520000",
    stock: 0,
    status: "published" as const,
    publishedAt: "2024-02-14",
    isbn: "978-0134494166",
    description: "A Craftsman's Guide to Software Structure and Design",
    pages: "432",
    publisher: "Prentice Hall",
    publishYear: "2017",
    language: "en",
    bookType: "physical" as const,
    stockLocation: "Warehouse A - Shelf 12",
    stockQuantity: "0",
  },
  {
    id: "6",
    title: "The Pragmatic Programmer",
    author: "David Thomas",
    authorId: "5",
    category: "programming",
    price: "450000",
    stock: 12,
    status: "published" as const,
    publishedAt: "2024-04-01",
    isbn: "978-0201616224",
    description: "Your Journey to Mastery",
    pages: "352",
    publisher: "Addison-Wesley",
    publishYear: "1999",
    language: "en",
    bookType: "physical" as const,
    stockLocation: "Warehouse B - Shelf 10",
    stockQuantity: "12",
  },
];
export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // In real app, fetch book by id
  const book = mockBooks.find((b) => b.id === id);

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
              <BreadcrumbLink href={`/admin/books/${book.id}`}>
                {book.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Chỉnh sửa</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chỉnh sửa sách</h1>
          <p className="text-muted-foreground">Cập nhật thông tin sách</p>
        </div>

        <EditBookForm book={book} />
      </div>
    </SidebarInset>
  );
}

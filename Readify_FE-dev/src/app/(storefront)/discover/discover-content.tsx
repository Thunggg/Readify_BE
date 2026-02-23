"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookCard } from "@/components/storefront/book-card"
import {
  BookOpen,
  Brain,
  Briefcase,
  Heart,
  Landmark,
  Languages,
  Lightbulb,
  TrendingUp,
  Users,
  Sparkles,
  Clock,
  Award,
} from "lucide-react"

const categories = [
  {
    slug: "van-hoc",
    name: "Văn học",
    icon: BookOpen,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
    count: 1250,
    description: "Khám phá thế giới văn chương phong phú",
  },
  {
    slug: "ky-nang-song",
    name: "Kỹ năng sống",
    icon: Lightbulb,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-950",
    count: 845,
    description: "Phát triển bản thân và kỹ năng mềm",
  },
  {
    slug: "tam-ly",
    name: "Tâm lý",
    icon: Brain,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-950",
    count: 623,
    description: "Hiểu rõ hơn về tâm trí con người",
  },
  {
    slug: "kinh-doanh",
    name: "Kinh doanh",
    icon: Briefcase,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-950",
    count: 567,
    description: "Chiến lược và quản trị doanh nghiệp",
  },
  {
    slug: "lich-su",
    name: "Lịch sử",
    icon: Landmark,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-950",
    count: 432,
    description: "Khám phá quá khứ và văn minh nhân loại",
  },
  {
    slug: "ngoai-ngu",
    name: "Ngoại ngữ",
    icon: Languages,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-100 dark:bg-pink-950",
    count: 389,
    description: "Học ngoại ngữ hiệu quả",
  },
  {
    slug: "thieu-nhi",
    name: "Thiếu nhi",
    icon: Heart,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950",
    count: 756,
    description: "Sách cho trẻ em và thanh thiếu niên",
  },
  {
    slug: "kinh-te",
    name: "Kinh tế",
    icon: TrendingUp,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-100 dark:bg-teal-950",
    count: 445,
    description: "Phân tích kinh tế và tài chính",
  },
]

const featuredCollections = [
  {
    title: "Sách mới ra mắt",
    icon: Sparkles,
    books: [
      {
        id: 1,
        title: "Nhà Giả Kim",
        author: "Paulo Coelho",
        price: "120.000đ",
        rating: 4.8,
        reviews: 2500,
        imageUrl: "/alchemist-book-cover.png",
      },
      {
        id: 2,
        title: "Đắc Nhân Tâm",
        author: "Dale Carnegie",
        price: "85.000đ",
        rating: 4.9,
        reviews: 5000,
        imageUrl: "/how-to-win-friends-book.jpg",
      },
      {
        id: 3,
        title: "Tuổi Trẻ Đáng Giá Bao Nhiêu",
        author: "Rosie Nguyễn",
        price: "90.000đ",
        rating: 4.7,
        reviews: 3000,
        imageUrl: "/youth-motivation-book.jpg",
      },
      {
        id: 4,
        title: "Cây Cam Ngọt Của Tôi",
        author: "José Mauro",
        price: "105.000đ",
        rating: 4.9,
        reviews: 4000,
        imageUrl: "/my-sweet-orange-tree-book.jpg",
      },
    ],
  },
  {
    title: "Xu hướng hiện tại",
    icon: Clock,
    books: [
      {
        id: 5,
        title: "Thay Đổi Tí Hon",
        author: "James Clear",
        price: "160.000đ",
        rating: 4.8,
        reviews: 8000,
        imageUrl: "/atomic-habits-book.png",
      },
      {
        id: 6,
        title: "Sapiens: Lược Sử Loài Người",
        author: "Yuval Noah Harari",
        price: "195.000đ",
        originalPrice: "220.000đ",
        rating: 4.9,
        reviews: 6000,
        imageUrl: "/sapiens-book-cover.png",
      },
      {
        id: 7,
        title: "Nghệ Thuật Bán Hàng",
        author: "Brian Tracy",
        price: "125.000đ",
        rating: 4.6,
        reviews: 2000,
        imageUrl: "/sales-book.jpg",
      },
      {
        id: 8,
        title: "Tâm Lý Học Đám Đông",
        author: "Gustave Le Bon",
        price: "98.000đ",
        rating: 4.7,
        reviews: 3500,
        imageUrl: "/psychology-of-crowds-book.jpg",
      },
    ],
  },
  {
    title: "Được yêu thích nhất",
    icon: Award,
    books: [
      {
        id: 9,
        title: "Người Thầy Cuối Cùng",
        author: "Mitch Albom",
        price: "78.000đ",
        rating: 4.8,
        reviews: 2800,
        imageUrl: "/tuesdays-with-morrie-book.jpg",
      },
      {
        id: 10,
        title: "Chiến Tranh Tiền Tệ",
        author: "Song Hongbing",
        price: "145.000đ",
        rating: 4.5,
        reviews: 1800,
        imageUrl: "/currency-wars-book.jpg",
      },
      {
        id: 11,
        title: "Tư Duy Nhanh Và Chậm",
        author: "Daniel Kahneman",
        price: "175.000đ",
        rating: 4.9,
        reviews: 5500,
        imageUrl: "/thinking-fast-and-slow-book.jpg",
      },
      {
        id: 12,
        title: "Cafe Cùng Tony",
        author: "Tony Buổi Sáng",
        price: "88.000đ",
        rating: 4.6,
        reviews: 3200,
        imageUrl: "/cafe-book-vietnamese.jpg",
      },
    ],
  },
]

export function DiscoverContent() {
  const [activeCollection, setActiveCollection] = useState(0)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <Badge className="mb-4" variant="secondary">
          <Users className="h-3 w-3 mr-1" />
          Khám phá
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Khám phá thế giới sách theo danh mục</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Tìm kiếm những cuốn sách hay nhất theo từng thể loại và khám phá bộ sưu tập đặc biệt được tuyển chọn
        </p>
      </div>

      {/* Categories Grid */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Danh mục phổ biến</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`}>
              <Card className="group hover:shadow-lg transition-all hover:scale-105 h-full">
                <CardContent className="p-6">
                  <div className={`${category.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                    <category.icon className={`h-6 w-6 ${category.color}`} />
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{category.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{category.description}</p>
                  <p className="text-xs text-muted-foreground">{category.count.toLocaleString()} cuốn sách</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Collections */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Bộ sưu tập đặc biệt</h2>

        {/* Collection Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {featuredCollections.map((collection, index) => (
            <Button
              key={index}
              variant={activeCollection === index ? "default" : "outline"}
              onClick={() => setActiveCollection(index)}
              className="gap-2"
            >
              <collection.icon className="h-4 w-4" />
              {collection.title}
            </Button>
          ))}
        </div>

        {/* Books Grid */}
        {/* <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featuredCollections[activeCollection].books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div> */}

        <div className="text-center mt-8">
          <Button size="lg" asChild>
            <Link href="/products">Xem tất cả sản phẩm</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

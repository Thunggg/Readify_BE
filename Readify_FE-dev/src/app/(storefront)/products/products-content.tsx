"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BookCard } from "@/components/storefront/book-card"
import { ProductFilters } from "./product-filters"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SlidersHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { BookApiRequest } from "@/api-request/book"
import { PublicBook, SearchPublicBooksParams } from "@/types/book"
import { PaginationMeta } from "@/types/api"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const ITEMS_PER_PAGE = 12

type SortOption = SearchPublicBooksParams["sort"]

export function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State
  const [books, setBooks] = useState<PublicBook[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Get params from URL
  const currentPage = Number(searchParams.get("page")) || 1
  const currentSort = (searchParams.get("sort") as SortOption) || "newest"
  const currentSearch = searchParams.get("q") || ""
  const currentCategoryId = searchParams.get("categoryId") || ""
  const currentMinPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined
  const currentMaxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined
  const currentInStock = searchParams.get("inStock") === "true" ? true : undefined

  // Update URL params
  const updateParams = useCallback((newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === "0") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    
    router.push(`/products?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  // Fetch books
  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true)
      try {
        const params: SearchPublicBooksParams = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          sort: currentSort,
        }
        
        if (currentSearch) params.q = currentSearch
        if (currentCategoryId) params.categoryId = currentCategoryId
        if (currentMinPrice) params.minPrice = currentMinPrice
        if (currentMaxPrice) params.maxPrice = currentMaxPrice
        if (currentInStock) params.inStock = currentInStock

        const res = await BookApiRequest.getBooks(params)
        
        if (res && res.payload.success) {
          setBooks(res.payload.data.items)
          setMeta(res.payload.data.meta || null)
        }
      } catch (error) {
        console.error("Failed to fetch books:", error)
        setBooks([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooks()
  }, [currentPage, currentSort, currentSearch, currentCategoryId, currentMinPrice, currentMaxPrice, currentInStock])

  // Handlers
  const handleSortChange = (value: string) => {
    updateParams({ sort: value, page: "1" })
  }

  const handlePageChange = (page: number) => {
    updateParams({ page: page.toString() })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleFilterChange = (filters: {
    categoryId?: string
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
  }) => {
    updateParams({
      categoryId: filters.categoryId,
      minPrice: filters.minPrice?.toString(),
      maxPrice: filters.maxPrice?.toString(),
      inStock: filters.inStock ? "true" : undefined,
      page: "1",
    })
  }

  // Pagination component
  const renderPagination = () => {
    if (!meta || meta.totalPages === undefined || meta.totalPages <= 1) return null

    const totalPages = meta.totalPages
    const pages: (number | "ellipsis")[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("ellipsis")
      
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) pages.push("ellipsis")
      pages.push(totalPages)
    }

    return (
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (currentPage > 1) handlePageChange(currentPage - 1)
              }}
              className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {pages.map((page, index) => (
            <PaginationItem key={index}>
              {page === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(page)
                  }}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (currentPage < totalPages) handlePageChange(currentPage + 1)
              }}
              className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  // Skeleton loading
  const renderSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="w-full aspect-[2/3] rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )

  // Empty state
  const renderEmptyState = () => (
    <div className="text-center py-16">
      <h3 className="text-lg font-semibold mb-2">No products found</h3>
      <p className="text-muted-foreground mb-4">
        No products match your current filters.
        <br />Try adjusting or clearing your filters.
      </p>
      <Button variant="outline" onClick={() => router.push("/products")}>
        Clear filters
      </Button>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">All Products</h1>
        <p className="text-muted-foreground">Explore our complete book collection</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Filters - Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <ProductFilters 
            onFilterChange={handleFilterChange}
            initialFilters={{
              categoryId: currentCategoryId,
              minPrice: currentMinPrice,
              maxPrice: currentMaxPrice,
              inStock: currentInStock,
            }}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b">
            <div className="flex items-center gap-2">
              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden bg-transparent">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <div className="py-4">
                    <h2 className="text-lg font-semibold mb-4">Filters</h2>
                    <ProductFilters 
                      onFilterChange={handleFilterChange}
                      initialFilters={{
                        categoryId: currentCategoryId,
                        minPrice: currentMinPrice,
                        maxPrice: currentMaxPrice,
                        inStock: currentInStock,
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <p className="text-sm text-muted-foreground">
                {meta ? (
                  <>
                    Showing <span className="font-semibold text-foreground">{books.length}</span> of {meta.total} products
                  </>
                ) : (
                  "Loading..."
                )}
              </p>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              {/* Sort Select */}
              <Select value={currentSort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="best_selling">Best Selling</SelectItem>
                  <SelectItem value="rating_desc">Highest Rated</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            renderSkeleton()
          ) : books.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {books.map((book) => (
                <BookCard key={book._id} {...book} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && books.length > 0 && renderPagination()}
        </div>
      </div>
    </div>
  )
}

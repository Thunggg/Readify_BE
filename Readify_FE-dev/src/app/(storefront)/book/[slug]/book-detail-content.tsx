"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookCard } from "@/components/storefront/book-card";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  RotateCcw,
  Minus,
  Plus,
} from "lucide-react";
import { BookApiRequest } from "@/api-request/book";
import { PublicBook, PublicBookDetail } from "@/types/book";
interface BookDetailContentProps {
  bookSlug: string;
}

export function BookDetailContent({ bookSlug }: BookDetailContentProps) {
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [book, setBook] = useState<PublicBookDetail | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<PublicBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookSlug) return;

    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [bookRes, relatedRes] = await Promise.all([
          BookApiRequest.getBySlug(bookSlug),
          BookApiRequest.getRelatedBySlug(bookSlug,4),
        ]);

        if (!mounted) return;

        // book detail
        if (bookRes.status >= 200 && bookRes.status < 300) {
          setBook(bookRes.payload.data as PublicBookDetail);
        } else {
          setBook(null);
        }

        // related books
        if (relatedRes.status >= 200 && relatedRes.status < 300) {
          setRelatedBooks(relatedRes.payload.data as PublicBook[] ?? []);
        } else {
          setRelatedBooks([]);
        }
      } catch (err) {
        if (!mounted) return;
        console.error("Fetch book data failed", err);
        setBook(null);
        setRelatedBooks([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [bookSlug]);

  console.log("Book detail data:", relatedBooks);

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!book) {
    return <div className="container mx-auto px-4 py-8">Book not found</div>;
  }

  function formatPrice(value?: number | string | null) {
    if (value === null || value === undefined) return "0 ₫";

    // nếu là string, cố parse thành số
    const num =
      typeof value === "number"
        ? value
        : Number(String(value).replace(/[^\d.-]/g, ""));

    if (!Number.isFinite(num)) return "0 ₫";

    return num.toLocaleString("vi-VN") + " ₫";
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link
          href="/products"
          className="transition-colors hover:text-foreground"
        >
          Products
        </Link>
        <span>/</span>
        {book.categoryIds?.[0] && (
          <>
            <Link
              href={`/category/${book.categoryIds[0].slug}`}
              className="transition-colors hover:text-foreground"
            >
              {book.categoryIds[0].name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground">{book.title}</span>
      </nav>

      {/* Product Detail */}
      <div className="mb-12 grid gap-8 md:grid-cols-2 lg:grid-cols-5">
        {/* Image Section */}
        <div className="lg:col-span-2">
          <div className="sticky top-8 space-y-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-[3/4] bg-muted">
                  <Image
                    src={
                      book.images?.[selectedImage]?.url ||
                      book.thumbnailUrl ||
                      "/book-default-cover.jpg"
                    }
                    alt={book.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Image Gallery Thumbnails */}
            {book.images && book.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {book.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-[3/4] overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === index
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <Image
                      src={image.url || "/book-default-cover.jpg"}
                      alt={`${book.title} image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-6 lg:col-span-3">
          {/* Title & Category */}
          <div>
            {book.categoryIds?.[0] && (
              <Badge className="mb-3">{book.categoryIds[0].name}</Badge>
            )}
            <h1 className="mb-2 text-3xl font-bold text-balance md:text-4xl">
              {book.title}
            </h1>
            {book.authors && book.authors.length > 0 && (
              <p className="text-lg text-muted-foreground">
                Author:{" "}
                <span className="font-medium text-foreground">
                  {book.authors.map((a) => a.name).join(", ")}
                </span>
              </p>
            )}
            {book.publisherId && (
              <p className="text-lg text-muted-foreground">
                Publisher:{" "}
                <span className="font-medium text-foreground">
                  {book.publisherId.name}
                </span>
              </p>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(book.averageRating || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold">
                {book.averageRating?.toFixed(1) || "0.0"}
              </span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-sm text-muted-foreground">
              {(book.totalReviews || 0).toLocaleString()} reviews
            </span>
            {book.soldCount !== undefined && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <span className="text-sm text-muted-foreground">
                  {book.soldCount.toLocaleString()} sold
                </span>
              </>
            )}
          </div>

          {/* Price */}
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <div className="mb-2 flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">
                  {formatPrice(book.basePrice)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">VAT included</p>
            </CardContent>
          </Card>

          {/* Stock Status */}
          {book.isInStock !== undefined && (
            <div>
              {book.isInStock ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  In Stock
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-200"
                >
                  Out of Stock
                </Badge>
              )}
            </div>
          )}

          {/* Quantity & Actions */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center rounded-lg border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="h-10 w-10"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  className="h-10 w-10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="flex-1" disabled={!book.isInStock}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart
                  className={`h-5 w-5 ${
                    isFavorite ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </Button>
              <Button size="lg" variant="outline">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Truck className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">Free shipping</p>
                  {/* <p className="text-xs text-muted-foreground">
                    Orders over 200,000₫
                  </p> */}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">Authentic product</p>
                  <p className="text-xs text-muted-foreground">
                    100% genuine source
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <RotateCcw className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">Easy returns</p>
                  <p className="text-xs text-muted-foreground">Within 7 days</p>
                </div>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <Card className="mb-12">
        <CardContent className="p-6">
          <Tabs defaultValue="description">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="description">Product description</TabsTrigger>
              <TabsTrigger value="specs">Specifications</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6 space-y-4">
              {book.description && (
                <div>
                  <h3 className="mb-3 text-xl font-semibold">Book overview</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {book.description}
                  </p>
                </div>
              )}

              {book.tags && book.tags.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xl font-semibold">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {book.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="specs" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {book.authors && book.authors.length > 0 && (
                  <div className="flex justify-between border-b py-3">
                    <span className="text-muted-foreground">Author(s)</span>
                    <span className="font-medium">
                      {book.authors.map((a) => a.name).join(", ")}
                    </span>
                  </div>
                )}
                {book.publisherId && (
                  <div className="flex justify-between border-b py-3">
                    <span className="text-muted-foreground">Publisher</span>
                    <span className="font-medium">{book.publisherId.name}</span>
                  </div>
                )}
                {book.publishDate && (
                  <div className="flex justify-between border-b py-3">
                    <span className="text-muted-foreground">
                      Publication Date
                    </span>
                    <span className="font-medium">
                      {new Date(book.publishDate).toLocaleDateString(
                        "vi-VN"
                      )}
                    </span>
                  </div>
                )}
                {book.pageCount && (
                  <div className="flex justify-between border-b py-3">
                    <span className="text-muted-foreground">Pages</span>
                    <span className="font-medium">{book.pageCount} pages</span>
                  </div>
                )}
                {book.language && (
                  <div className="flex justify-between border-b py-3">
                    <span className="text-muted-foreground">Language</span>
                    <span className="font-medium">{book.language}</span>
                  </div>
                )}
                {book.isbn && (
                  <div className="flex justify-between border-b py-3">
                    <span className="text-muted-foreground">ISBN</span>
                    <span className="font-medium">{book.isbn}</span>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Related Products */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Related products</h2>
          <Button variant="link" asChild>
            <Link href="/products">View all</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {relatedBooks.map((book) => (
            <BookCard key={book.slug} {...book} />
          ))}
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star } from "lucide-react";
import { WishlistButton } from "@/components/shared/wishlist-button";
interface BookCardProps {
  _id: string;
  slug: string;
  title: string;
  authors: {
    _id: string;
    name: string;
    slug: string;
  }[];
  thumbnailUrl?: string;

  basePrice: number;
  currency?: string;
  soldCount?: number;

  rating?: number;
  reviews?: number; 

  badge?: string;
}

function getSafeImageUrl(url?: string) {
  if (!url || typeof url !== "string") return "/book-default-cover.jpg";
  if (!url.startsWith("http") && !url.startsWith("/"))
    return "/book-default-cover.jpg";
  return url;
}

export function BookCard({
  _id,
  slug,
  title,
  authors,
  thumbnailUrl,
  basePrice,
  currency = "VND",
  soldCount,
  rating,
  reviews,
  badge,
}: BookCardProps) {
  return (
    <Card className="overflow-hidden border border-border p-0">
      <Link href={`/book/${slug}`}>
        <div className="relative aspect-[4/4] overflow-hidden bg-muted">
          {badge && (
            <Badge className="absolute top-2 left-2 z-10 bg-red-500">
              {badge}
            </Badge>
          )}
          <WishlistButton 
            bookId={_id} 
            className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white"
          />
          <Image
            src={getSafeImageUrl(thumbnailUrl)}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
      </Link>

      <CardContent className="p-4 pt-0 space-y-2">
        <Link href={`/book/${slug}`}>
          <h3 className="font-semibold line-clamp-2 h-12">{title}</h3>
        </Link>

        <p className="text-sm text-muted-foreground truncate">
          {Array.isArray(authors) && authors.length > 0
            ? authors.map((a) => a.name).join(", ")
            : "Đang cập nhật"}
        </p>

        {rating !== undefined && reviews !== undefined && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{rating}</span>
            <span className="text-sm text-muted-foreground">({reviews})</span>
          </div>
        )}

        {soldCount !== undefined && (
          <p className="text-xs text-muted-foreground">Đã bán {soldCount}</p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            {basePrice ? basePrice.toLocaleString("vi-VN") : "0"} {currency}
          </span>
        </div>

        <Button className="w-full" size="sm">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Thêm vào giỏ
        </Button>
      </CardContent>
    </Card>
  );
}

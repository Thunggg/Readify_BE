"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/contexts/wishlist-context";

export function WishlistIcon() {
  const { wishlistCount } = useWishlist();

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link href="/wishlist">
        <Heart className="h-5 w-5" />
        {wishlistCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
            {wishlistCount > 9 ? "9+" : wishlistCount}
          </span>
        )}
        <span className="sr-only">Danh sách yêu thích</span>
      </Link>
    </Button>
  );
}

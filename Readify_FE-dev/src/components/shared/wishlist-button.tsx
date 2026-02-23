"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/contexts/wishlist-context";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  bookId: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
  className?: string;
}

export function WishlistButton({
  bookId,
  variant = "ghost",
  size = "icon",
  showText = false,
  className,
}: WishlistButtonProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [loading, setLoading] = useState(false);

  const inWishlist = isInWishlist(bookId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    setLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(bookId);
      } else {
        await addToWishlist(bookId);
      }
    } catch (error: any) {
      console.error("Error toggling wishlist:", error);
      alert(
        error?.payload?.message ||
          (inWishlist
            ? "Không thể xóa khỏi danh sách yêu thích"
            : "Không thể thêm vào danh sách yêu thích")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={loading}
      className={cn(
        inWishlist && "text-red-500 hover:text-red-600",
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart
          className={cn("h-4 w-4", inWishlist && "fill-current")}
        />
      )}
      {showText && (
        <span className="ml-2">
          {inWishlist ? "Đã yêu thích" : "Yêu thích"}
        </span>
      )}
    </Button>
  );
}

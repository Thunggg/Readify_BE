"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { WishlistApiRequest } from "@/api-request/wishlist";
import type { WishlistItem } from "@/types/wishlist";

export function WishlistContent() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<Set<string>>(
    new Set()
  );

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await WishlistApiRequest.getWishlist();

      if (response.payload.success) {
        setWishlistItems(response.payload.data);
      } else {
        setError(response.payload.message || "Failed to load wishlist");
      }
    } catch (err: any) {
      console.error("Error fetching wishlist:", err);
      const errorMessage =
        err?.payload?.message || err?.message || "Failed to load wishlist";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleSelectItem = (bookId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(bookId)) {
        newSet.delete(bookId);
      } else {
        newSet.add(bookId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === wishlistItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(wishlistItems.map((item) => item.bookId._id)));
    }
  };

  const removeItem = async (bookId: string) => {
    if (
      !confirm("Are you sure you want to remove this item from your wishlist?")
    ) {
      return;
    }

    try {
      setActionInProgress((prev) => new Set(prev).add(bookId));
      await WishlistApiRequest.removeFromWishlist(bookId);
      setWishlistItems((prev) =>
        prev.filter((item) => item.bookId._id !== bookId)
      );
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    } catch (err: any) {
      console.error("Error removing item:", err);
      alert(err?.payload?.message || "Failed to remove item");
    } finally {
      setActionInProgress((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    }
  };

  const moveToCart = async (bookId: string) => {
    try {
      setActionInProgress((prev) => new Set(prev).add(bookId));
      const response = await WishlistApiRequest.moveToCart(bookId);

      if (response.payload.success) {
        setWishlistItems((prev) =>
          prev.filter((item) => item.bookId._id !== bookId)
        );
        setSelectedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(bookId);
          return newSet;
        });
        alert("Added to cart!");
      }
    } catch (err: any) {
      console.error("Error moving to cart:", err);
      alert(err?.payload?.message || "Failed to add to cart");
    } finally {
      setActionInProgress((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    }
  };

  const bulkMoveToCart = async () => {
    if (selectedItems.size === 0) return;

    try {
      setLoading(true);
      const response = await WishlistApiRequest.bulkMoveToCart({
        bookIds: Array.from(selectedItems),
      });

      if (response.payload.success) {
        const result = response.payload.data;

        if (result.success.length > 0) {
          setWishlistItems((prev) =>
            prev.filter((item) => !result.success.includes(item.bookId._id))
          );
          setSelectedItems(new Set());
        }

        if (result.failed.length > 0) {
          const failedMessages = result.failed
            .map((f) => `${f.bookId}: ${f.reason}`)
            .join("\n");
          alert(
            `Moved ${result.success.length} items.\nFailed:\n${failedMessages}`
          );
        } else {
          alert(`Moved ${result.success.length} items to cart!`);
        }
      }
    } catch (err: any) {
      console.error("Error bulk moving to cart:", err);
      alert(err?.payload?.message || "Failed to move items to cart");
    } finally {
      setLoading(false);
    }
  };

  const bulkRemove = async () => {
    if (selectedItems.size === 0) return;

    if (
      !confirm(
        `Are you sure you want to remove ${selectedItems.size} items from your wishlist?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await WishlistApiRequest.bulkRemove({
        bookIds: Array.from(selectedItems),
      });

      if (response.payload.success) {
        setWishlistItems((prev) =>
          prev.filter((item) => !selectedItems.has(item.bookId._id))
        );
        setSelectedItems(new Set());
        alert(`Removed ${response.payload.data.deletedCount} items`);
      }
    } catch (err: any) {
      console.error("Error bulk removing:", err);
      alert(err?.payload?.message || "Failed to remove items");
    } finally {
      setLoading(false);
    }
  };

  const clearWishlist = async () => {
    if (!confirm("Are you sure you want to clear your entire wishlist?")) {
      return;
    }

    try {
      setLoading(true);
      await WishlistApiRequest.clearWishlist();
      setWishlistItems([]);
      setSelectedItems(new Set());
      alert("Wishlist cleared");
    } catch (err: any) {
      console.error("Error clearing wishlist:", err);
      alert(err?.payload?.message || "Failed to clear wishlist");
    } finally {
      setLoading(false);
    }
  };


  if (loading && wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto text-center py-12">
          <CardContent className="space-y-4">
            <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
            <h2 className="text-2xl font-bold">Error Loading List</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchWishlist} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto text-center border-dashed border-2 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-red-500/5" />
          <CardContent className="py-20 px-8 relative">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-gradient-to-br from-primary/10 to-red-500/10 p-8 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-red-500/20 animate-pulse" />
                <Heart className="h-16 w-16 text-primary relative z-10" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-red-500 bg-clip-text text-transparent">
              Your Wishlist is Empty
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-base leading-relaxed">
              Discover amazing books and save your favorites here. Build your
              personal collection and never lose track of what you want to read
              next.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="min-w-[180px] shadow-lg">
                <Link href="/products">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Browse Books
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-w-[180px]"
              >
                <Link href="/">Explore Categories</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 space-y-6">
        <Button variant="ghost" asChild className="-ml-4 hover:bg-primary/5">
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                My Wishlist
              </h1>
              {/* <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-600 shadow-lg">
                <Heart className="h-5 w-5 text-white fill-white" />
              </div> */}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                <ShoppingCart className="h-3.5 w-3.5" />
                {wishlistItems.length}{" "}
                {wishlistItems.length === 1 ? "item" : "items"}
              </div>
              {selectedItems.size > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 font-medium animate-in fade-in">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {selectedItems.size} selected
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Wishlist Items */}
        <div className="lg:col-span-2 space-y-3">
          {/* Toolbar */}
          <Card className="bg-gradient-to-r from-muted/50 to-muted/30 border shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="select-all"
                    checked={selectedItems.size === wishlistItems.length}
                    onCheckedChange={toggleSelectAll}
                    className="data-[state=checked]:bg-primary"
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-semibold cursor-pointer select-none hover:text-primary transition-colors"
                  >
                    Select All ({wishlistItems.length})
                  </label>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedItems.size > 0 ? (
                    <div className="flex items-center gap-2 animate-in slide-in-from-right">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={bulkMoveToCart}
                        disabled={loading}
                        className="shadow-md hover:shadow-lg transition-all"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ShoppingCart className="h-4 w-4 mr-2" />
                        )}
                        Move {selectedItems.size} to Cart
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={bulkRemove}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearWishlist}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          {wishlistItems.map((item) => (
            <Card
              key={item._id}
              className="group hover:shadow-md transition-all duration-200"
            >
              <CardContent className="p-5">
                <div className="flex gap-5">
                  <div className="flex items-start pt-1">
                    <Checkbox
                      id={`item-${item.bookId._id}`}
                      checked={selectedItems.has(item.bookId._id)}
                      onCheckedChange={() => toggleSelectItem(item.bookId._id)}
                      disabled={actionInProgress.has(item.bookId._id)}
                      className="mt-1"
                    />
                  </div>

                  <Link
                    href={`/book/${item.bookId._id}`}
                    className="relative w-28 h-36 shrink-0 bg-muted rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow"
                  >
                    <Image
                      src={(item.bookId.thumbnailUrl || "/placeholder.svg")
                        .replace(/^"/, "")
                        .replace(/"$/, "")}
                      alt={item.bookId.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </Link>

                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <Link
                          href={`/book/${item.bookId._id}`}
                          className="group/link block"
                        >
                          <h3 className="font-bold text-lg line-clamp-2 group-hover/link:text-primary transition-colors leading-tight">
                            {item.bookId.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            <span className="font-medium text-foreground/80">
                              by
                            </span>{" "}
                            {item.bookId.authors?.join(", ") ||
                              "Unknown Author"}
                          </p>
                          {item.bookId.isbn && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              ISBN: {item.bookId.isbn}
                            </span>
                          )}
                        </div>

                        {item.bookId.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-1">
                            {item.bookId.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-3 border-t">

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => moveToCart(item.bookId._id)}
                          disabled={actionInProgress.has(item.bookId._id)}
                          className="shadow-md hover:shadow-lg transition-all hover:scale-105"
                        >
                          {actionInProgress.has(item.bookId._id) ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <ShoppingCart className="h-4 w-4 mr-2" />
                          )}
                          Add to Cart
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(item.bookId._id)}
                          disabled={actionInProgress.has(item.bookId._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 hover:scale-110 transition-all"
                        >
                          {actionInProgress.has(item.bookId._id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 shadow-lg border-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            <CardContent className="p-6 space-y-6 relative">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Quick Actions
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage your wishlist items efficiently
                </p>
              </div>

              <div className="space-y-3 p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Total Items
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-2xl font-bold text-primary">
                      {wishlistItems.length}
                    </span>
                  </div>
                </div>
                {selectedItems.size > 0 && (
                  <div className="flex justify-between items-center pt-3 border-t border-primary/20 animate-in slide-in-from-bottom">
                    <span className="text-sm font-semibold text-muted-foreground">
                      Selected
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {selectedItems.size}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  size="lg"
                  onClick={bulkMoveToCart}
                  disabled={selectedItems.size === 0 || loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-5 w-5 mr-2" />
                  )}
                  {selectedItems.size > 0
                    ? `Move ${selectedItems.size} to Cart`
                    : "Select Items First"}
                </Button>

                {selectedItems.size > 0 && (
                  <Button
                    variant="outline"
                    className="w-full border-2 hover:bg-red-50 hover:border-red-300 transition-all"
                    onClick={bulkRemove}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove {selectedItems.size}{" "}
                    {selectedItems.size === 1 ? "Item" : "Items"}
                  </Button>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                  onClick={clearWishlist}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Items
                </Button>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Heart className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    <span className="font-semibold">Pro tip:</span> Items in
                    your wishlist are saved for later. Add them to cart when
                    ready to purchase.
                  </p>
                </div>
                {/* <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>Real-time sync enabled</span>
                </div> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

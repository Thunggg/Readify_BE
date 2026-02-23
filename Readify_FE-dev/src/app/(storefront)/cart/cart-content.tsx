"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Ticket,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { DiscountModal } from "@/components/storefront/discount-modal";
import { CheckoutStepper } from "@/components/storefront/checkout-stepper";
import { CartApiRequest } from "@/api-request/cart";
import type { CartItem, StockValidation } from "@/types/cart";

export function CartContent() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [validation, setValidation] = useState<StockValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Track ongoing actions to prevent race conditions
  const actionInProgressRef = useRef<Set<string>>(new Set());

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await CartApiRequest.getCart();

      if (response.payload.success) {
        const data = response.payload.data;
        setCartItems(data.items || []);
        setValidation(data.validation || null);
      } else {
        setError(response.payload.message || "Failed to load cart");
      }
    } catch (err: any) {
      console.error("Error fetching cart:", err);
      const errorMessage =
        err?.payload?.message || err?.message || "Failed to load cart";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const selectedItems = cartItems.filter((item) => item.isSelected);

  const toggleItemSelection = async (bookId: string) => {
    const actionKey = `toggle-${bookId}`;
    if (actionInProgressRef.current.has(actionKey)) return;

    try {
      actionInProgressRef.current.add(actionKey);
      const response = await CartApiRequest.toggleSelectItem(bookId);

      if (response.payload.success) {
        const updatedItem = response.payload.data;
        setCartItems((prev) =>
          prev.map((item) =>
            item.bookId === bookId
              ? { ...item, isSelected: updatedItem.isSelected }
              : item
          )
        );
      }
    } catch (err: any) {
      console.error("Error updating selection:", err);
      const errorMessage =
        err?.payload?.message || "Failed to update selection";
      alert(errorMessage);
    } finally {
      actionInProgressRef.current.delete(actionKey);
    }
  };

  const toggleAllItems = async () => {
    const actionKey = "toggle-all";
    if (actionInProgressRef.current.has(actionKey)) return;

    try {
      actionInProgressRef.current.add(actionKey);
      const shouldSelectAll = selectedItems.length < cartItems.length;

      if (shouldSelectAll) {
        await CartApiRequest.selectAllItems();
      } else {
        await CartApiRequest.deselectAllItems();
      }

      // Refetch to get updated state
      await fetchCart();
    } catch (err: any) {
      console.error("Error updating selection:", err);
      const errorMessage =
        err?.payload?.message || "Failed to update selection";
      alert(errorMessage);
    } finally {
      actionInProgressRef.current.delete(actionKey);
    }
  };

  const updateQuantity = async (bookId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const actionKey = `quantity-${bookId}`;
    if (actionInProgressRef.current.has(actionKey)) return;

    try {
      actionInProgressRef.current.add(actionKey);
      const response = await CartApiRequest.updateQuantity({
        bookId,
        quantity: newQuantity,
      });

      if (response.payload.success) {
        const updatedItem = response.payload.data;
        setCartItems((prev) =>
          prev.map((item) =>
            item.bookId === bookId
              ? { ...item, quantity: updatedItem.quantity }
              : item
          )
        );
      }
    } catch (err: any) {
      console.error("Error updating quantity:", err);
      const errorMessage = err?.payload?.message || "Failed to update quantity";
      alert(errorMessage);
      // Refetch to restore correct state
      await fetchCart();
    } finally {
      actionInProgressRef.current.delete(actionKey);
    }
  };

  const removeItem = async (bookId: string) => {
    const actionKey = `remove-${bookId}`;
    if (actionInProgressRef.current.has(actionKey)) return;

    if (!confirm("Are you sure you want to remove this item from cart?")) {
      return;
    }

    try {
      actionInProgressRef.current.add(actionKey);
      await CartApiRequest.removeFromCart(bookId);

      // Optimistically remove from UI
      setCartItems((prev) => prev.filter((item) => item.bookId !== bookId));
    } catch (err: any) {
      console.error("Error removing item:", err);
      const errorMessage = err?.payload?.message || "Failed to remove item";
      alert(errorMessage);
      // Refetch to restore correct state
      await fetchCart();
    } finally {
      actionInProgressRef.current.delete(actionKey);
    }
  };

  const isActionInProgress = (bookId?: string) => {
    if (!bookId) {
      return actionInProgressRef.current.has("toggle-all");
    }
    return (
      actionInProgressRef.current.has(`toggle-${bookId}`) ||
      actionInProgressRef.current.has(`quantity-${bookId}`) ||
      actionInProgressRef.current.has(`remove-${bookId}`)
    );
  };

  // Helper function to get the effective price (stock price if available, otherwise book basePrice)
  const getEffectivePrice = (item: CartItem) => {
    return item.stock?.price ?? item.book?.basePrice ?? 0;
  };

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + getEffectivePrice(item) * item.quantity,
    0
  );
  const shipping = subtotal > 200000 ? 0 : subtotal > 0 ? 30000 : 0;
  const discount = 0;
  const total = subtotal + shipping - discount;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading) {
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
            <h2 className="text-2xl font-bold">Error Loading Cart</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchCart} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto text-center py-12">
          <CardContent className="space-y-4">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold">Cart is Empty</h2>
            <p className="text-muted-foreground">
              You don't have any items in your cart
            </p>
            <Button asChild className="mt-4">
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CheckoutStepper
        currentStep={1}
        steps={[
          { id: 1, title: "Cart", description: "Review items" },
          { id: 2, title: "Information", description: "Delivery details" },
          { id: 3, title: "Payment", description: "Complete order" },
        ]}
      />

      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <p className="text-muted-foreground mt-2">
          You have {cartItems.length} items in your cart (
          {selectedItems.length} selected)
        </p>

        {/* Show validation warnings */}
        {validation &&
          (validation.warnings.length > 0 || validation.removed.length > 0) && (
            <Card className="mt-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                      Stock Update
                    </p>
                    {validation.warnings.map((warning, idx) => (
                      <p
                        key={idx}
                        className="text-sm text-yellow-700 dark:text-yellow-300"
                      >
                        {warning.message}
                      </p>
                    ))}
                    {validation.removed.length > 0 && (
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        {validation.removed.length} items removed due to out of
                        stock
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="select-all"
                  checked={
                    selectedItems.length === cartItems.length &&
                    cartItems.length > 0
                  }
                  onCheckedChange={toggleAllItems}
                  disabled={isActionInProgress()}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Select All ({cartItems.length} items)
                </label>
              </div>
            </CardContent>
          </Card>

          {cartItems.map((item) => (
            <Card key={item.bookId}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex items-start pt-1">
                    <Checkbox
                      id={`item-${item.bookId}`}
                      checked={item.isSelected}
                      onCheckedChange={() => toggleItemSelection(item.bookId)}
                      disabled={isActionInProgress(item.bookId)}
                    />
                  </div>

                  <div className="relative w-24 h-32 shrink-0 bg-muted rounded-md overflow-hidden">
                    <Image
                      src={(
                        item.book?.thumbnailUrl ||
                        item.book?.coverUrl ||
                        "/placeholder.svg"
                      )
                        .replace(/^"/, "")
                        .replace(/"$/, "")}
                      alt={item.book?.title || "Book"}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-balance">
                          {item.book?.title || "Unknown Title"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {(item.book?.authors || item.book?.author)?.join(
                            ", "
                          ) || "Unknown Author"}
                        </p>
                        {item.stock?.quantity === 0 ? (
                          <p className="text-xs text-red-500 mt-1">Out of Stock</p>
                        ) : item.stock &&
                          item.stock.quantity < item.quantity ? (
                          <p className="text-xs text-orange-500 mt-1">
                            Only {item.stock.quantity} left
                          </p>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.bookId)}
                        className="text-red-500"
                        disabled={isActionInProgress(item.bookId)}
                      >
                        {isActionInProgress(item.bookId) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 border rounded-lg">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            updateQuantity(item.bookId, item.quantity - 1)
                          }
                          className="h-8 w-8"
                          disabled={
                            isActionInProgress(item.bookId) ||
                            item.quantity <= 1
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            updateQuantity(item.bookId, item.quantity + 1)
                          }
                          className="h-8 w-8"
                          disabled={isActionInProgress(item.bookId)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <p className="text-lg font-bold text-primary">
                        {formatPrice(getEffectivePrice(item) * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Order Summary</h2>

              <p className="text-sm text-muted-foreground">
                {selectedItems.length} items selected
              </p>

              {/* Selected Items List */}
              {selectedItems.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedItems.map((item) => (
                    <div
                      key={item.bookId}
                      className="flex justify-between items-start text-sm"
                    >
                      <div className="flex-1 pr-2">
                        <p className="line-clamp-1 font-medium">
                          {item.book?.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          SL: {item.quantity} x{" "}
                          {formatPrice(getEffectivePrice(item))}
                        </p>
                      </div>
                      <span className="font-medium whitespace-nowrap">
                        {formatPrice(getEffectivePrice(item) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? "Free" : formatPrice(shipping)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">
                      -{formatPrice(discount)}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(total)}
                </span>
              </div>

              {subtotal < 200000 && subtotal > 0 && (
                <p className="text-xs text-muted-foreground">
                  Add {formatPrice(200000 - subtotal)} for free shipping
                </p>
              )}

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 bg-transparent"
                  onClick={() => setShowDiscountModal(true)}
                  disabled={selectedItems.length === 0}
                >
                  <Ticket className="h-4 w-4" />
                  <span>Apply Discount Code</span>
                </Button>
              </div>

              <Button
                className="w-full"
                size="lg"
                asChild
                disabled={selectedItems.length === 0}
              >
                <Link href="/checkout">
                  Proceed to Checkout ({selectedItems.length})
                </Link>
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Shipping and taxes calculated at checkout
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <DiscountModal
        open={showDiscountModal}
        onOpenChange={setShowDiscountModal}
        subtotal={subtotal}
      />
    </div>
  );
}

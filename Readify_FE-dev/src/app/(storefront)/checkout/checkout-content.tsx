"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Ticket, CreditCard, Banknote, MapPin, Edit } from "lucide-react"
import { CheckoutStepper } from "@/components/storefront/checkout-stepper"
import { DiscountModal } from "@/components/storefront/discount-modal"
import { AddressSelectorDrawer } from "@/components/storefront/address-selector-drawer"

interface CartItem {
  id: number
  title: string
  author: string
  price: number
  quantity: number
  imageUrl: string
}

interface Address {
  id: number
  name: string
  phone: string
  address: string
  city: string
  zipCode: string
  isDefault: boolean
}

const DEFAULT_ADDRESSES: Address[] = [
  {
    id: 1,
    name: "John Doe",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street, Apt 4B",
    city: "New York",
    zipCode: "10001",
    isDefault: true,
  },
  {
    id: 2,
    name: "John Doe",
    phone: "+1 (555) 987-6543",
    address: "456 Oak Avenue",
    city: "Brooklyn",
    zipCode: "11201",
    isDefault: false,
  },
]

const CART_ITEMS: CartItem[] = [
  {
    id: 1,
    title: "The Alchemist",
    author: "Paulo Coelho",
    price: 120000,
    quantity: 1,
    imageUrl: "/alchemist-book-cover.png",
  },
  {
    id: 2,
    title: "How to Win Friends",
    author: "Dale Carnegie",
    price: 85000,
    quantity: 2,
    imageUrl: "/how-to-win-friends-book.jpg",
  },
  {
    id: 5,
    title: "Atomic Habits",
    author: "James Clear",
    price: 160000,
    quantity: 1,
    imageUrl: "/atomic-habits-book.png",
  },
]

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price)
}

export default function CheckoutContent() {
  const isLoggedIn = true
  const selectedAddressId = DEFAULT_ADDRESSES.find((a) => a.isDefault)?.id || 1
  const selectedAddress = DEFAULT_ADDRESSES.find((a) => a.id === selectedAddressId)

  const subtotal = CART_ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 200000 ? 0 : 30000
  const discount = 0
  const total = subtotal + shipping - discount

  return (
    <div className="container mx-auto px-4 py-8">
      <CheckoutStepper
        currentStep={2}
        steps={[
          { id: 1, title: "Cart", description: "Review items" },
          { id: 2, title: "Information", description: "Shipping details" },
          { id: 3, title: "Payment", description: "Complete order" },
        ]}
      />

      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/cart">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="text-muted-foreground mt-2">Complete your order</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Shipping Information</h2>
              </div>

              {isLoggedIn && selectedAddress ? (
                <div className="space-y-4">
                  <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">{selectedAddress.name}</p>
                            {selectedAddress.isDefault && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{selectedAddress.phone}</p>
                          <p className="text-sm text-muted-foreground mt-1">{selectedAddress.address}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedAddress.city}, {selectedAddress.zipCode}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="shrink-0 bg-transparent">
                          <Edit className="h-4 w-4 mr-2" />
                          Change
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Order Notes (Optional)</Label>
                    <Textarea id="notes" placeholder="Any special instructions for delivery..." rows={3} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john.doe@example.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" placeholder="123 Main Street" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="New York" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input id="zipCode" placeholder="10001" />
                    </div>
                  </div>

                  {isLoggedIn && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="saveAddressCheckbox"
                        defaultChecked
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="saveAddressCheckbox" className="text-sm font-medium cursor-pointer">
                        Save this address for later
                      </label>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Order Notes (Optional)</Label>
                    <Textarea id="notes" placeholder="Any special instructions for delivery..." rows={3} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Payment Method</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:border-primary">
                  <input type="radio" id="card" name="payment" value="card" defaultChecked className="h-4 w-4" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Credit / Debit Card</p>
                      <p className="text-xs text-muted-foreground">Pay with Visa, Mastercard, or American Express</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:border-primary">
                  <input type="radio" id="cod" name="payment" value="cod" className="h-4 w-4" />
                  <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Banknote className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay when you receive your order</p>
                    </div>
                  </Label>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" type="password" maxLength={3} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Order Summary</h2>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {CART_ITEMS.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-20 shrink-0 bg-muted rounded overflow-hidden">
                      <Image src={item.imageUrl || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.author}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
              </div>

              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <Ticket className="h-4 w-4" />
                <span>Select Discount Code</span>
              </Button>

              <Button className="w-full" size="lg">
                Place Order
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By placing your order, you agree to our terms and conditions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <DiscountModal subtotal={subtotal} />
      <AddressSelectorDrawer addresses={DEFAULT_ADDRESSES} />
    </div>
  )
}

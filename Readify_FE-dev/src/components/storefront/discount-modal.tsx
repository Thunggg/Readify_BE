"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Check, Tag, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface DiscountCode {
  id: number
  code: string
  title: string
  description: string
  discount: number
  minOrder: number
  expiryDate: string
  isPercent: boolean
}

interface DiscountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subtotal: number
}

export function DiscountModal({ open, onOpenChange, subtotal }: DiscountModalProps) {
  const discountCodes: DiscountCode[] = [
    {
      id: 1,
      code: "WELCOME10",
      title: "New Customer Discount",
      description: "10% off for new customers",
      discount: 10,
      minOrder: 0,
      expiryDate: "2024-12-31",
      isPercent: true,
    },
    {
      id: 2,
      code: "BOOK50K",
      title: "$50,000 Discount",
      description: "For orders over $200,000",
      discount: 50000,
      minOrder: 200000,
      expiryDate: "2024-12-31",
      isPercent: false,
    },
    {
      id: 3,
      code: "FREESHIP",
      title: "Free Shipping",
      description: "Free shipping on all orders",
      discount: 30000,
      minOrder: 0,
      expiryDate: "2024-12-31",
      isPercent: false,
    },
    {
      id: 4,
      code: "MEGA20",
      title: "20% Mega Discount",
      description: "For orders over $500,000",
      discount: 20,
      minOrder: 500000,
      expiryDate: "2024-12-31",
      isPercent: true,
    },
  ]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const isCodeAvailable = (code: DiscountCode) => {
    return subtotal >= code.minOrder
  }

  const handleApplyManualCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const manualCode = formData.get("code") as string
    if (manualCode.trim()) {
      // Store in local storage or pass to parent
      localStorage.setItem("selectedDiscount", manualCode.trim().toUpperCase())
      onOpenChange(false)
    }
  }

  const handleSelectCode = (code: string) => {
    localStorage.setItem("selectedDiscount", code)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Select Discount Code</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleApplyManualCode} className="space-y-2 mt-4">
          <label className="text-sm font-medium">Enter Code Manually</label>
          <div className="flex gap-2">
            <Input name="code" placeholder="Enter discount code..." className="flex-1 uppercase" required />
            <Button type="submit">Apply</Button>
          </div>
        </form>

        <div className="flex items-center gap-4 my-4">
          <Separator className="flex-1" />
          <span className="text-sm text-muted-foreground">or choose from available codes</span>
          <Separator className="flex-1" />
        </div>

        <div className="space-y-3">
          {discountCodes.map((code) => {
            const available = isCodeAvailable(code)

            return (
              <div
                key={code.id}
                className={cn(
                  "border rounded-lg p-4 cursor-pointer transition-all",
                  available ? "hover:border-primary" : "opacity-60 cursor-not-allowed",
                )}
                onClick={() => available && handleSelectCode(code.code)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center text-white shrink-0">
                    <Tag className="h-8 w-8" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-balance">{code.title}</h3>
                        <p className="text-sm text-muted-foreground">{code.description}</p>
                      </div>
                      <div className="w-6 h-6 flex items-center justify-center shrink-0">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="font-mono">
                        {code.code}
                      </Badge>
                      <span className="text-sm font-medium text-primary">
                        {code.isPercent ? `-${code.discount}%` : `-${formatPrice(code.discount)}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {code.minOrder > 0 && <span>Min. order: {formatPrice(code.minOrder)}</span>}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Valid until {code.expiryDate}</span>
                      </div>
                    </div>

                    {!available && (
                      <p className="text-xs text-red-500">
                        Add {formatPrice(code.minOrder - subtotal)} more to use this code
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <Separator className="my-4" />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

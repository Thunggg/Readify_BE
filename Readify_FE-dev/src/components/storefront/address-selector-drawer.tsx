"use client"

import { useState } from "react"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Plus, Check } from "lucide-react"

interface Address {
  id: number
  name: string
  phone: string
  address: string
  city: string
  zipCode: string
  isDefault: boolean
}

interface AddressSelectorDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedAddressId: number | null
  onSelectAddress: (addressId: number) => void
  onAddAddress: (address: Address) => void
  addresses: Address[]
  isLoggedIn?: boolean
}

export function AddressSelectorDrawer({
  open,
  onOpenChange,
  selectedAddressId,
  onSelectAddress,
  onAddAddress,
  addresses,
  isLoggedIn = true,
}: AddressSelectorDrawerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [saveAddress, setSaveAddress] = useState(true)

  const handleAddAddress = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newAddress: Address = {
      id: Date.now(),
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      zipCode: formData.get("zipCode") as string,
      isDefault: false,
    }
    onAddAddress(newAddress)
    setShowAddForm(false)
    onOpenChange(false)
  }

  const defaultAddress = addresses.find((a) => a.isDefault)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Delivery Address</SheetTitle>
          <SheetDescription>Select a delivery address or add a new one</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {!showAddForm ? (
            <>
              {/* Address List */}
              <div className="space-y-3">
                {addresses.map((address) => (
                  <Card
                    key={address.id}
                    className={`cursor-pointer transition-colors ${
                      selectedAddressId === address.id ? "border-primary" : ""
                    }`}
                    onClick={() => onSelectAddress(address.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          defaultChecked={address.isDefault}
                          className="mt-1 h-4 w-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{address.name}</p>
                            {address.isDefault && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{address.phone}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {address.address}, {address.city}, {address.zipCode}
                          </p>
                        </div>
                        {address.isDefault && <Check className="h-5 w-5 text-primary shrink-0" />}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4" />
                Add New Address
              </Button>

              {addresses.length > 0 && (
                <Button className="w-full" onClick={() => onOpenChange(false)}>
                  Confirm Address
                </Button>
              )}
            </>
          ) : (
            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="John Doe" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" placeholder="123 Main Street" rows={2} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" placeholder="New York" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input id="zipCode" name="zipCode" placeholder="10001" required />
                </div>
              </div>

              {isLoggedIn && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="saveAddress"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <label
                    htmlFor="saveAddress"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Save this address for later
                  </label>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Add Address
                </Button>
              </div>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

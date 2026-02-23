"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Package, MapPin, Lock } from "lucide-react"
import ProfilePersonalInfo from "./profile-personal-info"
import ProfileOrders from "./profile-orders"
import ProfileAddresses from "./profile-addresses"
import ProfilePassword from "./profile-password"

export function ProfileContent() {
  const [activeTab, setActiveTab] = useState("info")

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Tài khoản của tôi</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý thông tin cá nhân và đơn hàng của bạn
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="info" className="gap-2 cursor-pointer">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Thông tin</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2 cursor-pointer">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Đơn hàng</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="gap-2 cursor-pointer">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Địa chỉ</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="gap-2 cursor-pointer">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Mật khẩu</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <ProfilePersonalInfo />
          </TabsContent>

          <TabsContent value="orders">
            <ProfileOrders />
          </TabsContent>

          <TabsContent value="addresses">
            <ProfileAddresses />
          </TabsContent>

          <TabsContent value="password">
            <ProfilePassword />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

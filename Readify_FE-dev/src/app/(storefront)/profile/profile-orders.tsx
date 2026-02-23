"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function ProfileOrders() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Đơn hàng của tôi</CardTitle>
        <CardDescription>
          Xem và theo dõi tình trạng đơn hàng
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Order 1 */}
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Đơn hàng #DH001234</p>
                <p className="text-sm text-muted-foreground">
                  Ngày đặt: 15/01/2025
                </p>
              </div>
              <Badge className="bg-green-500">Đã giao</Badge>
            </div>
            <div className="flex gap-4">
              <div className="relative h-20 w-16 shrink-0 rounded overflow-hidden">
                <Image
                  src="/alchemist-book-cover.png"
                  alt="Nhà Giả Kim"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium">Nhà Giả Kim</p>
                <p className="text-sm text-muted-foreground">
                  Số lượng: 1
                </p>
                <p className="text-sm font-semibold mt-1">120.000đ</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="font-semibold">Tổng cộng: 120.000đ</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/book/1">Mua lại</Link>
                </Button>
                <Button variant="outline" size="sm">
                  Xem chi tiết
                </Button>
              </div>
            </div>
          </div>

          {/* Order 2 */}
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Đơn hàng #DH001235</p>
                <p className="text-sm text-muted-foreground">
                  Ngày đặt: 20/01/2025
                </p>
              </div>
              <Badge className="bg-blue-500">Đang giao</Badge>
            </div>
            <div className="flex gap-4">
              <div className="relative h-20 w-16 shrink-0 rounded overflow-hidden">
                <Image
                  src="/atomic-habits-book.png"
                  alt="Atomic Habits"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium">Atomic Habits</p>
                <p className="text-sm text-muted-foreground">
                  Số lượng: 2
                </p>
                <p className="text-sm font-semibold mt-1">320.000đ</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="font-semibold">Tổng cộng: 320.000đ</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Theo dõi
                </Button>
                <Button variant="outline" size="sm">
                  Xem chi tiết
                </Button>
              </div>
            </div>
          </div>

          {/* Order 3 */}
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Đơn hàng #DH001236</p>
                <p className="text-sm text-muted-foreground">
                  Ngày đặt: 25/01/2025
                </p>
              </div>
              <Badge className="bg-yellow-500">Đang xử lý</Badge>
            </div>
            <div className="flex gap-4">
              <div className="relative h-20 w-16 shrink-0 rounded overflow-hidden">
                <Image
                  src="/sapiens-book-cover.png"
                  alt="Sapiens"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  Sapiens: Lược Sử Loài Người
                </p>
                <p className="text-sm text-muted-foreground">
                  Số lượng: 1
                </p>
                <p className="text-sm font-semibold mt-1">189.000đ</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="font-semibold">Tổng cộng: 189.000đ</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 bg-transparent"
                >
                  Hủy đơn
                </Button>
                <Button variant="outline" size="sm">
                  Xem chi tiết
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



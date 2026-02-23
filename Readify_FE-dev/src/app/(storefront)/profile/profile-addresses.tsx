"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Plus } from "lucide-react";

export default function ProfileAddresses() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Địa chỉ giao hàng</CardTitle>
            <CardDescription>
              Quản lý địa chỉ nhận hàng của bạn
            </CardDescription>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm địa chỉ
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Address 1 - Default */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">Nhà riêng</p>
                  <Badge variant="secondary" className="text-xs">
                    Mặc định
                  </Badge>
                </div>
                <p className="text-sm font-medium">Nguyễn Văn A</p>
                <p className="text-sm text-muted-foreground">
                  0912345678
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
            >
              Đặt làm mặc định
            </Button>
          </div>

          {/* Address 2 */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-semibold">Văn phòng</p>
                <p className="text-sm font-medium">Nguyễn Văn A</p>
                <p className="text-sm text-muted-foreground">
                  0912345678
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              456 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
            >
              Đặt làm mặc định
            </Button>
          </div>

          {/* Address 3 */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-semibold">Nhà bố mẹ</p>
                <p className="text-sm font-medium">Nguyễn Thị B</p>
                <p className="text-sm text-muted-foreground">
                  0987654321
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              789 Đường Pasteur, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
            >
              Đặt làm mặc định
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



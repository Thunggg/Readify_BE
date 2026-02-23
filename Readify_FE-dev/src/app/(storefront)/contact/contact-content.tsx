"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, Clock } from "lucide-react"
import { useState } from "react"

export function ContactContent() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Contact form submitted:", formData)
    // Handle form submission
    alert("Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.")
  }

  return (
    <div className="container py-12">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Liên hệ với chúng tôi</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy gửi câu hỏi hoặc phản hồi của bạn cho chúng tôi.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {/* Contact Info Cards */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Điện thoại</CardTitle>
                <CardDescription>Liên hệ qua điện thoại</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-medium">1900 1234</p>
            <p className="text-sm text-muted-foreground">Thứ 2 - Thứ 7: 8:00 - 20:00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Email</CardTitle>
                <CardDescription>Gửi email cho chúng tôi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-medium">support@bookstore.vn</p>
            <p className="text-sm text-muted-foreground">Phản hồi trong 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Địa chỉ</CardTitle>
                <CardDescription>Ghé thăm cửa hàng</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-medium">123 Nguyễn Huệ</p>
            <p className="text-sm text-muted-foreground">Quận 1, TP. Hồ Chí Minh</p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Form */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Gửi tin nhắn</CardTitle>
            <CardDescription>Điền thông tin vào form bên dưới và chúng tôi sẽ liên hệ lại với bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Họ và tên *
                  </label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Số điện thoại
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0901234567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email *
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Chủ đề *
                </label>
                <Input
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Vấn đề cần hỗ trợ"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Nội dung *
                </label>
                <Textarea
                  id="message"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Mô tả chi tiết vấn đề của bạn..."
                  rows={6}
                />
              </div>

              <Button type="submit" className="w-full">
                Gửi tin nhắn
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle>Giờ làm việc</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thứ 2 - Thứ 6:</span>
                <span className="font-medium">8:00 - 20:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thứ 7 - Chủ nhật:</span>
                <span className="font-medium">9:00 - 18:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày lễ:</span>
                <span className="font-medium">9:00 - 17:00</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Câu hỏi thường gặp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Làm thế nào để theo dõi đơn hàng?</h4>
                <p className="text-sm text-muted-foreground">
                  Bạn có thể theo dõi đơn hàng trong mục &quot;Đơn hàng của tôi&quot; sau khi đăng nhập.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Chính sách đổi trả như thế nào?</h4>
                <p className="text-sm text-muted-foreground">
                  Chúng tôi hỗ trợ đổi trả trong vòng 7 ngày nếu sách còn nguyên vẹn.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Có giao hàng toàn quốc không?</h4>
                <p className="text-sm text-muted-foreground">Có, chúng tôi giao hàng toàn quốc với phí ship hợp lý.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

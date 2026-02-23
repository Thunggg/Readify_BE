import type { Metadata } from "next"
import { ProfileContent } from "./profile-content"

export const metadata: Metadata = {
  title: "Tài khoản của tôi - BookStore",
  description: "Quản lý thông tin tài khoản, đơn hàng và địa chỉ giao hàng",
}

export default function ProfilePage() {
  return <ProfileContent />
}

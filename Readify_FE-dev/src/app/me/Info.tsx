"use client";

import { useEffect, useState } from "react";
import { AccountApiRequest } from "@/api-request/account";

export default function MeInfo({ accessToken }: { accessToken: string }) {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Gọi API để kiểm tra token
        // Nếu token hết hạn, http.ts sẽ tự động redirect về /login
        const response = await AccountApiRequest.getMe();
        
        if (response?.status === 200 && response?.payload?.success) {
          setUserInfo(response.payload.data);
        }
      } catch (error: any) {
        // Nếu là 401, http.ts đã xử lý redirect rồi
        // Chỉ log các lỗi khác
        if (error?.status !== 401) {
          console.error("Failed to fetch user info:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div>
      <h1>Me Info</h1>
      <p>Access Token: {accessToken}</p>
      {userInfo && (
        <div>
          <p>Email: {userInfo.email}</p>
        </div>
      )}
    </div>
  );
}
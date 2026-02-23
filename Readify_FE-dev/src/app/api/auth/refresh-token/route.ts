"use server";

import { cookies } from "next/headers";
import envConfig from "@/configs/config-env";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      // Không có refresh token, xóa accessToken và trả về lỗi
      cookieStore.delete("accessToken");
      return Response.json(
        { message: "Refresh token not found", status: 401 },
        { status: 401 }
      );
    }

    // Gọi backend API để refresh token
    const response = await fetch(`${envConfig.NEXT_PUBLIC_API_ENDPOINT}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${refreshToken}`, // Gửi refreshToken từ cookie
      },
      credentials: "include",
    });

    if (!response.ok) {
      // Refresh token hết hạn, xóa cookies
      cookieStore.delete("accessToken");
      cookieStore.delete("refreshToken");
      return Response.json(
        { message: "Refresh token expired", status: 401 },
        { status: 401 }
      );
    }

    const data = await response.json();
    const newAccessToken = data?.payload?.data?.accessToken || data?.data?.accessToken;

    if (!newAccessToken) {
      return Response.json(
        { message: "Failed to get new access token", status: 500 },
        { status: 500 }
      );
    }

    // Set accessToken cookie
    cookieStore.set({
      name: "accessToken",
      value: newAccessToken,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 15, // 15 minutes
    });

    // Nếu backend trả về refreshToken mới, cập nhật luôn
    const newRefreshToken = data?.payload?.data?.refreshToken || data?.data?.refreshToken;
    if (newRefreshToken) {
      cookieStore.set({
        name: "refreshToken",
        value: newRefreshToken,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    const payload = {
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      success: true,
    };

    return Response.json(
      payload
    );
  } catch (error) {
    const cookieStore = await cookies();
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");
    return Response.json(
      { message: "Failed to refresh token", error: String(error), status: 500 },
      { status: 500 }
    );
  }
}
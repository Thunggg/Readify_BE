"use server";

import { authApiRequest } from "@/api-request/auth";
import { HttpError } from "@/lib/http";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();

    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
      return Response.json(
        {
          message: "Logout failed",
          error: "Access token not found",
          status: 401,
        },
        { status: 401 }
      );
    }

    cookieStore.delete("accessToken");

    const result = await authApiRequest.logoutFromNextServerToServer(
      accessToken
    );

    return Response.json(
      {
        message: result?.payload?.data?.message,
        status: result?.payload?.data?.status,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.json(
        { message: error.payload.message, status: error.payload.status },
        { status: error.payload.status }
      );
    } else {
      return Response.json(
        { message: "Logout failed", error: "Failed to logout", status: 500 },
        { status: 500 }
      );
    }
  }
}

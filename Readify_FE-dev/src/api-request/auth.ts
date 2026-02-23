import http from "@/lib/http";
import type { ApiResponse } from "@/types/api";

export type RegisterAccountPayload = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  sex: number;
  email: string;
  password: string;
  confirmPassword: string;
};

export type VerifyRegisterPayload = {
  otp: string;
};

export type ForgotPasswordRequestPayload = {
  email: string;
};

export type VerifyForgotPasswordOtpPayload = {
  otp: string;
};

export type ResetPasswordPayload = {
  newPassword: string;
  confirmPassword: string;
};

export type VerifyForgotPasswordOtpResponseData = {
  resetPasswordToken?: string;
};

export type VerifiedAccount = {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  dateOfBirth: string | Date;
  email: string;
  status: number;
  role: number;
  sex: number;
};

export const authApiRequest = {
  login: async (email: string, password: string) => {
    const response = await http.post<ApiResponse<{ accessToken: string }>>(
      "/auth/login",
      { email, password },
      { credentials: "include" }
    );
    return response;
  },

  register: async (payload: RegisterAccountPayload) => {
    // Backend: returns ApiResponse.success(null, 'OTP sent...', 200)
    const response = await http.post<ApiResponse<null>>(
      "/accounts/register",
      payload,
      { credentials: "include" }
    );
    return response;
  },

  resendRegisterOtp: async () => {
    // New flow: backend reads otpEmail + otpPurpose from cookie
    const response = await http.post<ApiResponse<null>>(
      "/accounts/otp/resend",
      {},
      { credentials: "include" }
    );
    return response;
  },

  verifyRegisterOtp: async (payload: VerifyRegisterPayload) => {
    const response = await http.post<ApiResponse<VerifiedAccount | null>>(
      "/accounts/otp/verify",
      payload,
      { credentials: "include" }
    );
    return response;
  },

  forgotPassword: async (payload: ForgotPasswordRequestPayload) => {
    const response = await http.post<ApiResponse<null>>(
      "/accounts/forgot-password",
      payload,
      { credentials: "include" }
    );
    return response;
  },

  verifyForgotPasswordOtp: async (payload: VerifyForgotPasswordOtpPayload) => {
    const response = await http.post<ApiResponse<null>>(
      "/accounts/otp/verify",
      payload,
      { credentials: "include" }
    );
    return response;
  },

  resendForgotPasswordOtp: async () => {
    const response = await http.post<ApiResponse<null>>(
      "/accounts/otp/resend",
      {},
      { credentials: "include" }
    );
    return response;
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    const response = await http.post<ApiResponse<VerifiedAccount>>(
      "/accounts/reset-password",
      payload,
      { credentials: "include" }
    );
    return response;
  },

  auth: async (accessToken: string) => {
    const response = await http.post<
      ApiResponse<{ message: string; accessToken: string }>
    >(
      "/api/auth",
      { accessToken: accessToken },
      {
        headers: { "Content-Type": "application/json" },
        baseUrl: "",
      }
    );
    return response;
  },

  logoutFromNextClientToServer: async () => {
    const response = await http.post<{
      data: { status: number; message: string };
    }>("/auth/logout", null, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    return response;
  },

  logoutFromNextServerToServer: async () => {
    const response = await http.post("/api/auth/logout", null, {
      baseUrl: "",
    });
    return response;
  },
};

import http from "@/lib/http";
import type { ApiPaginatedResponse, ApiResponse } from "@/types/api";
import type { AdminAccount } from "@/types/account";
import type {
  CreateAccountApiRequest,
  UpdateAccountApiRequest,
} from "@/validation/api-schemas";
import {
  EditProfileFormInput,
  ResetPasswordFormInput,
} from "@/validation/form-schemas";

export const AccountApiRequest = {
  getMe: async (accessToken?: string) => {
    const response = await http.get<ApiResponse<{ email: string }>>(
      "/accounts/me",
      {
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Cookie: `accessToken=${accessToken}` } : {}),
        },
        credentials: "include",
      }
    );
    return response;
  },

  getAccountsList: async (params?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: number[];
    sex?: number[];
    sortBy?: string;
    order?: "asc" | "desc";
  }) => {
    const response = await http.get<ApiPaginatedResponse<AdminAccount>>(
      "/accounts",
      {
        params,
        credentials: "include",
        cache: "no-store",
      }
    );
    return response;
  },

  createAccount: async (data: CreateAccountApiRequest) => {
    const response = await http.post<ApiResponse<AdminAccount>>(
      "/accounts/create",
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    return response;
  },

  updateAccount: async (id: string, data: UpdateAccountApiRequest) => {
    const response = await http.put<ApiResponse<AdminAccount>>(
      `/accounts/edit/${id}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    return response;
  },

  deleteAccount: async (id: string) => {
    const response = await http.delete<ApiResponse<AdminAccount>>(
      `/accounts/delete/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    return response;
  },

  editProfile: async (data: EditProfileFormInput) => {
    const response = await http.patch<ApiResponse<EditProfileFormInput>>(
      "/accounts/me",
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    return response;
  },

  resetPassword: async (data: ResetPasswordFormInput) => {
    const response = await http.patch<ApiResponse<ResetPasswordFormInput>>(
      "/accounts/me/change-password",
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    return response;
  },

  refreshToken: async () => {
    const response = await http.post<ApiResponse<{ accessToken: string }>>("/api/auth/refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    return response;
  }

};

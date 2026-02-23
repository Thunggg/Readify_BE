import http from "@/lib/http";
import type { ApiPaginatedResponse, ApiResponse } from "@/types/api";
import type { AdminAccount } from "@/types/account";
import type {
  CreateStaffApiRequest,
  UpdateStaffApiRequest,
} from "@/validation/staff-api-schemas";

export const StaffApiRequest = {
  getStaffList: async (params?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: number[];
    sex?: number[];
    role?: number[];
    sortBy?: string;
    order?: "asc" | "desc";
    isDeleted?: boolean;
  }) => {
    const response = await http.get<ApiPaginatedResponse<AdminAccount>>(
      "/staff",
      {
        params,
        credentials: "include",
        cache: "no-store",
      }
    );
    return response;
  },

  createStaff: async (data: CreateStaffApiRequest) => {
    const response = await http.post<ApiResponse<AdminAccount>>(
      "/staff",
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

  updateStaff: async (id: string, data: UpdateStaffApiRequest) => {
    const response = await http.patch<ApiResponse<AdminAccount>>(
      `/staff/${id}`,
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

  deleteStaff: async (id: string) => {
    const response = await http.delete<ApiResponse<{ _id: string }>>(
      `/staff/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    return response;
  },
};

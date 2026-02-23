import http from "@/lib/http";
import { ApiPaginatedResponse, ApiResponse } from "@/types/api";

export type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  status: number;
  bookCount?: number;
};

export type ListCategoriesParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: number | '';
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
};

export type CreateCategoryBody = {
  name: string;
  description?: string;
  iconUrl?: string;
  parentId?: string;
  status?: number;
};

export type UpdateCategoryBody = Partial<CreateCategoryBody>;

export const CategoryApiRequest = {
  getCategories(params?: ListCategoriesParams, accessToken?: string) {
    return http.get<ApiPaginatedResponse<Category>>("/categories", {
      params,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Cookie: `accessToken=${accessToken}` } : {}),
      },
    });
  },

  getCategoryById(id: string, accessToken?: string) {
    return http.get<ApiResponse<Category>>(`/categories/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Cookie: `accessToken=${accessToken}` } : {}),
      },
    });
  },

  createCategory(body: CreateCategoryBody, accessToken?: string) {
    return http.post<ApiResponse<Category>>("/categories", body, {
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Cookie: `accessToken=${accessToken}` } : {}),
      },
    });
  },

  updateCategory(id: string, body: UpdateCategoryBody, accessToken?: string) {
    return http.patch<ApiResponse<Category>>(`/categories/${id}`, body, {
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Cookie: `accessToken=${accessToken}` } : {}),
      },
    });
  },

  deleteCategory(id: string, accessToken?: string) {
    return http.delete<ApiResponse<any>>(`/categories/${id}`, undefined, {
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Cookie: `accessToken=${accessToken}` } : {}),
      },
    });
  },
};

import { AccountApiRequest } from "@/api-request/account";
import { authApiRequest } from "@/api-request/auth";
import envConfig from "@/configs/config-env";
import { handleErrorApi } from "./utils";

type CustomOptions = RequestInit & {
  baseUrl?: string | undefined;
  params?: Record<string, any>;
};

const ENTITY_ERROR_STATUS = 422;

interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

type EntityErrorPayload = {
  message: string;
  errorCode: string;
  statusCode: number;
  details?: ErrorDetail[];
};

export class HttpError extends Error {
  status: number;
  payload: {
    message: string;
    [key: string]: any;
  };
  message: string;
  constructor(status: number, message: string, payload: any) {
    super(message);
    this.status = status;
    this.message = message;
    this.payload = payload;
  }
}

export class EntityError extends HttpError {
  status: number = ENTITY_ERROR_STATUS;
  payload: EntityErrorPayload;
  constructor({
    status,
    payload,
  }: {
    status: number;
    payload: EntityErrorPayload;
  }) {
    super(status, "Entity error", payload);
    this.payload = payload;
    this.status = status;
  }
}

let refreshTokenPromise: Promise<any> | null = null;


const request = async <Response>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  options: CustomOptions | undefined
) => {
  const body =
    options?.body instanceof FormData
      ? options.body
      : options?.body
        ? JSON.stringify(options.body)
        : undefined;
  const baseHeaders =
    options?.body instanceof FormData
      ? {}
      : {
        "Content-Type": "application/json",
      };

  // nếu baseUrl không được cung cấp thì sử dụng NEXT_PUBLIC_API_ENDPOINT từ env
  // nếu baseUrl được cung cấp thì sử dụng baseUrl
  // nếu baseUrl là rỗng thì gọi đến next server
  const baseUrl =
    options?.baseUrl === undefined
      ? envConfig.NEXT_PUBLIC_API_ENDPOINT
      : options.baseUrl;

  let fullUrl = url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`;

  // Xử lý params thành query string
  if (options?.params) {
    const queryParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Xử lý array: gửi dưới dạng nhiều query params (status=1&status=2)
        // Backend có thể nhận cả dạng này và comma-separated
        if (Array.isArray(value)) {
          value.forEach((item) => {
            queryParams.append(key, String(item));
          });
        } else {
          queryParams.append(key, String(value));
        }
      }
    });
    const queryString = queryParams.toString();
    if (queryString) {
      fullUrl += `?${queryString}`;
    }
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      ...baseHeaders,
      ...(options?.headers as Record<string, string>),
    } as HeadersInit,
    body,
    method,
    credentials: "include", // Include cookies for authentication
  });

  const payload: Response = await response.json();
  const data = {
    status: response.status,
    payload,
  };

  if (!response.ok) {
    // lỗi liên quan đến dữ liệu
    if (response.status === ENTITY_ERROR_STATUS) {
      throw new EntityError(
        data as {
          status: number;
          payload: EntityErrorPayload;
        }
      );
      // Nếu token hết hạn
    } else if (response.status === 401) {
      // nếu là client thì logout từ client

      try {
        if (!refreshTokenPromise) {
          refreshTokenPromise = fetch("/api/auth/refresh-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }).then(async (res) => {
            const payload = await res.json().catch(() => null);
            return { status: res.status, payload };
          }).finally(() => {
            refreshTokenPromise = null;
          });
        }

        // kiểm tra xem refresh token có hết hạn không
        const responseRefreshToken = await refreshTokenPromise;

        // nếu là ở client
        if (typeof window !== "undefined") {
          // nếu thành công thì set access token mới và gọi lại request ban đầu
          if (responseRefreshToken && responseRefreshToken.payload.success) {
            // set access token mới rồi thì gọi lại request trước
            return request<Response>(method, url, options);
          } else {
            // tự động trở về trang login
            location.href = "/login";
            return;
          }
        } else {
          // nếu là server thì logout từ server
          if (responseRefreshToken && responseRefreshToken.payload.success) {
            // set access token mới
            await authApiRequest.auth(responseRefreshToken.payload.data.accessToken);

            // gọi lại request cũ
            return request<Response>(method, url, options);

          } else {
            // chưa biết phải làm gì :))
          }
        }
      } catch (error) {
        // lỗi không xác định
        throw new HttpError(500, "An unexpected error occurred", { message: "An unexpected error occurred" });
      }


    } else {
      // lỗi server
      throw new HttpError(response.status, response.statusText, payload);
    }
  }

  return data;
};

const http = {
  get: <Response>(
    url: string,
    options?: Omit<CustomOptions, "body"> | undefined
  ) => request<Response>("GET", url, options),

  post: <Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, "body"> | undefined
  ) => request<Response>("POST", url, { ...options, body }),

  put: <Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, "body"> | undefined
  ) => request<Response>("PUT", url, { ...options, body }),

  patch: <Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, "body"> | undefined
  ) => request<Response>("PATCH", url, { ...options, body }),

  delete: <Response>(
    url: string,
    body?: any,
    options?: Omit<CustomOptions, "body"> | undefined
  ) => request<Response>("DELETE", url, { ...options, body }),

  patch: <Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, "body"> | undefined
  ) => request<Response>("PATCH", url, { ...options, body }),
};

export default http;

"use client";

import { StaffApiRequest } from "@/api-request/staff";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { handleErrorApi } from "@/lib/utils";
import { AdminAccount } from "@/types/account";
import dayjs from "dayjs";
import {
  BanIcon,
  CheckCircleIcon,
  CircleHelpIcon,
  CircleMinusIcon,
  MailIcon,
  MarsIcon,
  MoreHorizontalIcon,
  VenusIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import AccountsToolbar, { FilterState } from "./components/accounts-toolbar";
import CreateAccountModal from "./components/create-account-modal";
import DeleteAccountModal from "./components/delete-account-modal";
import DetailAccountDrawer from "./components/detail-account-drawer";
import { convertStatus } from "./components/status-filter-dropdown";
import { convertRole } from "./components/role-filter-dropdown";
import type { StatusKey } from "./components/status-filter-dropdown";
import type { RoleKey } from "./components/role-filter-dropdown";
import SortableHeader from "./components/sort-header";
import UpdateAccountModal from "./components/update-account-modal";
// import {
//   Pagination,
//   PaginationContent,
//   PaginationEllipsis,
//   PaginationItem,
//   PaginationLink,
//   PaginationNext,
//   PaginationPrevious,
// } from "@/components/ui/pagination";
import PaginationControls from "./components/pagination-controls";

export type SortField =
  | "email"
  | "fullName"
  | "phone"
  | "dateOfBirth"
  | "sex"
  | "status"
  | null;
export type SortOrder = "asc" | "desc" | null;

export default function AccountsTable() {
  const [createOpen, setCreateOpen] = useState(false); // Đóng mở modal tạo tài khoản
  const [showUpdateDialog, setShowUpdateDialog] = useState(false); // Đóng mở modal cập nhật tài khoản
  const [showDeleteDialog, setShowDeleteDialog] = useState(false); // Đóng mở popup xóa tài khoản
  const [showDetailAccount, setShowDetailAccount] = useState(false); // Đóng mở drawer chi tiết tài khoản
  const [localAccounts, setLocalAccounts] = useState<AdminAccount[]>([]); // Danh sách tài khoản trong local
  const [selectedAccount, setSelectedAccount] = useState<AdminAccount | null>(
    null
  ); // Tài khoản được chọn để cập nhật hoặc xem chi tiết

  const [sortField, setSortField] = useState<SortField>(null); // Lấy trường cần sort
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc"); // asc hoặc desc
  const [searchValue, setSearchValue] = useState(""); // Giá trị tìm kiếm
  const [filters, setLocalsFilters] = useState<FilterState>({
    status: [],
    role: [],
  }); // Giá trị filter

  const [page, setPage] = useState(1); // Trang hiện tại
  const [limit, setLimit] = useState(10); // Số lượng tài khoản trên mỗi trang
  const [total, setTotal] = useState(0); // Tổng số lượng tài khoản

  const sexLabel = (sex: number) => {
    if (sex === 1) {
      return (
        <Badge
          className="
          border-none
          bg-blue-600/10 text-blue-600
          dark:bg-blue-400/10 dark:text-blue-400
        "
        >
          <MarsIcon className="size-3" />
          Male
        </Badge>
      );
    }

    if (sex === 2) {
      return (
        <Badge
          className="
          border-none
          bg-rose-600/10 text-rose-600
          dark:bg-rose-400/10 dark:text-rose-400
        "
        >
          <VenusIcon className="size-3" />
          Female
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-muted-foreground">
        <CircleHelpIcon className="size-3" />
        Unknown
      </Badge>
    );
  };

  const statusLabel = (status: number) => {
    if (status === 1) {
      return (
        <>
          <Badge className="border-none bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5">
            <CheckCircleIcon className="size-3" />
            Active
          </Badge>
        </>
      );
    }
    if (status === 0) {
      return (
        <>
          <Badge className="border-none bg-red-600/10 text-red-600 focus-visible:ring-red-600/20 focus-visible:outline-none dark:bg-red-400/10 dark:text-red-400 dark:focus-visible:ring-red-400/40 [a&]:hover:bg-red-600/5 dark:[a&]:hover:bg-red-400/5">
            <CircleMinusIcon className="size-3" />
            Inactive
          </Badge>
        </>
      );
    }
    if (status === -1) {
      return (
        <>
          <Badge variant="destructive">
            <BanIcon className="size-3" />
            Banned
          </Badge>
        </>
      );
    }
    if (status === 2) {
      return (
        <>
          <Badge className="border-none bg-amber-600/10 text-amber-600 focus-visible:ring-amber-600/20 focus-visible:outline-none dark:bg-amber-400/10 dark:text-amber-400 dark:focus-visible:ring-amber-400/40 [a&]:hover:bg-amber-600/5 dark:[a&]:hover:bg-amber-400/5">
            <MailIcon className="size-3" />
            Email not verified
          </Badge>
        </>
      );
    }
    return "Unknown";
  };

  const onSortChange = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
  };

  // useEffect để fetch danh sách tài khoản khi các tham số thay đổi
  // Dependency array bao gồm các state ảnh hưởng đến việc fetch: sortField, sortOrder, searchValue, filters, page, limit
  useEffect(() => {
    // Hàm async để fetch dữ liệu tài khoản từ API
    const fetchAccounts = async () => {
      // Chuyển đổi các key trạng thái thành giá trị số tương ứng
      // Nếu filters.status có phần tử, map từng key thành giá trị qua convertStatus
      // Nếu không có filter, để undefined
      const statusValues =
        filters.status.length > 0
          ? filters.status.map((key) => convertStatus(key as StatusKey))
          : undefined;

      // Tương tự cho role: chuyển đổi key thành giá trị qua convertRole
      const roleValues =
        filters.role.length > 0
          ? filters.role.map((key) => convertRole(key as RoleKey))
          : undefined;

      try {
        // Gọi API để lấy danh sách staff với các tham số:
        // q: từ khóa tìm kiếm (hoặc undefined nếu không có)
        // limit: số lượng item mỗi trang
        // page: trang hiện tại
        // status: mảng giá trị trạng thái (hoặc undefined)
        // role: mảng giá trị vai trò (hoặc undefined)
        // sortBy: trường sắp xếp (ép kiểu string)
        // order: thứ tự sắp xếp (asc hoặc desc)
        const response = await StaffApiRequest.getStaffList({
          q: searchValue || undefined,
          limit: limit,
          page: page,
          status: statusValues,
          role: roleValues,
          sortBy: sortField as string,
          order: sortOrder as "asc" | "desc",
        });

        // Kiểm tra response: nếu không có status hoặc payload không success
        if (!response?.status || !response.payload.success) {
          // Xử lý lỗi API: hiển thị thông báo lỗi trong 5 giây
          handleErrorApi({
            error: response?.payload.message,
            setError: () => {}, // Không set error state cụ thể
            duration: 5000,
          });
          return; // Dừng thực hiện
        }

        // Nếu thành công, cập nhật state local với danh sách tài khoản
        setLocalAccounts(response.payload.data.items);
        // Cập nhật tổng số tài khoản từ meta data
        setTotal(response.payload.data.meta?.total || 0);
      } catch (error) {
        // Xử lý lỗi ngoại lệ (network, etc.): hiển thị thông báo lỗi trong 5 giây
        handleErrorApi({ error, setError: () => {}, duration: 5000 });
      }
    };
    // Gọi hàm fetchAccounts ngay lập tức
    fetchAccounts();
  }, [sortField, sortOrder, searchValue, filters, page, limit]);

  return (
    <>
      <CreateAccountModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreateAccount={(data) => {
          {
            setLocalAccounts([...localAccounts, data]);
          }
        }}
      />
      <UpdateAccountModal
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
        selectedAccount={selectedAccount}
        onUpdateAccount={(data) => {
          setLocalAccounts(
            localAccounts.map((account) =>
              account._id === data._id ? data : account
            )
          );
        }}
      />
      <DetailAccountDrawer
        open={showDetailAccount}
        onOpenChange={setShowDetailAccount}
        selectedAccount={selectedAccount}
      />
      <DeleteAccountModal
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        selectedAccount={selectedAccount}
        onDeleteAccount={() => {
          setLocalAccounts(
            localAccounts.filter(
              (account) => account._id !== selectedAccount?._id
            )
          );
        }}
      />
      <AccountsToolbar
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        filters={filters}
        setLocalsFilters={setLocalsFilters}
        onCreateClick={() => setCreateOpen(true)}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Avatar</TableHead>
            <TableHead>
              <SortableHeader
                title="Email"
                field="email"
                onSortChange={onSortChange}
                currentField={sortField}
                currentOrder={sortOrder}
              />
            </TableHead>
            <TableHead>
              <SortableHeader
                title="Full name"
                field="fullName"
                onSortChange={onSortChange}
                currentField={sortField}
                currentOrder={sortOrder}
              />
            </TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>
              <SortableHeader
                title="Date of Birth"
                field="dateOfBirth"
                onSortChange={onSortChange}
                currentField={sortField}
                currentOrder={sortOrder}
              />
            </TableHead>
            <TableHead>Sex</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localAccounts.map((account) => (
            <TableRow key={account._id}>
              <TableCell>
                <Avatar>
                  <AvatarImage
                    alt={account.firstName}
                    src={account.avatarUrl}
                  />
                  <AvatarFallback>
                    {account.firstName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell
                className="cursor-pointer"
                onClick={() => {
                  setShowDetailAccount(true);
                  setSelectedAccount(account);
                }}
              >
                {account.email}
              </TableCell>
              <TableCell>{`${account.firstName} ${account.lastName}`}</TableCell>
              <TableCell>{account.phone}</TableCell>
              <TableCell>
                {account.dateOfBirth
                  ? dayjs(account.dateOfBirth).format("DD/MM/YYYY")
                  : "-"}
              </TableCell>
              <TableCell>{sexLabel(Number(account.sex))}</TableCell>
              <TableCell>{statusLabel(Number(account.status))}</TableCell>
              <TableCell>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      aria-label="Open menu"
                      size="icon-sm"
                    >
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40" align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onSelect={() => {
                          setShowUpdateDialog(true);
                          setSelectedAccount(account);
                        }}
                      >
                        Edit Account
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setShowDeleteDialog(true);
                          setSelectedAccount(account);
                        }}
                      >
                        Delete Account
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {total > limit && (
        <PaginationControls
          currentPage={page}
          totalPages={Math.ceil(total / limit)}
          onPageChange={setPage}
        />
      )}
    </>
  );
}

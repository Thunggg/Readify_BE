"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Plus,
  Search,
  Truck,
  Phone,
  Edit,
  Eye,
  RotateCcw,
  Trash2,
  MoreHorizontal,
  TriangleAlert,
} from "lucide-react";

type Supplier = {
  _id?: string;
  name?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  bookIds?: string[];
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ApiResponse = {
  success: boolean;
  data: {
    items: Supplier[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
};

export default function SupplierListView() {
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"active" | "deleted">("active");
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (viewMode === "deleted") {
          params.append("isDeleted", "true");
        }
        const url = `http://localhost:3000/suppliers?${params.toString()}`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json: ApiResponse = await res.json();
        const supplierData = json.data?.items || [];
        setSuppliers(supplierData);
        setFilteredSuppliers(supplierData);
        setCurrentPage(1); // Reset to first page when changing view mode
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fetch error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [viewMode]);

  useEffect(() => {
    if (!suppliers) return;

    if (!searchQuery.trim()) {
      setFilteredSuppliers(suppliers);
      setCurrentPage(1); // Reset to first page when clearing search
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = suppliers.filter(
      (supplier) =>
        supplier.name?.toLowerCase().includes(query) ||
        supplier.email?.toLowerCase().includes(query) ||
        supplier.phone?.includes(query) ||
        supplier.contactName?.toLowerCase().includes(query)
    );
    setFilteredSuppliers(filtered);
    setCurrentPage(1); // Reset to first page when searching
  }, [searchQuery, suppliers]);

  const handleRestore = async (id: string) => {
    if (!confirm("Are you sure you want to restore this supplier?")) return;

    try {
      setRestoring(id);
      const res = await fetch(`http://localhost:3000/suppliers/${id}/restore`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Restore failed: ${res.status}`);

      // Refresh list
      setSuppliers((prev) => prev?.filter((s) => s._id !== id) || null);
      setFilteredSuppliers((prev) => prev?.filter((s) => s._id !== id) || null);
    } catch (e: unknown) {
      alert(
        `Restore error: ${e instanceof Error ? e.message : "Unknown restore error"}`
      );
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;

    try {
      setDeleting(id);
      const res = await fetch(`http://localhost:3000/suppliers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);

        // Check if it's a validation error about existing books
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const bookError = errorData.errors.find(
            (err: any) => err.field === "bookIds" && err.message
          );
          if (bookError) {
            alert(
              `Cannot delete supplier: ${bookError.message}\n\nPlease remove or reassign all books associated with this supplier first.`
            );
            return;
          }
        }

        throw new Error(errorData?.message || `Delete failed: ${res.status}`);
      }

      // Refresh list
      setSuppliers((prev) => prev?.filter((s) => s._id !== id) || null);
      setFilteredSuppliers((prev) => prev?.filter((s) => s._id !== id) || null);
    } catch (e: unknown) {
      alert(`Delete error: ${e instanceof Error ? e.message : "Unknown delete error"}`);
    } finally {
      setDeleting(null);
    }
  };

  if (loading)
    return (
      <div className="py-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="py-6">
        <Alert className="bg-destructive/10 text-destructive border-none">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Load failed</AlertTitle>
          <AlertDescription className="text-destructive/80">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );

  if (!filteredSuppliers || filteredSuppliers.length === 0)
    return (
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
            <p className="text-muted-foreground">Manage supplier information</p>
          </div>
          <Button asChild>
            <Link href="/admin/supplier/create">
              <Plus className="mr-2 h-4 w-4" />
              Add supplier
            </Link>
          </Button>
        </div>
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "active" | "deleted")}
        >
          <TabsList>
            <TabsTrigger value="active">
              <Truck className="mr-2 h-4 w-4" />
              Active
            </TabsTrigger>
            <TabsTrigger value="deleted">
              <Trash2 className="mr-2 h-4 w-4" />
              Deleted
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Alert>
          <Truck className="h-4 w-4" />
          <AlertTitle>No suppliers</AlertTitle>
          <AlertDescription>
            {searchQuery
              ? "No suppliers match your search."
              : "No suppliers found in the system."}
          </AlertDescription>
        </Alert>
      </div>
    );

  // Pagination logic
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredSuppliers.slice(startIndex, endIndex);

  const renderPaginationItems = () => {
    const pages = [];
    const maxVisiblePages = 5;

    const startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (startPage > 1) {
      pages.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        pages.push(<PaginationEllipsis key="ellipsis-start" />);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => setCurrentPage(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<PaginationEllipsis key="ellipsis-end" />);
      }
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => setCurrentPage(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return pages;
  };

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
          <p className="text-muted-foreground">Manage supplier information</p>
        </div>
        {viewMode === "active" && (
          <Button asChild>
            <Link href="/admin/supplier/create">
              <Plus className="mr-2 h-4 w-4" />
              Add supplier
            </Link>
          </Button>
        )}
      </div>

      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as "active" | "deleted")}
      >
        <TabsList>
          <TabsTrigger value="active">
            <Truck className="mr-2 h-4 w-4" />
            Active
          </TabsTrigger>
          <TabsTrigger value="deleted">
            <Trash2 className="mr-2 h-4 w-4" />
            Deleted
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Suppliers</CardTitle>
            <Badge variant="secondary">
              {filteredSuppliers.length} supplier
              {filteredSuppliers.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((supplier) => {
                const initials = (supplier.name ?? "U")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <TableRow key={supplier._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {supplier.name ?? "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {supplier.email ?? "-"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {supplier.phone ?? "-"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {supplier.contactName ?? "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          viewMode === "active" ? "default" : "secondary"
                        }
                      >
                        {viewMode === "active" ? "Active" : "Deleted"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {viewMode === "active" ? (
                            <>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/supplier/${supplier._id}`}
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/supplier/edit/${supplier._id}`}
                                  className="flex items-center gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              {/* <DropdownMenuItem asChild>
                                <Link
                                  href={`mailto:${supplier.email}`}
                                  className="flex items-center gap-2"
                                >
                                  <Mail className="h-4 w-4" />
                                  Send Email
                                </Link>
                              </DropdownMenuItem> */}
                              <DropdownMenuItem
                                onClick={() => handleDelete(supplier._id!)}
                                disabled={deleting === supplier._id}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {deleting === supplier._id
                                  ? "Deleting..."
                                  : "Delete"}
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleRestore(supplier._id!)}
                              disabled={restoring === supplier._id}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              {restoring === supplier._id
                                ? "Restoring..."
                                : "Restore"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
            {renderPaginationItems()}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

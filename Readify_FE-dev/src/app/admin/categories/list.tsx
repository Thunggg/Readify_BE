"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    BookCopy,
    Edit,
    Trash2,
    MoreHorizontal,
    TriangleAlert,
    Eye,
    FilterX,
    ArrowUpDown,
    ChevronDown,
} from "lucide-react";
import { CategoryApiRequest, type Category } from "@/api-request/category";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export default function CategoryListView() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Search & Filter states
    const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
    const [statusFilter, setStatusFilter] = useState<number | ''>(searchParams.get("status") !== null ? Number(searchParams.get("status")) : '');
    const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>((searchParams.get("sortBy") as any) || 'createdAt');
    const [order, setOrder] = useState<'asc' | 'desc'>((searchParams.get("order") as any) || 'desc');

    // Data states
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination metadata from Backend response
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [deleting, setDeleting] = useState<string | null>(null);
    const itemsPerPage = 10;

    const hasActiveFilters = debouncedSearch !== '' || statusFilter !== '' || sortBy !== 'createdAt' || order !== 'desc';

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchCategories = async (page: number, query: string) => {
        try {
            setLoading(true);
            setError(null);

            const params: any = {
                page,
                limit: itemsPerPage,
                sortBy,
                order,
                ...(query ? { q: query } : {}),
                ...(statusFilter !== '' ? { status: statusFilter } : {}),
            };

            const res = await CategoryApiRequest.getCategories(params);

            if (res && res.payload && res.payload.success) {
                setCategories(res.payload.data.items);
                setTotalPages(res.payload.data.meta?.totalPages || 1);
                setTotalItems(res.payload.data.meta?.total || 0);
                setCurrentPage(res.payload.data.meta?.page || page);
            }
        } catch (err: any) {
            setError(err?.payload?.message || "Failed to load categories.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories(currentPage, debouncedSearch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, debouncedSearch, statusFilter, sortBy, order]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, statusFilter, sortBy, order]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setDebouncedSearch('');
        setStatusFilter('');
        setSortBy('createdAt');
        setOrder('desc');
        setCurrentPage(1);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

        try {
            setDeleting(id);

            const res = await CategoryApiRequest.deleteCategory(id);
            if (res?.payload?.success) {
                toast.success(`Category "${name}" deleted securely!`);
                // Decrease total items, etc. Or easier:
                fetchCategories(currentPage, debouncedSearch);
            } else {
                toast.error(res?.payload?.message || "Failed to delete category");
            }
        } catch (e: any) {
            toast.error(e?.payload?.message || "Error deleting category");
        } finally {
            setDeleting(null);
        }
    };

    if (loading && categories.length === 0)
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

    if (error && categories.length === 0)
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

    const renderPaginationItems = () => {
        const pages = [];
        const maxVisiblePages = 5;

        const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (startPage > 1) {
            pages.push(
                <PaginationItem key="1">
                    <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
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
                        onClick={() => handlePageChange(i)}
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
                    <PaginationLink onClick={() => handlePageChange(totalPages)}>
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
                    <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
                    <p className="text-muted-foreground">Manage book categories</p>
                </div>
                <Button asChild>
                    <Link href="/admin/categories/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add category
                    </Link>
                </Button>
            </div>

            {/* Search & Filter toolbar */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Status Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="min-w-[140px] justify-between">
                                    {statusFilter === '' ? 'All Status' : statusFilter === 1 ? 'Active' : 'Inactive'}
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setStatusFilter('')}>All Status</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter(1)}>Active</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter(0)}>Inactive</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Sort */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="min-w-[160px] justify-between">
                                    <ArrowUpDown className="mr-2 h-4 w-4 opacity-50" />
                                    {sortBy === 'name' ? 'Name' : sortBy === 'updatedAt' ? 'Last Updated' : 'Date Created'}
                                    {' · '}{order === 'asc' ? '↑ Asc' : '↓ Desc'}
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setSortBy('createdAt'); setOrder('desc'); }}>Date Created · Newest</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSortBy('createdAt'); setOrder('asc'); }}>Date Created · Oldest</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSortBy('updatedAt'); setOrder('desc'); }}>Last Updated · Newest</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSortBy('name'); setOrder('asc'); }}>Name · A→Z</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSortBy('name'); setOrder('desc'); }}>Name · Z→A</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <Button variant="ghost" onClick={handleClearFilters} className="text-muted-foreground">
                                <FilterX className="mr-2 h-4 w-4" />
                                Clear
                            </Button>
                        )}
                    </div>

                    {/* Active Filter Badges */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {debouncedSearch && (
                                <Badge variant="secondary" className="gap-1">
                                    Search: <span className="font-medium">{debouncedSearch}</span>
                                </Badge>
                            )}
                            {statusFilter !== '' && (
                                <Badge variant="secondary" className="gap-1">
                                    Status: <span className="font-medium">{statusFilter === 1 ? 'Active' : 'Inactive'}</span>
                                </Badge>
                            )}
                            {(sortBy !== 'createdAt' || order !== 'desc') && (
                                <Badge variant="secondary" className="gap-1">
                                    Sort: <span className="font-medium">
                                        {sortBy === 'name' ? 'Name' : sortBy === 'updatedAt' ? 'Last Updated' : 'Date Created'}
                                        {' '}{order === 'asc' ? '↑' : '↓'}
                                    </span>
                                </Badge>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Categories Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>All Categories</CardTitle>
                        <Badge variant="secondary">
                            {totalItems} categor{totalItems !== 1 ? "ies" : "y"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {categories.length === 0 ? (
                        <Alert>
                            <BookCopy className="h-4 w-4" />
                            <AlertTitle>No categories found</AlertTitle>
                            <AlertDescription>
                                {hasActiveFilters
                                    ? "No categories match your current filters. Try adjusting your search or filters."
                                    : "No categories found in the system."}
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Books</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((category) => {
                                    const initials = category.name
                                        ?.split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2) || "CG";

                                    return (
                                        <TableRow key={category._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={category.iconUrl} alt={category.name} />
                                                        <AvatarFallback>{initials}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium text-nowrap">
                                                            {category.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-sm bg-muted px-1 py-0.5 rounded text-primary">/{category.slug}</code>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[300px] truncate text-sm text-muted-foreground" title={category.description}>
                                                    {category.description || "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">
                                                    {category.bookCount ?? 0}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={category.status === 1 ? "default" : "secondary"}>
                                                    {category.status === 1 ? "Active" : "Inactive"}
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
                                                        <DropdownMenuItem asChild>
                                                            <Link
                                                                href={`/admin/categories/${category._id}`}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link
                                                                href={`/admin/categories/edit/${category._id}`}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(category._id, category.name)}
                                                            disabled={deleting === category._id}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            {deleting === category._id
                                                                ? "Deleting..."
                                                                : "Delete"}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
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

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { CategoryApiRequest, type Category } from "@/api-request/category";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ArrowLeft,
    Edit,
    Tag,
    AlignLeft,
    TriangleAlert,
    Info,
    Calendar,
    BookCopy,
} from "lucide-react";

export default function CategoryDetailView({ id }: { id: string }) {
    const router = useRouter();
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await CategoryApiRequest.getCategoryById(id);

                if (res && res.payload && res.payload.success) {
                    setCategory(res.payload.data);
                }
            } catch (err: any) {
                setError(err?.payload?.message || "Failed to load category details.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCategory();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="py-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !category) {
        return (
            <div className="py-6 space-y-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to list
                </Button>
                <Alert className="bg-destructive/10 text-destructive border-none">
                    <TriangleAlert className="h-4 w-4" />
                    <AlertTitle>Error Loading Category</AlertTitle>
                    <AlertDescription>
                        {error || "Category not found."}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const initials = category.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "CG";

    return (
        <div className="py-6 space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push("/admin/categories")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Category Details</h2>
                        <p className="text-muted-foreground">View detailed information</p>
                    </div>
                </div>
                <Button asChild>
                    <Link href={`/admin/categories/edit/${category._id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Category
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info Card */}
                <Card className="md:col-span-2">
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 border-2 border-muted">
                                    <AvatarImage src={category.iconUrl} alt={category.name} />
                                    <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-2xl">{category.name}</CardTitle>
                                    <CardDescription className="flex items-center mt-1">
                                        <code className="text-sm bg-muted px-1.5 py-0.5 rounded text-primary font-mono">
                                            /{category.slug}
                                        </code>
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge variant={category.status === 1 ? "default" : "secondary"} className="text-sm px-3 py-1">
                                {category.status === 1 ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-2">

                        {/* Description Section */}
                        <div>
                            <h3 className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                                <AlignLeft className="mr-2 h-4 w-4" />
                                Description
                            </h3>
                            <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                {category.description || (
                                    <span className="text-muted-foreground italic">No description provided.</span>
                                )}
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* Metadata Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                            <Info className="mr-2 h-5 w-5" />
                            System Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                                <Tag className="mr-2 h-4 w-4" />
                                Category ID
                            </h4>
                            <p className="text-sm font-mono bg-muted/50 p-2 rounded-md truncate" title={category._id}>
                                {category._id}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                                <BookCopy className="mr-2 h-4 w-4" />
                                Total Books
                            </h4>
                            <p className="text-sm pl-6 font-bold text-primary">
                                {category.bookCount ?? 0} books
                            </p>
                        </div>

                        {/* Display Dates if available in the type later/any object expansion */}
                        {(category as any).createdAt && (
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Created At
                                </h4>
                                <p className="text-sm pl-6">
                                    {format(new Date((category as any).createdAt), "PPP p")}
                                </p>
                            </div>
                        )}

                        {(category as any).updatedAt && (
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Last Updated
                                </h4>
                                <p className="text-sm pl-6">
                                    {format(new Date((category as any).updatedAt), "PPP p")}
                                </p>
                            </div>
                        )}

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

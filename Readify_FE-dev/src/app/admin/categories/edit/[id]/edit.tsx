"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CategoryApiRequest, Category } from "@/api-request/category";
import { CategoryForm, CategoryFormValues } from "../../components/CategoryForm";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function EditCategoryView({ id }: { id: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [category, setCategory] = useState<Category | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                setLoading(true);
                const res = await CategoryApiRequest.getCategoryById(id);
                if (res?.payload?.success) {
                    setCategory(res.payload.data);
                } else {
                    setError(res?.payload?.message || "Category not found");
                }
            } catch (err: any) {
                setError(err?.payload?.message || "Failed to load category");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchCategory();
    }, [id]);

    const onSubmit = async (data: CategoryFormValues) => {
        try {
            setSaving(true);
            const res = await CategoryApiRequest.updateCategory(id, data);
            if (res?.payload?.success) {
                toast.success("Category updated successfully");
                router.push("/admin/categories");
                router.refresh(); // Refresh route to update the datatable immediately
            } else {
                toast.error(res?.payload?.message || "Failed to update category");
            }
        } catch (err: any) {
            const details = err?.payload?.data?.details;
            if (details && Array.isArray(details)) {
                toast.error(`Validation Error: ${details.map((d: any) => d.message).join(', ')}`);
            } else {
                toast.error(err?.payload?.message || "An error occurred");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="py-6 space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-[400px] w-full max-w-3xl" />
            </div>
        );
    }

    if (error || !category) {
        return (
            <div className="py-6 space-y-6">
                <Button variant="ghost" onClick={() => router.push("/admin/categories")} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to list
                </Button>
                <Alert className="bg-destructive/10 text-destructive border-none max-w-3xl">
                    <TriangleAlert className="h-4 w-4" />
                    <AlertTitle>Error Loading Category</AlertTitle>
                    <AlertDescription>
                        {error || "Unknown error occurred"}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const initialData: CategoryFormValues = {
        name: category.name,
        description: category.description || "",
        iconUrl: category.iconUrl || "",
        status: category.status,
        // sortOrder: category.sortOrder,
    };

    return (
        <div className="py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push("/admin/categories")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Edit Category</h2>
                    <p className="text-muted-foreground">Update information for /{category.slug}</p>
                </div>
            </div>

            <CategoryForm initialData={initialData} onSubmit={onSubmit} isLoading={saving} isEdit={true} />
        </div>
    );
}

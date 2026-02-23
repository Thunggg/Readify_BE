"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CategoryApiRequest } from "@/api-request/category";
import { CategoryForm, CategoryFormValues } from "../components/CategoryForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreateCategoryView() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data: CategoryFormValues) => {
        try {
            setLoading(true);
            const res = await CategoryApiRequest.createCategory(data);
            if (res?.payload?.success) {
                toast.success("Category created successfully");
                router.push("/admin/categories");
                router.refresh();
            } else {
                toast.error(res?.payload?.message || "Failed to create category");
            }
        } catch (error: any) {
            toast.error(error?.payload?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push("/admin/categories")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Add Category</h2>
                    <p className="text-muted-foreground">Create a new book category</p>
                </div>
            </div>

            <CategoryForm onSubmit={onSubmit} isLoading={loading} isEdit={false} />
        </div>
    );
}

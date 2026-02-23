"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const categorySchema = z.object({
    name: z.string().min(1, 'Category name is required').max(100, 'Name cannot exceed 100 characters'),
    description: z.string().max(500, 'Description cannot exceed 500 characters').optional().or(z.literal('')),
    iconUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
    status: z.number(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
    initialData?: CategoryFormValues;
    onSubmit: (data: CategoryFormValues) => Promise<void>;
    isLoading?: boolean;
    isEdit?: boolean;
}

export function CategoryForm({ initialData, onSubmit, isLoading, isEdit }: CategoryFormProps) {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: initialData || {
            name: '',
            description: '',
            iconUrl: '',
            status: 1,
        }
    });

    const status = watch('status');

    return (
        <Card className="max-w-3xl">
            <CardHeader>
                <CardTitle>{isEdit ? 'Edit Category' : 'Create Category'}</CardTitle>
                <CardDescription>
                    {isEdit ? 'Update the details of the selected category.' : 'Add a new category to the system.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="space-y-2">
                        <Label htmlFor="name">Category Name <span className="text-red-500">*</span></Label>
                        <Input id="name" {...register('name')} placeholder="e.g. Science Fiction or Biography" />
                        {errors.name && <p className="text-sm font-medium text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Provide a brief summary of what this category contains..."
                            rows={4}
                        />
                        {errors.description && <p className="text-sm font-medium text-destructive">{errors.description.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="iconUrl">Category Icon URL (Optional)</Label>
                        <Input id="iconUrl" {...register('iconUrl')} placeholder="https://example.com/icon.png" />
                        {errors.iconUrl && <p className="text-sm font-medium text-destructive">{errors.iconUrl.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 flex flex-col justify-start">
                            <Label htmlFor="status">Status</Label>
                            <div className="flex items-center space-x-3 mt-3">
                                <Switch
                                    id="status"
                                    checked={status === 1}
                                    onCheckedChange={(checked) => setValue('status', checked ? 1 : 0)}
                                />
                                <Label htmlFor="status" className="font-normal text-muted-foreground">
                                    {status === 1 ? 'Active (Visible to users)' : 'Inactive (Hidden from users)'}
                                </Label>
                            </div>
                            {errors.status && <p className="text-sm font-medium text-destructive">{errors.status.message}</p>}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? 'Save Changes' : 'Create Category'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

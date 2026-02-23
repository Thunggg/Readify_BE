"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  ArrowLeft,
  TriangleAlert,
  Truck,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  Edit,
  Trash2,
  RotateCcw,
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

export default function SupplierDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchOne = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:3000/suppliers/${id}?includeDeleted=true`, {
          credentials: 'include'
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();
        const data = json.data || json;
        setSupplier(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fetch error");
      } finally {
        setLoading(false);
      }
    };
    fetchOne();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;

    try {
      setDeleting(true);
      const res = await fetch(`http://localhost:3000/suppliers/${id}`, {
        method: "DELETE",
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      router.push("/admin/supplier");
    } catch (e: unknown) {
      alert(
        `Delete error: ${e instanceof Error ? e.message : "Unknown delete error"}`
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm("Are you sure you want to restore this supplier?")) return;

    try {
      setRestoring(true);
      const res = await fetch(`http://localhost:3000/suppliers/${id}/restore`, {
        method: "PATCH",
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Restore failed: ${res.status}`);
      router.push("/admin/supplier");
    } catch (e: unknown) {
      alert(
        `Restore error: ${e instanceof Error ? e.message : "Unknown restore error"}`
      );
    } finally {
      setRestoring(false);
    }
  };

  if (!id)
    return (
      <div className="py-6">
        <Alert className="bg-destructive/10 text-destructive border-none">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Missing ID</AlertTitle>
          <AlertDescription className="text-destructive/80">
            No supplier id provided.
          </AlertDescription>
        </Alert>
      </div>
    );

  if (loading)
    return (
      <div className="py-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
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

  if (!supplier)
    return (
      <div className="py-6">
        <Alert>
          <Truck className="h-4 w-4" />
          <AlertTitle>No data</AlertTitle>
          <AlertDescription>No supplier data found.</AlertDescription>
        </Alert>
      </div>
    );

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Supplier Details</h2>
            {supplier?.isDeleted && (
              <Badge variant="destructive">Deleted</Badge>
            )}
          </div>
          <p className="text-muted-foreground">View supplier information</p>
        </div>
        <div className="flex gap-2">
          {supplier?.isDeleted ? (
            <Button
              onClick={handleRestore}
              disabled={restoring}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {restoring ? "Restoring..." : "Restore"}
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild>
                <a href={`/admin/supplier/edit/${id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </a>
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="col-span-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Truck className="h-6 w-6" />
              {supplier.name}
            </CardTitle>
            <CardDescription className="mt-1">
              Supplier Information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  Contact Name
                </div>
                <p className="font-medium">{supplier.contactName ?? "-"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Phone
                </div>
                <p className="font-medium">{supplier.phone ?? "-"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
                <p className="font-medium">{supplier.email ?? "-"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Created At
                </div>
                <p className="font-medium text-sm">
                  {supplier.createdAt
                    ? new Date(supplier.createdAt).toLocaleString("vi-VN")
                    : "-"}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Address
              </div>
              <p className="font-medium">{supplier.address ?? "-"}</p>
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage this supplier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {supplier?.isDeleted ? (
              <Button
                onClick={handleRestore}
                disabled={restoring}
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {restoring ? "Restoring..." : "Restore Supplier"}
              </Button>
            ) : (
              <>
                <Button asChild className="w-full" variant="outline">
                  <a href={`/admin/supplier/edit/${id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Supplier
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleting ? "Deleting..." : "Delete Supplier"}
                </Button>
              </>
            )}
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}

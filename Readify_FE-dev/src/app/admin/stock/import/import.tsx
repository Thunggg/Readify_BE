"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Download,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RotateCcw,
  List,
  TriangleAlert,
} from "lucide-react";

type ImportError = {
  row: number;
  isbn?: string;
  message: string;
};

type ImportResult = {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportError[];
};

export default function ImportStockView() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const fileExt = selectedFile.name.toLowerCase().split(".").pop();
      if (fileExt !== "xlsx" && fileExt !== "xls") {
        setError("Vui lòng chọn file Excel (.xlsx hoặc .xls)");
        setFile(null);
        return;
      }
      // Validate file size (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File quá lớn. Kích thước tối đa là 5MB");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Vui lòng chọn file để upload");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:3000/stocks/import", {
        method: "POST",
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      // Handle response based on API structure
      if (data.success && data.data) {
        setResult(data.data);
      } else if (data.success === false) {
        setError(data.message || "Import failed");
      } else {
        setResult(data);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="py-6 space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/stock/viewlist">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Import Stock từ Excel</h2>
        <p className="text-muted-foreground mt-1">
          Upload file Excel để import hàng tồn kho
        </p>
      </div>

      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Hướng dẫn sử dụng</AlertTitle>
        <AlertDescription className="mt-2">
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span>
                File Excel phải có các cột:{" "}
                <Badge variant="secondary" className="text-xs">ISBN</Badge>{" "}
                <Badge variant="secondary" className="text-xs">Quantity</Badge>{" "}
                <Badge variant="secondary" className="text-xs">Location</Badge>{" "}
                <Badge variant="secondary" className="text-xs">Price</Badge>{" "}
                <Badge variant="secondary" className="text-xs">Batch</Badge>{" "}
                <Badge variant="secondary" className="text-xs">Status</Badge>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span>Cột <strong>ISBN</strong> (bắt buộc) - dùng để tìm sách trong hệ thống</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span>Cột <strong>Quantity</strong> và <strong>Price</strong> phải là số &gt;= 0</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span>Nếu stock đã tồn tại, quantity sẽ được cộng thêm vào</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span>Kích thước file tối đa: 5MB</span>
            </li>
          </ul>
          <Button variant="link" size="sm" asChild className="mt-3 px-0">
            <a href="http://localhost:3000/sample-stock-template.xlsx" download>
              <Download className="mr-2 h-4 w-4" />
              Tải file Excel mẫu
            </a>
          </Button>
        </AlertDescription>
      </Alert>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Chọn file Excel
          </CardTitle>
          <CardDescription>
            Chọn file Excel chứa dữ liệu tồn kho để import vào hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={uploading}
              className="cursor-pointer"
            />
          </div>

          {file && (
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{file.name}</span>
                  <Badge variant="outline">
                    {(file.size / 1024).toFixed(1)} KB
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              size="lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Import
                </>
              )}
            </Button>

            {(file || result) && (
              <Button
                onClick={handleReset}
                disabled={uploading}
                variant="outline"
                size="lg"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="bg-destructive/10 text-destructive border-none">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Upload failed</AlertTitle>
          <AlertDescription className="text-destructive/80">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Result Display */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                )}
                <div className="flex-1">
                  <CardTitle
                    className={result.success ? "text-green-700" : "text-yellow-700"}
                  >
                    {result.success
                      ? "Import thành công!"
                      : "Import hoàn tất với một số lỗi"}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Kết quả import dữ liệu từ file Excel
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Thành công</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-green-600">
                      {result.imported}
                    </p>
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Thất bại</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-red-600">
                      {result.failed}
                    </p>
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3" />
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Tổng</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold">
                      {result.imported + result.failed}
                    </p>
                    <Badge variant="secondary">
                      <FileSpreadsheet className="h-3 w-3" />
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Errors List */}
          {result.errors && result.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Chi tiết lỗi
                </CardTitle>
                <CardDescription>
                  {result.errors.length} dòng không thể import
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {result.errors.map((err, idx) => (
                    <Alert
                      key={idx}
                      className="bg-destructive/10 text-destructive border-none"
                    >
                      <TriangleAlert className="h-4 w-4" />
                      <AlertTitle className="text-sm">
                        Dòng {err.row}
                        {err.isbn && (
                          <Badge variant="outline" className="ml-2 font-mono text-xs">
                            {err.isbn}
                          </Badge>
                        )}
                      </AlertTitle>
                      <AlertDescription className="text-sm text-destructive/80">
                        {err.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button asChild size="lg">
              <Link href="/admin/stock/viewlist">
                <List className="mr-2 h-4 w-4" />
                Xem danh sách stock
              </Link>
            </Button>
            <Button onClick={handleReset} variant="outline" size="lg">
              <Upload className="mr-2 h-4 w-4" />
              Import file khác
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

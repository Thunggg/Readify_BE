"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, TrendingUp, ShoppingCart, Package } from "lucide-react";

// Mock data for charts
const monthlyData = [
  { month: "Jan", revenue: 45000, orders: 120, profit: 12000 },
  { month: "Feb", revenue: 52000, orders: 145, profit: 15000 },
  { month: "Mar", revenue: 48000, orders: 132, profit: 13500 },
  { month: "Apr", revenue: 61000, orders: 168, profit: 18000 },
  { month: "May", revenue: 58000, orders: 155, profit: 16500 },
  { month: "Jun", revenue: 67000, orders: 182, profit: 20000 },
];

const categoryData = [
  { name: "Fiction", value: 35, color: "#3b82f6" },
  { name: "Non-Fiction", value: 25, color: "#8b5cf6" },
  { name: "Education", value: 20, color: "#10b981" },
  { name: "Children", value: 15, color: "#f59e0b" },
  { name: "Others", value: 5, color: "#6b7280" },
];

const recentSales = [
  { id: "ORD-001", customer: "Nguyen Van A", amount: 1250000, books: 15 },
  { id: "ORD-002", customer: "Tran Thi B", amount: 890000, books: 8 },
  { id: "ORD-003", customer: "Le Van C", amount: 2100000, books: 25 },
  { id: "ORD-004", customer: "Pham Thi D", amount: 650000, books: 6 },
  { id: "ORD-005", customer: "Hoang Van E", amount: 1450000, books: 12 },
];

export default function IncomeDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProfit: 0,
    totalBooks: 0,
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const totalRevenue = monthlyData.reduce(
        (sum, item) => sum + item.revenue,
        0
      );
      const totalOrders = monthlyData.reduce(
        (sum, item) => sum + item.orders,
        0
      );
      const totalProfit = monthlyData.reduce(
        (sum, item) => sum + item.profit,
        0
      );
      const totalBooks = recentSales.reduce((sum, item) => sum + item.books, 0);

      setStats({
        totalRevenue,
        totalOrders,
        totalProfit,
        totalBooks,
      });
    }, 500);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of system performance and analytics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">+20.1%</span> from
              last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">+15.3%</span> from
              last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">+12.5%</span> from
              last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBooks}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">+8.2%</span> from
              last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="revenue" className="space-y-4" suppressHydrationWarning>
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue & Profit</CardTitle>
              <CardDescription>
                Revenue and profit trends over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  <Bar dataKey="profit" fill="#10b981" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Trends</CardTitle>
              <CardDescription>
                Number of orders processed monthly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>
                  Distribution of sales across book categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>Latest transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {sale.customer}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sale.id} • {sale.books} books
                        </p>
                      </div>
                      <div className="text-sm font-semibold">
                        {formatCurrency(sale.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

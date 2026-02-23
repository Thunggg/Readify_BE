"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  DollarSign,
  Truck,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

const stats = [
  {
    title: "Total Revenue",
    value: "$331,231.89",
    icon: DollarSign,
    description: "+20.1% from last month",
    trend: "up",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "Stock Items",
    value: "2,350",
    icon: Package,
    description: "+12% from last month",
    trend: "up",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Orders",
    value: "+12,234",
    icon: ShoppingCart,
    description: "+19% from last month",
    trend: "up",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "Suppliers",
    value: "145",
    icon: Truck,
    description: "+5 new suppliers",
    trend: "up",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
];

export default function WarehouseDashboard() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Warehouse Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Welcome back! Here&apos;s an overview of your warehouse data.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.title}
              className="group hover:shadow-lg transition-all duration-200"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Content Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Recent Activity
            </CardTitle>
            <p className="text-muted-foreground">
              Latest updates from your warehouse
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg border">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="flex-1">
                <p className="font-medium">New stock imported</p>
                <p className="text-sm text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg border">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <div className="flex-1">
                <p className="font-medium">Order #1234 completed</p>
                <p className="text-sm text-muted-foreground">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg border">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <div className="flex-1">
                <p className="font-medium">Low stock alert: 5 items</p>
                <p className="text-sm text-muted-foreground">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg border">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <div className="flex-1">
                <p className="font-medium">New supplier added</p>
                <p className="text-sm text-muted-foreground">3 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Quick Actions
            </CardTitle>
            <p className="text-muted-foreground">Commonly used features</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors"
              >
                <Package className="h-6 w-6" />
                <span className="text-sm font-medium">Add Stock</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors"
              >
                <Truck className="h-6 w-6" />
                <span className="text-sm font-medium">Add Supplier</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors"
              >
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm font-medium">View Report</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border hover:bg-muted transition-colors"
              >
                <ShoppingCart className="h-6 w-6" />
                <span className="text-sm font-medium">Orders</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

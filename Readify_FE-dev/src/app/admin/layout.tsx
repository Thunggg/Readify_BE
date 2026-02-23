"use client";
import React from "react";
import AdminSidebar from "./layouts/sidebar";
import { Topbar } from "./layouts/topbar";
import CurrentUserProvider from "@/contexts/user-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CurrentUserProvider>
      <div className="relative flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Topbar />
          <main className="p-8 max-w-[calc(100vw-18rem)] mx-auto">
            
            <div className="min-h-[calc(100vh-8rem)]">{children}</div>
          </main>
        </div>
      </div>
    </CurrentUserProvider>
  );
}

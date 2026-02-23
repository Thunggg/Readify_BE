import React from "react";
import CategoryDetailView from "./detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    return <CategoryDetailView id={resolvedParams.id} />;
}

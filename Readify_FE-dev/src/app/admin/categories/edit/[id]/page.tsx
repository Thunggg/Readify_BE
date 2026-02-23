import React from "react";
import EditCategoryView from "./edit";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    return <EditCategoryView id={resolvedParams.id} />;
}

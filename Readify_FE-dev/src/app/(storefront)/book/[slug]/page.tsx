import { BookDetailContent } from "./book-detail-content";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <BookDetailContent bookSlug={slug} />
      </main>
    </div>
  );
}

import { CategoryContent } from "./category-content"

const categoryNames: Record<string, string> = {
  "van-hoc": "Văn học",
  "ky-nang-song": "Kỹ năng sống",
  "kinh-doanh": "Kinh doanh",
  "tam-ly": "Tâm lý",
  "lich-su": "Lịch sử",
  "kinh-te": "Kinh tế",
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const categoryName = categoryNames[params.slug] || params.slug
  return {
    title: `${categoryName} - BookStore`,
    description: `Khám phá các cuốn sách ${categoryName.toLowerCase()} hay nhất`,
  }
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const categoryName = categoryNames[params.slug] || params.slug

  return <CategoryContent slug={params.slug} categoryName={categoryName} />
}

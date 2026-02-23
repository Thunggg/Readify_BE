import { HeroSection } from "@/components/storefront/hero-section";
import { CategoryTabs } from "@/components/storefront/category-tabs";
import { FeaturedBooks } from "@/components/storefront/featured-books";

export default async function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <HeroSection />
        <CategoryTabs />
        <FeaturedBooks />
      </main>
    </div>
  );
}

"use client";

import { BookCard } from "@/components/storefront/book-card";
import { Button } from "@/components/ui/button";
import { PublicBook } from "@/types/book";
import { useState, useEffect, useRef } from "react";
import { BookApiRequest } from "@/api-request/book";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export function FeaturedBooks() {
  const [activeTab, setActiveTab] = useState<"newest" | "bestseller">("newest");
  const [books, setBooks] = useState<PublicBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const tabs = [
    { label: "Newest", value: "newest" as const },
    { label: "Bestseller", value: "bestseller" as const },
  ];

  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      try {
        const res = await BookApiRequest.getBooks({
          sort: activeTab === "newest" ? "newest" : "best_selling",
          page: 1,
          limit: 12,
        });

        if (res.payload.success) {
          setBooks(res.payload.data.items);
        }
      } catch (error) {
        console.error("Failed to fetch books:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [activeTab]);

  return (
    <section className="container py-8">
      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-8 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`pb-3 font-medium transition-colors relative ${
                tab.value === activeTab
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.value === activeTab && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-primary"></span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="h-9">
            <Link href="/books">View All</Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => carouselApi?.scrollPrev()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => carouselApi?.scrollNext()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      {isLoading ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            setApi={setCarouselApi}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {books.map((book) => (
                <CarouselItem
                  key={book._id}
                  className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                >
                  <BookCard {...book} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </>
      )}
    </section>
  );
}

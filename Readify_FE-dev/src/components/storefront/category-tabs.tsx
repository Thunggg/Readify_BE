"use client"

import { Button } from "@/components/ui/button"
import { BookOpen, Briefcase, Heart, Baby, Globe } from "lucide-react"

const categories = [
  { id: "all", label: "All", icon: BookOpen },
  { id: "literature", label: "Literature", icon: BookOpen },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "psychology", label: "Psychology", icon: Heart },
  { id: "children", label: "Children", icon: Baby },
  { id: "foreign", label: "Languages", icon: Globe },
]

export function CategoryTabs({ activeCategory = "all" }: { activeCategory?: string }) {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Popular Categories</h2>
        <Button variant="link" className="text-primary">
          View All
        </Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              className="flex items-center gap-2 whitespace-nowrap"
              asChild
            >
              <a href={`/?category=${category.id}`}>
                <Icon className="h-4 w-4" />
                {category.label}
              </a>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

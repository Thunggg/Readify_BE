import Link from "next/link"
import { BookOpen, Facebook, Instagram, Youtube, Mail } from "lucide-react"

const exploreLinks = [
  { href: "/new", label: "New Arrivals" },
  { href: "/bestseller", label: "Best Sellers" },
  { href: "/categories/textbooks", label: "Textbooks" },
  { href: "/magazines", label: "Magazines" },
]

const supportLinks = [
  { href: "/policy/return", label: "Return Policy" },
  { href: "/policy/shipping", label: "Shipping" },
  { href: "/policy/payment", label: "Payment Methods" },
  { href: "/contact", label: "Contact" },
]

const aboutLinks = [
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
]

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">BookStore</span>
            </Link>

            <p className="text-sm text-muted-foreground mb-4">
              A place to share knowledge and reading culture. We&apos;re committed to bringing you quality books at the best prices.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              {exploreLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              {supportLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              {aboutLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">© 2026 Readify. All rights reserved.</p>

          <div className="flex gap-4">
            <a className="text-muted-foreground hover:text-foreground" href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
            <a className="text-muted-foreground hover:text-foreground" href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
            <a className="text-muted-foreground hover:text-foreground" href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
              <Youtube className="h-5 w-5" />
            </a>
            <a className="text-muted-foreground hover:text-foreground" href="mailto:support@bookstore.com" aria-label="Email">
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

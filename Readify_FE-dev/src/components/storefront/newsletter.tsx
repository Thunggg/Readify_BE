import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail } from "lucide-react"

export function Newsletter() {
  return (
    <section className="bg-muted/50 py-12">
      <div className="container">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Subscribe to Newsletter</h2>
          <p className="text-muted-foreground mb-6">
            Get notified about new books, author events and exclusive weekly offers.
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <Input type="email" placeholder="Your email" className="flex-1" />
            <Button>Subscribe</Button>
          </div>
        </div>
      </div>
    </section>
  )
}

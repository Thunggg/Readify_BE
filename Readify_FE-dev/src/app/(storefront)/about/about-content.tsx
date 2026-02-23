import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Users, Award, Heart, TrendingUp, Shield } from "lucide-react"

export function AboutContent() {
  return (
    <div className="container py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">About Us</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          BookStore - Where knowledge and passion for reading connect. We believe that every book is a journey of
          self-discovery and exploration of the world around us.
        </p>
      </div>

      {/* Story Section */}
      <div className="mb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Our Story</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Founded in 2015, BookStore started as a small store with a passion for sharing knowledge through books.
                From the beginning, we have been committed to providing readers with quality books at reasonable prices.
              </p>
              <p>
                After more than 8 years of operation, we have grown to become one of Vietnam's most trusted online
                bookstores with millions of satisfied customers. Our collection includes over 100,000 book titles across
                all genres.
              </p>
              <p>
                Our mission is not just to sell books, but to build a book-loving community where everyone can explore,
                share, and grow together through reading culture.
              </p>
            </div>
          </div>
          <div className="relative">
            <img src="/bookstore-interior-with-shelves.jpg" alt="BookStore interior" className="rounded-lg shadow-lg" />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">100K+</div>
            <div className="text-sm text-muted-foreground">Book Titles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">500K+</div>
            <div className="text-sm text-muted-foreground">Customers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">2M+</div>
            <div className="text-sm text-muted-foreground">Orders</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">4.8/5</div>
            <div className="text-sm text-muted-foreground">Rating</div>
          </CardContent>
        </Card>
      </div>

      {/* Values Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Core Values</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality</h3>
              <p className="text-muted-foreground">
                Every book is carefully selected to ensure the best content value and printing quality.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Dedication</h3>
              <p className="text-muted-foreground">
                Our enthusiastic consulting team is ready to help you find books that suit your needs and interests.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Trustworthiness</h3>
              <p className="text-muted-foreground">
                100% authentic books commitment, flexible return policy, and maximum customer rights protection.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p className="text-muted-foreground">
                Building a book-loving community where people connect, share, and grow together.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Innovation</h3>
              <p className="text-muted-foreground">
                Continuously improving shopping experience, from website to delivery services and customer care.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Award className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Excellence</h3>
              <p className="text-muted-foreground">
                Striving to become Vietnam's leading bookstore with excellent services and customer experience.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team Section */}
      <div>
        <h2 className="text-3xl font-bold text-center mb-4">Our Team</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          We are a passionate team of book lovers with many years of experience in the publishing and book distribution industry.
        </p>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { name: "Nguyễn Văn A", role: "CEO & Founder", image: "portrait businessman" },
            { name: "Trần Thị B", role: "Operations Director", image: "portrait businesswoman" },
            { name: "Lê Văn C", role: "Marketing Director", image: "portrait businessman casual" },
            { name: "Phạm Thị D", role: "Customer Service Manager", image: "portrait businesswoman smiling" },
          ].map((member, i) => (
            <Card key={i}>
              <CardContent className="pt-6 text-center">
                <img
                  src={`/.jpg?height=200&width=200&query=${member.image}`}
                  alt={member.name}
                  className="rounded-full w-32 h-32 mx-auto mb-4 object-cover"
                />
                <h3 className="font-semibold mb-1">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

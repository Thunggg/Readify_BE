import mongoose, { Schema, Types } from 'mongoose'

/**
 * ===== CONFIG =====
 * Thay bằng connection string của bạn
 */
const MONGO_URI = 'mongodb+srv://tptai1314_db_user:J8OBdXqjDh2nSTzU@Readify.dyrbkjw.mongodb.net/Readify?retryWrites=true&w=majority&appName=BookCapyStore'

/**
 * ===== Schema Definition =====
 */
const BlogPostSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    excerpt: String,
    featuredImage: String,
    book: { type: Schema.Types.ObjectId, ref: 'Book' },
    category: { type: Schema.Types.ObjectId, ref: 'BlogCategory', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    viewCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    commentCount: { type: Number, default: 0 },
    publishedAt: Date,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

BlogPostSchema.index({ slug: 1 })
BlogPostSchema.index({ status: 1, publishedAt: -1 })
BlogPostSchema.index({ category: 1 })
BlogPostSchema.index({ tags: 1 })

const BlogPost = mongoose.model('BlogPost', BlogPostSchema)

/**
 * ===== SEED DATA =====
 * ⚠ Thay ObjectId bằng ID thật trong DB của bạn
 */
const authorId = new Types.ObjectId('694bc292e955bd6856aaf585')
const categoryId1 = new Types.ObjectId('695f744669943a720a789f12')
const categoryId2 = new Types.ObjectId('695f744669943a720a789f15')
const categoryId3 = new Types.ObjectId('695f744769943a720a789f18')
const bookId = new Types.ObjectId('694d618d95fa3e94439a0ecd')

const blogPosts = [
  {
    title: 'Clean Code – Vì sao lập trình viên nên đọc?',
    slug: 'clean-code-vi-sao-nen-doc',
    content: 'Phân tích giá trị của Clean Code và cách áp dụng vào dự án thực tế.',
    excerpt: 'Giá trị thực tế của Clean Code.',
    featuredImage: 'https://example.com/clean-code.jpg',
    book: bookId,
    category: categoryId1,
    author: authorId,
    status: 'published',
    viewCount: 120,
    tags: ['clean-code', 'programming'],
    commentCount: 5,
    publishedAt: new Date(),
  },
  {
    title: 'Top 5 sách nâng cao tư duy lập trình',
    slug: 'top-5-sach-tu-duy-lap-trinh',
    content: 'Danh sách 5 cuốn sách quan trọng cho developer.',
    category: categoryId1,
    author: authorId,
    status: 'published',
    viewCount: 85,
    tags: ['books', 'developer'],
    commentCount: 2,
    publishedAt: new Date(),
  },
  {
    title: 'So sánh Java và Node.js trong backend',
    slug: 'so-sanh-java-nodejs-backend',
    content: 'So sánh hiệu năng và hệ sinh thái giữa Java và Node.js.',
    category: categoryId2,
    author: authorId,
    status: 'draft',
    tags: ['java', 'nodejs'],
  },
  {
    title: 'Cách xây dựng thói quen đọc sách',
    slug: 'xay-dung-thoi-quen-doc-sach',
    content: 'Phương pháp duy trì thói quen đọc sách lâu dài.',
    category: categoryId3,
    author: authorId,
    status: 'published',
    viewCount: 45,
    tags: ['reading', 'habit'],
    commentCount: 1,
    publishedAt: new Date(),
  },
  {
    title: 'Tương lai AI trong ngành xuất bản',
    slug: 'tuong-lai-ai-xuat-ban',
    content: 'AI đang thay đổi cách sách được viết và xuất bản.',
    category: categoryId3,
    author: authorId,
    status: 'archived',
    viewCount: 210,
    tags: ['ai', 'technology'],
    commentCount: 8,
    publishedAt: new Date('2024-12-01'),
  },
]

/**
 * ===== RUN SEED =====
 */
async function runSeed() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')

    await BlogPost.deleteMany({})
    console.log('Old blog posts deleted')

    await BlogPost.insertMany(blogPosts)
    console.log('Seeded 5 blog posts successfully')

    process.exit(0)
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

runSeed()
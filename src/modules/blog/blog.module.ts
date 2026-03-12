import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogController } from './controllers/blog.controller';
import { BlogCommentsController } from './controllers/blog-comments.controller';
// import { BlogCategoriesController } from './controllers/blog-categories.controller';
import { BlogService } from './services/blog.service';
import { BlogCommentsService } from './services/blog-comments.service';
// import { BlogCategoriesService } from './services/blog-categories.service';
import { BlogPost, BlogPostSchema } from './schemas/blog-post.schema';
import { BlogCategory, BlogCategorySchema } from './schemas/blog-category.schema';
import { BlogComment, BlogCommentSchema } from './schemas/blog-comment.schema';
import { Media, MediaSchema } from '../media/schemas/media.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlogPost.name, schema: BlogPostSchema },
      { name: BlogCategory.name, schema: BlogCategorySchema },
      { name: BlogComment.name, schema: BlogCommentSchema },
      { name: Media.name, schema: MediaSchema },
    ]),
  ],
  controllers: [
    BlogController,
    BlogCommentsController,
    // BlogCategoriesController,
  ],
  providers: [
    BlogService,
    BlogCommentsService,
    // BlogCategoriesService,
  ],
  exports: [BlogService],
})
export class BlogModule {}

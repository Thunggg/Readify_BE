import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogController } from './controllers/blog.controller';
import { BlogCommentsController } from './controllers/blog-comments.controller';
import { BlogCategoriesController } from './controllers/blog-categories.controller';
import { BlogPostLikesController } from './controllers/blog-post-likes.controller';
import { BlogService } from './services/blog.service';
import { BlogCommentsService } from './services/blog-comments.service';
import { BlogCategoriesService } from './services/blog-categories.service';
import { BlogPostLikesService } from './services/blog-post-likes.service';
import { BlogPost, BlogPostSchema } from './schemas/blog-post.schema';
import { BlogCategory, BlogCategorySchema } from './schemas/blog-category.schema';
import { BlogComment, BlogCommentSchema } from './schemas/blog-comment.schema';
import { BlogPostLike, BlogPostLikeSchema } from './schemas/blog-post-like.schema';
import { Media, MediaSchema } from '../media/schemas/media.schema';
import { Account, AccountSchema } from '../accounts/schemas/account.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlogPost.name, schema: BlogPostSchema },
      { name: BlogCategory.name, schema: BlogCategorySchema },
      { name: BlogComment.name, schema: BlogCommentSchema },
      { name: BlogPostLike.name, schema: BlogPostLikeSchema },
      { name: Media.name, schema: MediaSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  controllers: [
    BlogController,
    BlogCommentsController,
    BlogCategoriesController,
    BlogPostLikesController,
  ],
  providers: [
    BlogService,
    BlogCommentsService,
    BlogCategoriesService,
    BlogPostLikesService,
  ],
  exports: [BlogService, BlogCategoriesService],
})
export class BlogModule {}

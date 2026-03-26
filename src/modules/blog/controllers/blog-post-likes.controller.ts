import { Controller, Get, Post, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { BlogPostLikesService } from '../services/blog-post-likes.service';

@Controller('blog/posts')
@ApiTags('Blog Post Likes')
export class BlogPostLikesController {
  constructor(private readonly likesService: BlogPostLikesService) {}

  @Get(':postId/like')
  @UseGuards(JwtAuthGuard)
  getLikeStatus(@Param('postId') postId: string, @Req() req: any) {
    const userId = String(req?.user?.userId ?? '');
    return this.likesService.getLikeStatus(postId, userId);
  }

  @Post(':postId/like')
  @UseGuards(JwtAuthGuard)
  likePost(@Param('postId') postId: string, @Req() req: any) {
    const userId = String(req?.user?.userId ?? '');
    return this.likesService.likePost(postId, userId);
  }

  @Delete(':postId/like')
  @UseGuards(JwtAuthGuard)
  unlikePost(@Param('postId') postId: string, @Req() req: any) {
    const userId = String(req?.user?.userId ?? '');
    return this.likesService.unlikePost(postId, userId);
  }
}


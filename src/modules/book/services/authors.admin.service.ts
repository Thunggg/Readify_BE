import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Author } from '../schemas/author.schema';
import { SearchAuthorsDto } from '../dto/search-authors.dto';
import { PaginatedResponse } from '../../../shared/responses/paginated.response';

@Injectable()
export class AuthorsAdminService {
  private readonly logger = new Logger(AuthorsAdminService.name);

  constructor(
    @InjectModel(Author.name) private readonly authorModel: Model<Author>,
  ) {}

  async getAuthorList(query: SearchAuthorsDto) {
    const { q, page = 1, limit = 20 } = query;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    const filter: any = {};

    if (q?.trim()) {
      const kw = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: kw, $options: 'i' } },
        { penName: { $regex: kw, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.authorModel
        .find(filter)
        .sort({ name: 1, _id: 1 })
        .skip(skip)
        .limit(validLimit)
        .select({
          name: 1,
          slug: 1,
          penName: 1,
          avatar: 1,
          status: 1,
        })
        .lean(),

      this.authorModel.countDocuments(filter),
    ]);

    return new PaginatedResponse(
      items,
      { page: validPage, limit: validLimit, total },
      'Successfully retrieved the author list',
    );
  }
}

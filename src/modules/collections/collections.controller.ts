import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CollectionIdDto } from './dto/collection-id.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AddBooksToCollectionDto } from './dto/add-books-to-collection.dto';

@Controller('admin/collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  createCollection(@Body() dto: CreateCollectionDto) {
    return this.collectionsService.createCollection(dto);
  }

  @Get()
  getCollectionsList() {
    return this.collectionsService.getCollectionsList();
  }

  @Get(':id')
  getCollectionDetail(@Param() params: CollectionIdDto) {
    return this.collectionsService.getCollectionDetail(params.id);
  }

  @Patch(':id')
  updateCollection(@Param() params: CollectionIdDto, @Body() dto: UpdateCollectionDto) {
    return this.collectionsService.updateCollection(params.id, dto);
  }

  @Patch(':id/books')
  addBooksToCollection(@Param() params: CollectionIdDto, @Body() dto: AddBooksToCollectionDto) {
    return this.collectionsService.addBooksToCollection(params.id, dto);
  }

  @Delete(':id')
  deleteCollection(@Param() params: CollectionIdDto) {
    return this.collectionsService.deleteCollection(params.id);
  }
}

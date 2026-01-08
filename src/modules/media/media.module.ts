import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { cloudinaryProvider } from './cloudinary/cloudinary.provider';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { Media, MediaSchema } from './schemas/media.schema';
import { MediaCleanupJob } from './media.cleanup.job';
import { Account, AccountSchema } from '../accounts/schemas/account.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    ScheduleModule.forRoot(),
  ],
  controllers: [MediaController],
  providers: [cloudinaryProvider, CloudinaryService, MediaService, MediaCleanupJob],
  exports: [MediaService],
})
export class MediaModule {}

import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MediaService } from './media.service';

@Injectable()
export class MediaCleanupJob {
  constructor(private readonly mediaService: MediaService) {}

  // Every day at 03:00
  @Cron('0 0 3 * * *')
  async cleanup() {
    await this.mediaService.cleanupTempOlderThan(24);
  }
}

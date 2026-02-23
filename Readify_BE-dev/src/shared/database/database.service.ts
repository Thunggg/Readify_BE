import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger('MongoDB');

  constructor(@InjectConnection() private readonly connection: Connection) {}

  onModuleInit() {
    // Logs once the connection is ready (also works if it's already connected)
    void this.connection
      .asPromise()
      .then(() => this.logger.log('Connected to MongoDB'))
      .catch((err) => this.logger.error('MongoDB connection error', err instanceof Error ? err.stack : String(err)));

    this.connection.on('connected', () => {
      this.logger.log('Connected to MongoDB');
    });

    this.connection.on('disconnected', () => {
      this.logger.warn('Disconnected from MongoDB');
    });

    this.connection.on('error', (err) => {
      this.logger.error('MongoDB connection error', err instanceof Error ? err.stack : String(err));
    });
  }
}

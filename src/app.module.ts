import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './configs/configuration';
import { validateEnv } from './configs/validation-env';
import { DatabaseModule } from './shared/database/database.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { StaffModule } from './modules/staff/staff.module';
import { StockModule } from './modules/stock/stock.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { BookModule } from './modules/book/book.module';
import { AuthModule } from './modules/auth/auth.module';
import { PromotionModule } from './modules/promotion/promotion.module';
import { PromotionLogModule } from './modules/promotion-log/promotion-log.module';
import { OrderModule } from './modules/order/order.module';
import { CartModule } from './modules/cart/cart.module';
import { MediaModule } from './modules/media/media.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './modules/mail/mail.module';
import { OtpModule } from './modules/otp/otp.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { BlogModule } from './modules/blog/blog.module';
import { IncomeModule } from './modules/income/income.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: validateEnv,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AccountsModule,
    StaffModule,
    StockModule,
    SupplierModule,
    BookModule,
    AuthModule,
    PromotionModule,
    PromotionLogModule,
    OrderModule,
    CartModule,
    MediaModule,
    MailModule,
    OtpModule,
    WishlistModule,
    NotificationsModule,
    CategoriesModule,
    ReviewsModule,
    BlogModule,
    IncomeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

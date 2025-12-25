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
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: validateEnv,
    }),
    DatabaseModule,
    AccountsModule,
    StaffModule,
    StockModule,
    SupplierModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

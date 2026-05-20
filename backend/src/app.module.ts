import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { InventoryModule } from './inventory/inventory.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BillingModule } from './billing/billing.module';
import { ClientsModule } from './clients/clients.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { ReceivablesModule } from './receivables/receivables.module';
import { DailyReportsModule } from './daily-reports/daily-reports.module';
import { PurchasesModule } from './purchases/purchases.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PriceHistoryModule } from './price-history/price-history.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PrismaModule,
    InventoryModule,
    ShipmentsModule,
    DashboardModule,
    BillingModule,
    ClientsModule,
    ReceiptsModule,
    ReceivablesModule,
    DailyReportsModule,
    PurchasesModule,
    ExpensesModule,
    PriceHistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}

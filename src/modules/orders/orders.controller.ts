import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VnpayCallbackDto } from './dto/vnpay-callback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Response } from 'express';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req?.user?.userId as string;
    return this.ordersService.createOrder(userId, dto);
  }
}

@Controller('payment')
export class PaymentController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('vnpay/return')
  async vnpayReturn(@Query() query: VnpayCallbackDto, @Res() res: Response) {
    try {
      const clientIp = (res.req as any).ip || (res.req as any).connection.remoteAddress || '127.0.0.1';
      const result = await this.ordersService.handleVnpayCallback(query, clientIp);

      // Redirect to frontend success/failure page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const redirectUrl = result.success
        ? `${frontendUrl}/payment/success?orderId=${result.data.orderId}`
        : `${frontendUrl}/payment/failed?orderId=${result.data.orderId || ''}`;

      res.redirect(redirectUrl);
    } catch (error: any) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/payment/failed?error=${encodeURIComponent(error.message)}`);
    }
  }

  @Post('vnpay/ipn')
  async vnpayIpn(@Query() query: VnpayCallbackDto, @Res() res: Response) {
    try {
      const clientIp = (res.req as any).ip || (res.req as any).connection.remoteAddress || '127.0.0.1';
      const result = await this.ordersService.handleVnpayCallback(query, clientIp);

      // VNPay expects specific response format for IPN
      res.status(200).json({ RspCode: '00', Message: 'Success' });
    } catch (error: any) {
      res.status(200).json({ RspCode: '99', Message: error.message || 'Unknown error' });
    }
  }
}


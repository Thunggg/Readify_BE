/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Get, Post, Put, Patch, Query, Req, UseGuards, Param, Body } from '@nestjs/common';
import { OrderService } from './order.service';
import { SearchOrderDto } from './dto/search-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderIdDto } from './dto/order-id.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  getList(@Query() query: SearchOrderDto, @Req() req: any) {
    return this.orderService.getOrderList(query, req.user.userId);
  }

  @Get('history')
  getHistory(@Query() query: SearchOrderDto, @Req() req: any) {
    return this.orderService.getOrderHistory(query, req.user.userId);
  }

  @Get(':id')
  getDetail(@Param() params: OrderIdDto, @Req() req: any) {
    return this.orderService.getOrderDetail(params.id, req.user.userId);
  }

  @Post()
  create(@Body() createDto: CreateOrderDto, @Req() req: any) {
    return this.orderService.createOrder(createDto, req.user.userId);
  }

  @Put(':id')
  update(@Param() params: OrderIdDto, @Body() updateDto: UpdateOrderDto, @Req() req: any) {
    return this.orderService.updateOrder(params.id, updateDto, req.user.userId);
  }

  @Patch(':id/cancel')
  cancel(@Param() params: OrderIdDto, @Req() req: any) {
    return this.orderService.cancelOrder(params.id, req.user.userId);
  }
}

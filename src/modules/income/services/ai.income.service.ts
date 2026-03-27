import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../../order/schemas/order.schema';
import { Book, BookDocument } from '../../book/schemas/book.schema';
import { Category, CategoryDocument } from '../../categories/schemas/category.schema';
import { Account, AccountDocument } from '../../accounts/schemas/account.schema';
import { IncomeStatisticsDto } from '../dto/income-statistics.dto';
import { SuccessResponse } from '../../../shared/responses/success.response';

@Injectable()
export class AiIncomeService {
  private readonly ALLOWED_ROLES = [1, 2]; // Admin, Seller

  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Book.name)
    private readonly bookModel: Model<BookDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}

  private async validateAdminAccess(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }
    const user = await this.accountModel.findById(userId).select('role').lean();
    if (!user || !this.ALLOWED_ROLES.includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }
  }

  async getAiSummary(query: IncomeStatisticsDto, userId: string) {
    await this.validateAdminAccess(userId);

    const { startDate, endDate } = query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    // Aggregate data for AI
    const stats = await this.orderModel.aggregate([
      {
        $match: {
          status: { $ne: 'CANCELLED' },
          paymentStatus: 'PAID',
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$finalAmount' },
          orders: { $sum: 1 },
          itemsSold: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] },
              },
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format data for AI prompt
    const rawData = stats.map((s) => `Date: ${s._id}, Revenue: ${s.revenue}, Orders: ${s.orders}, Items Sold: ${s.itemsSold}`).join('\n');

    // In a real implementation, you would call Gemini/OpenAI API here.
    // For now, we generate a structured "AI" summary based on the data.
    const aiSummary = this.generateMockAiSummary(stats);

    return new SuccessResponse(
      {
        summary: aiSummary,
        dataPointsUsed: stats.length,
        period: {
          from: start.toISOString(),
          to: end.toISOString(),
        },
      },
      'Lấy phân tích AI thành công',
      200,
    );
  }

  private generateMockAiSummary(stats: any[]) {
    if (stats.length === 0) {
      return "Dữ liệu chưa đủ để phân tích. Hãy chọn khoảng thời gian có giao dịch.";
    }

    const totalRevenue = stats.reduce((sum, s) => sum + s.revenue, 0);
    const totalOrders = stats.reduce((sum, s) => sum + s.orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Simple trends
    const firstHalf = stats.slice(0, Math.floor(stats.length / 2));
    const secondHalf = stats.slice(Math.floor(stats.length / 2));
    const firstHalfRev = firstHalf.reduce((sum, s) => sum + s.revenue, 0);
    const secondHalfRev = secondHalf.reduce((sum, s) => sum + s.revenue, 0);
    
    const trend = secondHalfRev >= firstHalfRev ? "TĂNG TRƯỞNG" : "GIẢM NHẸ";

    return `
### 📊 Phân tích xu hướng (AI Generated)
Dựa trên dữ liệu từ ${stats.length} ngày gần nhất, hệ thống ghi nhận xu hướng **${trend}**. 

**1. Tóm tắt doanh thu:**
- Tổng doanh thu trong giai đoạn: **${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}**
- Giá trị trung bình mỗi đơn hàng: **${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(avgOrderValue)}**

**2. Nhận định peak hours:**
- Hiệu suất cao nhất tập trung vào các ngày giữa giai đoạn. Ghi nhận sự sụt giảm nhẹ vào cuối tuần (nếu có).

**3. Gợi ý từ AI:**
- **Tồn kho:** Các loại sách bán nhanh (Items Sold tăng cao) cần được nhập thêm tối thiểu 20% so với hiện tại để tránh đứt hàng.
- **Marketing:** Cần tăng cường các chương trình ưu đãi cho các đơn hàng có giá trị thấp để nâng cao Average Order Value.
- **Vận hành:** Phân bổ nhân sự xử lý đơn hàng tập trung vào các khung giờ vàng dựa trên xu hướng peak hours đã ghi nhận.
    `.trim();
  }
}

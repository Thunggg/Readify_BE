import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Supplier, SupplierDocument } from './schemas/supplier.schema';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SearchSupplierDto } from './dto/search-supplier.dto';

import { ApiResponse } from '../../shared/responses/api-response';
import { ErrorResponse } from '../../shared/responses/error.response';

@Injectable()
export class SupplierService {
  constructor(
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
  ) {}

  async getSupplierList(query: SearchSupplierDto) {
    const { q, isDeleted, page = 1, limit = 10 } = query;

    // PAGINATION - Phân trang
    const validPage = Math.max(1, page); // Đảm bảo page >= 1
    const validLimit = Math.min(50, Math.max(1, limit)); // Giới hạn limit từ 1-50 items/page
    const skip = (validPage - 1) * validLimit; // Số bản ghi cần bỏ qua

    // FILTER - Bộ lọc
    const filter: any = {};
    // Nếu muốn xem các supplier đã xóa
    if (isDeleted === true) filter.isDeleted = true;
    // Mặc định chỉ hiển thị supplier chưa bị xóa ($ne = not equal)
    else filter.isDeleted = { $ne: true };

    // TÌM KIẾM - Search logic
    if (q?.trim()) {
      // Tách chuỗi search thành các từ khóa riêng lẻ, tối đa 5 từ
      // VD: "abc xyz" => ["abc", "xyz"]
      const tokens = q.trim().split(/\s+/).filter(Boolean).slice(0, 5);

      // Escape các ký tự đặc biệt trong regex để tránh lỗi
      // VD: "a.b" => "a\\.b"
      const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // $and: TẤT CẢ các từ khóa phải xuất hiện (có thể ở các field khác nhau)
      filter.$and = tokens.map((t) => {
        const kw = escapeRegex(t);
        return {
          // $or: Từ khóa phải xuất hiện ở ÍT NHẤT 1 trong các field sau
          $or: [
            { name: { $regex: kw, $options: 'i' } }, // i = case-insensitive
            { contactName: { $regex: kw, $options: 'i' } },
            { email: { $regex: kw, $options: 'i' } },
            { phone: { $regex: kw, $options: 'i' } },
            { address: { $regex: kw, $options: 'i' } },
          ],
        };
      });
    }

    // SORT - Sắp xếp
    const sort: Record<string, 1 | -1> = {
      createdAt: -1, // -1 = giảm dần (mới nhất trước), 1 = tăng dần
      _id: 1, // Sắp xếp phụ theo _id để đảm bảo thứ tự ổn định
    };

    // QUERY - Thực hiện 2 query đồng thời để tăng performance
    // Promise.all chạy song song thay vì tuần tự
    const [items, total] = await Promise.all([
      this.supplierModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(validLimit)
        .select({
          name: 1,
          contactName: 1,
          email: 1,
          phone: 1,
          address: 1,
          bookIds: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .lean(),

      this.supplierModel.countDocuments(filter),
    ]);

    return ApiResponse.paginated(
      items,
      {
        page: validPage,
        limit: validLimit,
        total,
      },
      'Successfully retrieved the list of suppliers.',
    );
  }

  async getSupplierDetail(id: string) {
    // Kiểm tra id có đúng format ObjectId của MongoDB không
    // ObjectId có 24 ký tự hex (0-9, a-f)
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid supplier id');
    }

    const supplier = await this.supplierModel
      .findOne({
        _id: id,
        isDeleted: { $ne: true },
      })
      .select({
        name: 1,
        contactName: 1,
        email: 1,
        phone: 1,
        address: 1,
        bookIds: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean();

    if (!supplier) {
      throw new HttpException(ErrorResponse.notFound('Supplier not found'), HttpStatus.NOT_FOUND);
    }

    return ApiResponse.success(supplier, 'Successfully retrieved supplier details');
  }

  async createSupplier(dto: CreateSupplierDto) {
    // Kiểm tra email đã tồn tại chưa (nếu có nhập email)
    if (dto.email) {
      const email = dto.email.trim().toLowerCase(); // Chuẩn hóa email: xóa space, chuyển thường
      // exists() trả về true/false, nhanh hơn findOne()
      const isEmailExists = await this.supplierModel.exists({ email, isDeleted: { $ne: true } });
      if (isEmailExists) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'email', message: 'Email already exists' }]),
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const created = await this.supplierModel.create({
      name: dto.name?.trim(),
      contactName: dto.contactName?.trim(),
      email: dto.email?.trim().toLowerCase(),
      phone: dto.phone,
      address: dto.address,
      // Convert mảng string IDs thành mảng ObjectId để lưu vào MongoDB
      bookIds: dto.bookIds?.map((id) => new Types.ObjectId(id)),
    });

    const data = {
      _id: (created as any)._id,
      name: (created as any).name,
      contactName: (created as any).contactName,
      email: (created as any).email,
      phone: (created as any).phone,
      address: (created as any).address,
      bookIds: (created as any).bookIds,
      createdAt: (created as any).createdAt,
      updatedAt: (created as any).updatedAt,
    };

    return ApiResponse.success(data, 'Successfully created supplier');
  }

  async updateSupplier(id: string, dto: UpdateSupplierDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid supplier id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const supplier = await this.supplierModel.findById(id);
    if (!supplier) {
      throw new HttpException(ErrorResponse.notFound('Supplier not found'), HttpStatus.NOT_FOUND);
    }

    // Không cho phép update supplier đã bị xóa (soft delete)
    if (supplier.isDeleted === true) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Cannot update deleted supplier' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // VALIDATION EMAIL KHI UPDATE
    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      // Chỉ check trùng nếu email mới KHÁC email hiện tại
      // => Cho phép giữ nguyên email của chính supplier này
      if (email !== supplier.email?.toLowerCase()) {
        const exists = await this.supplierModel.exists({ email, isDeleted: { $ne: true } });
        if (exists) {
          throw new HttpException(
            ErrorResponse.validationError([{ field: 'email', message: 'Email already exists' }]),
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      supplier.email = email;
    }

    if (dto.name !== undefined) supplier.name = dto.name.trim();
    if (dto.contactName !== undefined) supplier.contactName = dto.contactName.trim();
    if (dto.phone !== undefined) supplier.phone = dto.phone;
    if (dto.address !== undefined) supplier.address = dto.address;
    if (dto.bookIds !== undefined) supplier.bookIds = dto.bookIds.map((id) => new Types.ObjectId(id)) as any;

    const saved = await supplier.save();

    const data = {
      _id: saved._id,
      name: saved.name,
      contactName: saved.contactName,
      email: saved.email,
      phone: saved.phone,
      address: saved.address,
      bookIds: saved.bookIds,
      createdAt: (saved as any).createdAt,
      updatedAt: (saved as any).updatedAt,
    };

    return ApiResponse.success(data, 'Successfully updated supplier');
  }

  async deleteSupplier(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid supplier id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const supplier = await this.supplierModel.findById(id);
    if (!supplier) {
      throw new HttpException(ErrorResponse.notFound('Supplier not found'), HttpStatus.NOT_FOUND);
    }

    if (supplier.isDeleted === true) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Supplier already deleted' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // SOFT DELETE - Xóa mềm (chỉ đánh dấu, không xóa khỏi database)
    // Lý do: Giữ lại dữ liệu để audit, có thể restore sau
    supplier.isDeleted = true;
    await supplier.save();

    return ApiResponse.success({ _id: id }, 'Successfully deleted supplier');
  }

  async restoreSupplier(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid supplier id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const supplier = await this.supplierModel.findById(id);
    if (!supplier) {
      throw new HttpException(ErrorResponse.notFound('Supplier not found'), HttpStatus.NOT_FOUND);
    }

    // Chỉ restore được supplier đã bị xóa
    if (supplier.isDeleted !== true) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Supplier is not deleted' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // RESTORE - Khôi phục supplier đã xóa
    supplier.isDeleted = false;
    await supplier.save();

    return ApiResponse.success({ _id: id }, 'Successfully restored supplier');
  }
}

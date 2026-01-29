import { Injectable, BadRequestException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, QueryFilter, Types } from 'mongoose';

import * as bcrypt from 'bcrypt';

import {
  AccountRole,
  AccountStaffRole,
  AccountStatus,
  StaffSortBy,
  SortOrder,
  Sex,
  StaffSortByValue,
  SortOrderValue,
  AccountStatusValue,
  AccountStaffRoleValue,
  SexValue,
} from './constants/staff.enum';

import { Account, AccountDocument } from '../accounts/schemas/account.schema';

export const STAFF_ROLES = [AccountRole.SELLER, AccountRole.WAREHOUSE] as const;

import { SearchStaffDto } from './dto/search-staff.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto';
import { UpdateStaffRoleDto } from './dto/update-staff-role.dto';

import { ErrorResponse } from '../../shared/responses/error.response';
import { PaginatedResponse } from '../../shared/responses/paginated.response';
import { SuccessResponse } from '../../shared/responses/success.response';
import { ConfigService } from '@nestjs/config';
import { hashPassword } from 'src/shared/utils/bcrypt';

// Hàm chuẩn hóa tên: loại bỏ khoảng trắng đầu cuối và gộp nhiều khoảng trắng thành một
function normalizeName(str: string) {
  return str
    .trim() // bỏ space đầu/cuối
    .replace(/\s+/g, ' '); // gộp mọi khoảng trắng thành 1
}

// Service quản lý nhân viên (staff) trong hệ thống
@Injectable()
export class StaffService {
  // Danh sách các vai trò của nhân viên (seller và warehouse)
  private readonly STAFF_ROLES: number[] = Object.values(AccountStaffRole);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}

  // Xây dựng bộ lọc cho truy vấn nhân viên dựa trên các tham số đầu vào
  private buildStaffFilter(param: {
    q?: string;
    status?: AccountStatusValue[];
    isDeleted?: boolean;
    sex?: SexValue[];
    role?: AccountStaffRoleValue[];
  }) {
    const { q, status, isDeleted, sex, role } = param;

    // Bộ lọc cơ bản: chỉ lấy tài khoản có vai trò là staff (seller hoặc warehouse), không phải admin
    const filter: QueryFilter<AccountDocument> = {
      role: {
        // Nếu client không truyền → mặc định là staff
        // Nếu truyền → chỉ lấy các role staff (2,3)
        $in: role?.length ? role : STAFF_ROLES,
        $ne: AccountRole.ADMIN,
      },
    };

    // ===== isDeleted =====
    // Nếu isDeleted là true, lấy các tài khoản đã xóa
    // Ngược lại, lấy các tài khoản chưa xóa (isDeleted != true)
    if (isDeleted === true) {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = { $ne: true };
    }

    // ===== status =====
    // Lọc theo trạng thái tài khoản nếu có
    if (status?.length) {
      filter.status = { $in: status };
    }

    // ===== sex =====
    // Lọc theo giới tính nếu có
    if (sex?.length) {
      filter.sex = { $in: sex };
    }

    // ===== search =====
    // Tìm kiếm theo từ khóa trong các trường: firstName, lastName, email, phone
    if (q) {
      const keywords = q.trim().split(/\s+/).filter(Boolean).slice(0, 5); // Tách từ khóa, tối đa 5 từ
      const fields = ['firstName', 'lastName', 'email', 'phone'] as const;

      // Sử dụng $and và $or để tìm kiếm với regex không phân biệt hoa thường
      filter.$and = keywords.map((kw) => ({
        $or: fields.map((f) => ({
          [f]: { $regex: kw, $options: 'i' },
        })),
      }));
    }

    return filter;
  }

  // Xây dựng stage sắp xếp cho aggregation pipeline
  private buildSortStage(sortBy: StaffSortByValue, order: SortOrderValue): PipelineStage {
    // Xác định hướng sắp xếp: 1 cho ASC, -1 cho DESC
    const dir = order === SortOrder.ASC ? 1 : -1;

    // Map các trường sắp xếp với hướng tương ứng
    const sortMap: Record<StaffSortByValue, Record<string, 1 | -1>> = {
      [StaffSortBy.CREATED_AT]: { createdAt: dir },
      [StaffSortBy.EMAIL]: { email: dir },
      [StaffSortBy.LAST_LOGIN_AT]: { lastLoginAt: dir },
      [StaffSortBy.DATE_OF_BIRTH]: { dateOfBirth: dir },
      [StaffSortBy.FULL_NAME]: { fullName: dir },
    };

    // Trả về stage $sort, mặc định sắp xếp theo createdAt DESC nếu không tìm thấy
    return { $sort: { ...(sortMap[sortBy] ?? { createdAt: -1 }), _id: 1 } };
  }

  // Xây dựng pipeline aggregation cho truy vấn danh sách nhân viên
  private buildAggregationPipeline(params: {
    filter: QueryFilter<AccountDocument>;
    sortBy: StaffSortByValue;
    order: SortOrderValue;
    skip: number;
    limit: number;
  }): PipelineStage[] {
    const { filter, sortBy, order, skip, limit } = params;

    // Khởi tạo pipeline với stage $match để lọc dữ liệu
    const pipeline: PipelineStage[] = [{ $match: filter }];

    // Nếu sắp xếp theo fullName, tạo trường ảo fullName bằng cách nối firstName và lastName
    if (sortBy === StaffSortBy.FULL_NAME) {
      // Thêm stage $addFields để tạo trường 'fullName' tạm thời cho việc sắp xếp
      pipeline.push({
        $addFields: {
          fullName: {
            // Sử dụng $trim để loại bỏ khoảng trắng đầu cuối của chuỗi kết quả
            $trim: {
              input: {
                // Nối firstName (hoặc chuỗi rỗng nếu null) với khoảng trắng và lastName (hoặc chuỗi rỗng nếu null)
                $concat: [{ $ifNull: ['$firstName', ''] }, ' ', { $ifNull: ['$lastName', ''] }],
              },
            },
          },
        },
      });
    }

    // Thêm stage sắp xếp
    pipeline.push(this.buildSortStage(sortBy, order));

    // Thêm stage phân trang: bỏ qua skip bản ghi và giới hạn limit
    pipeline.push({ $skip: skip }, { $limit: limit });

    return pipeline;
  }

  // Lấy danh sách nhân viên với phân trang, lọc và sắp xếp
  async getStaffList(query: SearchStaffDto) {
    // Giải nén các tham số từ query
    const {
      q,
      status,
      sex,
      role,
      isDeleted,
      sortBy = StaffSortBy.CREATED_AT, // Mặc định sắp xếp theo ngày tạo
      order = SortOrder.ASC, // Mặc định tăng dần
      page = 1, // Trang mặc định
      limit = 10, // Giới hạn mặc định
    } = query;

    // Xác thực và điều chỉnh page và limit
    const validPage = Math.max(1, page); // Đảm bảo page >= 1
    const validLimit = Math.min(50, Math.max(1, limit)); // Giới hạn limit từ 1 đến 50
    const skip = (validPage - 1) * validLimit; // Tính số bản ghi bỏ qua

    // Xây dựng bộ lọc dựa trên tham số
    const filter = this.buildStaffFilter({
      q,
      status,
      sex,
      isDeleted,
      role,
    });

    // Xây dựng pipeline aggregation
    const pipeline = this.buildAggregationPipeline({
      filter,
      sortBy,
      order,
      skip,
      limit: validLimit,
    });

    // Thực hiện truy vấn song song: lấy danh sách và tổng số
    const [items, total] = await Promise.all([
      this.accountModel.aggregate(pipeline),
      this.accountModel.countDocuments(filter),
    ]);

    // Trả về response phân trang
    return new PaginatedResponse(
      items,
      {
        page: validPage,
        limit: validLimit,
        total,
      },
      'Staff list retrieved successfully',
    );
  }

  // Lấy chi tiết thông tin của một nhân viên theo ID
  async getStaffDetail(id: string) {
    // Truy vấn nhân viên với các trường cần thiết, chỉ lấy staff role
    const staff = await this.accountModel
      .findOne({
        _id: id,
        role: { $in: this.STAFF_ROLES }, // Đảm bảo là staff
      })
      .select({
        firstName: 1,
        lastName: 1,
        dateOfBirth: 1,
        phone: 1,
        bio: 1,
        avatarUrl: 1,
        address: 1,
        email: 1,
        status: 1,
        role: 1,
        sex: 1,
        lastLoginAt: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean(); // Sử dụng lean để trả về plain object, tăng hiệu suất

    // Nếu không tìm thấy nhân viên, ném lỗi 404
    if (!staff) {
      throw new HttpException(ErrorResponse.notFound('Staff not found'), HttpStatus.NOT_FOUND);
    }

    // Trả về response thành công với dữ liệu nhân viên
    return new SuccessResponse(staff, 'Staff details retrieved successfully');
  }

  // Thêm mới một nhân viên
  async addStaff(dto: CreateStaffDto) {
    // Kiểm tra không cho phép tạo tài khoản admin
    if (dto.role === AccountRole.ADMIN) {
      throw new HttpException(
        ErrorResponse.validationError([
          {
            field: 'role',
            message: 'Cannot create admin account. Admin account can only be added directly to database',
          },
        ]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Chuẩn hóa email: loại bỏ khoảng trắng và chuyển về lowercase
    const email = dto.email.trim().toLowerCase();

    // Kiểm tra email đã tồn tại chưa
    const isEmailExists = await this.accountModel.exists({ email });
    if (isEmailExists) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'email', message: 'Email already exists' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Mã hóa mật khẩu
    const passwordHash = await hashPassword(dto.password, Number(this.configService.get<number>('bcrypt.saltRounds')));

    // Tạo tài khoản mới
    const created = await this.accountModel.create({
      firstName: normalizeName(dto.firstName), // Chuẩn hóa tên
      lastName: normalizeName(dto.lastName),
      dateOfBirth: dto.dateOfBirth,
      phone: dto.phone,
      avatarUrl: dto.avatarUrl,
      address: dto.address,
      email,
      password: passwordHash,
      role: dto.role,
      status: dto.status ?? AccountStatus.NOT_ACTIVE_EMAIL, // Mặc định chưa kích hoạt email
      sex: dto.sex ?? Sex.UNKNOWN, // Mặc định không xác định giới tính
      lastLoginAt: undefined, // Chưa đăng nhập lần nào
    });

    // Chuẩn bị dữ liệu trả về (loại bỏ thông tin nhạy cảm như password)
    const data = {
      _id: created._id,
      firstName: created.firstName,
      lastName: created.lastName,
      email: created.email,
      phone: created.phone,
      address: created.address,
      role: created.role,
      status: created.status,
      sex: created.sex,
      createdAt: (created as any).createdAt,
      updatedAt: (created as any).updatedAt,
    };

    // Trả về response thành công
    return new SuccessResponse(data, 'Staff created successfully');
  }

  // Chỉnh sửa thông tin nhân viên
  async editStaff(id: string, dto: UpdateStaffDto) {
    // Tìm nhân viên theo ID
    const staff = await this.accountModel.findById(id);
    if (!staff) {
      throw new HttpException(ErrorResponse.notFound('Staff not found'), HttpStatus.NOT_FOUND);
    }

    // Kiểm tra xem có phải là staff không
    if (!this.STAFF_ROLES.includes(staff.role)) {
      throw new HttpException(ErrorResponse.notFound('Account is not staff'), HttpStatus.NOT_FOUND);
    }

    // Không cho phép chỉnh sửa tài khoản admin
    if (staff.role === AccountRole.ADMIN) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Cannot edit admin account' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Kiểm tra không cho phép thay đổi role thành admin
    if (dto.role === AccountRole.ADMIN) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'role', message: 'Cannot change role to admin' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Xác thực email: kiểm tra trùng lặp nếu có thay đổi
    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      const exists = await this.accountModel.exists({ email, _id: { $ne: staff._id } });
      if (exists) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'email', message: 'Email already exists' }]),
          HttpStatus.BAD_REQUEST,
        );
      }
      staff.email = email;
    }

    // Cập nhật mật khẩu nếu có
    if (dto.password !== undefined) {
      staff.password = await hashPassword(dto.password, Number(this.configService.get<number>('bcrypt.saltRounds')));
    }

    // Cập nhật các trường khác nếu được cung cấp
    if (dto.firstName !== undefined) staff.firstName = normalizeName(dto.firstName);
    if (dto.lastName !== undefined) staff.lastName = normalizeName(dto.lastName);
    if (dto.dateOfBirth !== undefined) staff.dateOfBirth = dto.dateOfBirth;
    if (dto.phone !== undefined) staff.phone = dto.phone.trim();
    if (dto.avatarUrl !== undefined) staff.avatarUrl = dto.avatarUrl.trim();
    if (dto.address !== undefined) staff.address = dto.address.trim().replace(/\s+/g, ' ');
    if (dto.status !== undefined) staff.status = dto.status;
    if (dto.role !== undefined) staff.role = dto.role;
    if (dto.sex !== undefined) staff.sex = dto.sex;

    // Lưu thay đổi
    const saved = await staff.save();

    // Chuẩn bị dữ liệu trả về
    const data = {
      _id: saved._id,
      firstName: saved.firstName,
      lastName: saved.lastName,
      email: saved.email,
      phone: saved.phone,
      address: saved.address,
      role: saved.role,
      status: saved.status,
      sex: saved.sex,
      lastLoginAt: saved.lastLoginAt,
      createdAt: (saved as any).createdAt,
      updatedAt: (saved as any).updatedAt,
    };

    // Trả về response thành công
    return new SuccessResponse(data, 'Staff updated successfully');
  }

  // Xóa nhân viên (soft delete)
  async deleteStaff(id: string) {
    // Tìm nhân viên theo ID
    const staff = await this.accountModel.findById(id);
    if (!staff) {
      throw new HttpException(ErrorResponse.notFound('Staff not found'), HttpStatus.NOT_FOUND);
    }

    // Kiểm tra xem có phải là staff không
    if (!this.STAFF_ROLES.includes(staff.role)) {
      throw new HttpException(ErrorResponse.notFound('Account is not staff'), HttpStatus.NOT_FOUND);
    }

    // Không cho phép xóa tài khoản admin
    if (staff.role === AccountRole.ADMIN) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Cannot delete admin account' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Kiểm tra xem đã xóa chưa
    if (staff.isDeleted === true) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Staff already deleted' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Thực hiện soft delete: đánh dấu isDeleted = true và chuyển trạng thái thành INACTIVE
    staff.isDeleted = true;
    staff.status = AccountStatus.INACTIVE;
    await staff.save();

    // Trả về response thành công
    return new SuccessResponse({ _id: id }, 'Staff deleted successfully');
  }

  // Khôi phục nhân viên đã xóa
  async restoreStaff(id: string) {
    // Tìm nhân viên theo ID
    const staff = await this.accountModel.findById(id);
    if (!staff) {
      throw new HttpException(ErrorResponse.notFound('Staff not found'), HttpStatus.NOT_FOUND);
    }

    // Kiểm tra xem có phải là staff không
    if (!this.STAFF_ROLES.includes(staff.role)) {
      throw new HttpException(ErrorResponse.notFound('Account is not staff'), HttpStatus.NOT_FOUND);
    }

    // Không cho phép khôi phục tài khoản admin
    if (staff.role === AccountRole.ADMIN) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Cannot restore admin account' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Kiểm tra xem có bị xóa không
    if (staff.isDeleted !== true) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Staff is not deleted' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Khôi phục: đặt isDeleted = false và trạng thái thành ACTIVE
    staff.isDeleted = false;
    staff.status = AccountStatus.ACTIVE;
    await staff.save();

    // Trả về response thành công
    return new SuccessResponse({ _id: id }, 'Staff restored successfully');
  }

  // Cập nhật trạng thái của nhân viên
  async updateStaffStatus(id: string, dto: UpdateStaffStatusDto) {
    // Tìm nhân viên theo ID, loại trừ những tài khoản đã xóa
    const staff = await this.accountModel.findById(id);
    if (!staff || staff.isDeleted === true) {
      throw new HttpException(ErrorResponse.notFound('Staff not found'), HttpStatus.NOT_FOUND);
    }

    // Kiểm tra xem có phải là staff không
    if (!this.STAFF_ROLES.includes(staff.role)) {
      throw new HttpException(ErrorResponse.notFound('Account is not staff'), HttpStatus.NOT_FOUND);
    }

    // Không cho phép cập nhật trạng thái tài khoản admin
    if (staff.role === AccountRole.ADMIN) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Cannot update admin account status' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Cập nhật trạng thái
    staff.status = dto.status;
    await staff.save();

    // Trả về response thành công
    return new SuccessResponse({ _id: id, status: dto.status }, 'Staff status updated successfully');
  }

  // Cập nhật vai trò của nhân viên
  async updateStaffRole(id: string, dto: UpdateStaffRoleDto) {
    // Tìm nhân viên theo ID, loại trừ những tài khoản đã xóa
    const staff = await this.accountModel.findById(id);
    if (!staff || staff.isDeleted === true) {
      throw new HttpException(ErrorResponse.notFound('Staff not found'), HttpStatus.NOT_FOUND);
    }

    // Kiểm tra xem có phải là staff không
    if (!this.STAFF_ROLES.includes(staff.role)) {
      throw new HttpException(ErrorResponse.notFound('Account is not staff'), HttpStatus.NOT_FOUND);
    }

    // Không cho phép cập nhật vai trò tài khoản admin
    if (staff.role === AccountRole.ADMIN) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Cannot update admin account role' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Không cho phép thay đổi vai trò thành admin
    if (dto.role === AccountRole.ADMIN) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'role', message: 'Cannot change role to admin' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Cập nhật vai trò
    staff.role = dto.role;
    await staff.save();

    // Trả về response thành công
    return new SuccessResponse({ _id: id, role: dto.role }, 'Staff role updated successfully');
  }
}

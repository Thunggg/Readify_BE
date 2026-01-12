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
function normalizeName(str: string) {
  return str
    .trim() // bỏ space đầu/cuối
    .replace(/\s+/g, ' '); // gộp mọi khoảng trắng thành 1
}
@Injectable()
export class StaffService {
  private readonly STAFF_ROLES: number[] = Object.values(AccountStaffRole);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}

  private buildStaffFilter(param: {
    q?: string;
    status?: AccountStatusValue[];
    isDeleted?: boolean;
    sex?: SexValue[];
    role?: AccountStaffRoleValue[];
  }) {
    const { q, status, isDeleted, sex, role } = param;

    const filter: QueryFilter<AccountDocument> = {
      role: {
        // Nếu client không truyền → mặc định là staff
        // Nếu truyền → chỉ lấy các role staff (2,3)
        $in: role?.length ? role : STAFF_ROLES,
      },
    };

    // ===== isDeleted =====
    if (isDeleted === true) {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = { $ne: true };
    }

    // ===== status =====
    if (status?.length) {
      filter.status = { $in: status };
    }

    // ===== sex =====
    if (sex?.length) {
      filter.sex = { $in: sex };
    }

    // ===== search =====
    if (q) {
      const keywords = q.trim().split(/\s+/).filter(Boolean).slice(0, 5);
      const fields = ['firstName', 'lastName', 'email', 'phone'] as const;

      filter.$and = keywords.map((kw) => ({
        $or: fields.map((f) => ({
          [f]: { $regex: kw, $options: 'i' },
        })),
      }));
    }

    return filter;
  }
  private buildSortStage(sortBy: StaffSortByValue, order: SortOrderValue): PipelineStage {
    const dir = order === SortOrder.ASC ? 1 : -1;

    const sortMap: Record<StaffSortByValue, Record<string, 1 | -1>> = {
      [StaffSortBy.CREATED_AT]: { createdAt: dir },
      [StaffSortBy.EMAIL]: { email: dir },
      [StaffSortBy.LAST_LOGIN_AT]: { lastLoginAt: dir },
      [StaffSortBy.DATE_OF_BIRTH]: { dateOfBirth: dir },
      [StaffSortBy.FULL_NAME]: { fullName: dir },
    };

    return { $sort: { ...(sortMap[sortBy] ?? { createdAt: -1 }), _id: 1 } };
  }

  private buildAggregationPipeline(params: {
    filter: QueryFilter<AccountDocument>;
    sortBy: StaffSortByValue;
    order: SortOrderValue;
    skip: number;
    limit: number;
  }): PipelineStage[] {
    const { filter, sortBy, order, skip, limit } = params;

    const pipeline: PipelineStage[] = [{ $match: filter }];

    // Nếu sort theo fullName thì tạo field ảo
    if (sortBy === StaffSortBy.FULL_NAME) {
      pipeline.push({
        $addFields: {
          fullName: {
            $trim: {
              input: {
                $concat: [{ $ifNull: ['$firstName', ''] }, ' ', { $ifNull: ['$lastName', ''] }],
              },
            },
          },
        },
      });
    }

    pipeline.push(this.buildSortStage(sortBy, order));

    pipeline.push({ $skip: skip }, { $limit: limit });

    return pipeline;
  }

  async getStaffList(query: SearchStaffDto) {
    const {
      q,
      status,
      sex,
      role,
      isDeleted,
      sortBy = StaffSortBy.CREATED_AT,
      order = SortOrder.DESC,
      page = 1,
      limit = 10,
    } = query;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // Build filter
    const filter = this.buildStaffFilter({
      q,
      status,
      sex,
      isDeleted,
      role,
    });

    // Build pipeline
    const pipeline = this.buildAggregationPipeline({
      filter,
      sortBy,
      order,
      skip,
      limit: validLimit,
    });

    const [items, total] = await Promise.all([
      this.accountModel.aggregate(pipeline),
      this.accountModel.countDocuments(filter),
    ]);

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

  async getStaffDetail(id: string) {
    const staff = await this.accountModel
      .findOne({
        _id: id,
        role: { $in: this.STAFF_ROLES },
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
      .lean();

    if (!staff) {
      throw new HttpException(ErrorResponse.notFound('Staff not found'), HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(staff, 'Staff details retrieved successfully');
  }

  async addStaff(dto: CreateStaffDto) {
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

    const email = dto.email.trim().toLowerCase();

    const isEmailExists = await this.accountModel.exists({ email });
    if (isEmailExists) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'email', message: 'Email already exists' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Hash password
    const passwordHash = await hashPassword(dto.password, Number(this.configService.get<number>('bcrypt.saltRounds')));

    const created = await this.accountModel.create({
      firstName: normalizeName(dto.firstName),
      lastName: normalizeName(dto.lastName),
      dateOfBirth: dto.dateOfBirth,
      phone: dto.phone,
      avatarUrl: dto.avatarUrl,
      address: dto.address,
      email,
      password: passwordHash,
      role: dto.role,
      status: dto.status ?? AccountStatus.NOT_ACTIVE_EMAIL,
      sex: dto.sex ?? Sex.UNKNOWN,
      lastLoginAt: undefined,
    });

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

    return new SuccessResponse(data, 'Staff created successfully');
  }

  // Edit Staff
  async editStaff(id: string, dto: UpdateStaffDto) {
    const staff = await this.accountModel.findById(id);
    if (!staff) {
      throw new HttpException(ErrorResponse.notFound('Staff not found'), HttpStatus.NOT_FOUND);
    }

    if (!this.STAFF_ROLES.includes(staff.role)) {
      throw new HttpException(ErrorResponse.notFound('Account is not staff'), HttpStatus.NOT_FOUND);
    }

    if (staff.role === AccountRole.ADMIN) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Cannot edit admin account' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // role update validation
    if (dto.role === AccountRole.ADMIN) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'role', message: 'Cannot change role to admin' }]),
        HttpStatus.BAD_REQUEST,
      );
    }
    // email update validation
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

    // password update
    if (dto.password !== undefined) {
      staff.password = await hashPassword(dto.password, Number(this.configService.get<number>('bcrypt.saltRounds')));
    }

    if (dto.firstName !== undefined) staff.firstName = normalizeName(dto.firstName);
    if (dto.lastName !== undefined) staff.lastName = normalizeName(dto.lastName);
    if (dto.dateOfBirth !== undefined) staff.dateOfBirth = dto.dateOfBirth;
    if (dto.phone !== undefined) staff.phone = dto.phone.trim();
    if (dto.avatarUrl !== undefined) staff.avatarUrl = dto.avatarUrl.trim();
    if (dto.address !== undefined) staff.address = dto.address.trim().replace(/\s+/g, ' ');
    if (dto.status !== undefined) staff.status = dto.status;
    if (dto.role !== undefined) staff.role = dto.role;
    if (dto.sex !== undefined) staff.sex = dto.sex;

    const saved = await staff.save();

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

    return new SuccessResponse(data, 'Staff updated successfully');
  }

  // Delete Staff (soft delete)
  async deleteStaff(id: string) {
    const staff = await this.accountModel.findById(id);
    if (!staff) {
      throw new HttpException(ErrorResponse.notFound('Staff not found'), HttpStatus.NOT_FOUND);
    }

    if (!this.STAFF_ROLES.includes(staff.role)) {
      throw new HttpException(ErrorResponse.notFound('Account is not staff'), HttpStatus.NOT_FOUND);
    }

    if (staff.role === AccountRole.ADMIN) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Cannot delete admin account' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    if (staff.isDeleted === true) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Staff already deleted' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Soft delete
    staff.isDeleted = true;
    staff.status = AccountStatus.INACTIVE;
    await staff.save();

    return new SuccessResponse({ _id: id }, 'Staff deleted successfully');
  }

  async restoreStaff(id: string) {
    const staff = await this.accountModel.findById(id);
    if (!staff) {
      throw new HttpException(ErrorResponse.notFound('Staff not found'), HttpStatus.NOT_FOUND);
    }

    if (!this.STAFF_ROLES.includes(staff.role)) {
      throw new HttpException(ErrorResponse.notFound('Account is not staff'), HttpStatus.NOT_FOUND);
    }

    if (staff.role === AccountRole.ADMIN) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Cannot restore admin account' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    if (staff.isDeleted !== true) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Staff is not deleted' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    staff.isDeleted = false;
    staff.status = AccountStatus.ACTIVE;
    await staff.save();

    return new SuccessResponse({ _id: id }, 'Staff restored successfully');
  }

  async updateStaffStatus(id: string, dto: UpdateStaffStatusDto) {
    const staff = await this.accountModel.findById(id);
    if (!staff || staff.isDeleted === true) {
      throw new HttpException(ErrorResponse.notFound('Staff not found'), HttpStatus.NOT_FOUND);
    }

    if (!this.STAFF_ROLES.includes(staff.role)) {
      throw new HttpException(ErrorResponse.notFound('Account is not staff'), HttpStatus.NOT_FOUND);
    }

    if (staff.role === AccountRole.ADMIN) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Cannot update admin account status' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    staff.status = dto.status;
    await staff.save();

    return new SuccessResponse({ _id: id, status: dto.status }, 'Staff status updated successfully');
  }

  async updateStaffRole(id: string, dto: UpdateStaffRoleDto) {
    const staff = await this.accountModel.findById(id);
    if (!staff || staff.isDeleted === true) {
      throw new HttpException(ErrorResponse.notFound('Staff not found'), HttpStatus.NOT_FOUND);
    }

    if (!this.STAFF_ROLES.includes(staff.role)) {
      throw new HttpException(ErrorResponse.notFound('Account is not staff'), HttpStatus.NOT_FOUND);
    }

    if (staff.role === AccountRole.ADMIN) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Cannot update admin account role' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.role === AccountRole.ADMIN) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'role', message: 'Cannot change role to admin' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    staff.role = dto.role;
    await staff.save();

    return new SuccessResponse({ _id: id, role: dto.role }, 'Staff role updated successfully');
  }
}

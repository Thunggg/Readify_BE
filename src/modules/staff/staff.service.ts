import { Injectable, BadRequestException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import * as bcrypt from 'bcryptjs';

import { Account, AccountDocument } from '../accounts/schemas/account.schema';

import { SearchStaffDto } from './dto/search-staff.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

import { ApiResponse } from '../../shared/responses/api-response';
import { ErrorResponse } from '../../shared/responses/error.response';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}

  private STAFF_ROLES(): number[] {
    return [SearchStaffDto.AccountRole.ADMIN, SearchStaffDto.AccountRole.SELLER, SearchStaffDto.AccountRole.WAREHOUSE];
  }

  async getStaffList(query: SearchStaffDto) {
    const {
      q,
      status,
      role,
      sortBy = SearchStaffDto.StaffSortBy.CREATED_AT,
      order = SearchStaffDto.SortOrder.DESC,
      page = 1,
      limit = 10,
    } = query;

    // PAGINATION
    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // STAFF ROLES
    const STAFF_ROLES: number[] = [
      SearchStaffDto.AccountRole.ADMIN,
      SearchStaffDto.AccountRole.SELLER,
      SearchStaffDto.AccountRole.WAREHOUSE,
    ];

    // FILTER
    const filter: any = {
      role: { $in: STAFF_ROLES },
      status: { $ne: SearchStaffDto.AccountStatus.BANNED },
    };

    if (status !== undefined) {
      filter.status = status;
    }

    if (role !== undefined) {
      if (!STAFF_ROLES.includes(role)) {
        throw new BadRequestException('Invalid staff role');
      }
      filter.role = role;
    }

    if (q?.trim()) {
      // split by spaces, remove empty
      const tokens = q.trim().split(/\s+/).filter(Boolean).slice(0, 5);

      // escape regex special chars
      const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      filter.$and = tokens.map((t) => {
        const kw = escapeRegex(t);
        return {
          $or: [
            { firstName: { $regex: kw, $options: 'i' } },
            { lastName: { $regex: kw, $options: 'i' } },
            { email: { $regex: kw, $options: 'i' } },
            { phone: { $regex: kw, $options: 'i' } },
          ],
        };
      });
    }

    // SORT
    const sortMap: Record<string, any> = {
      createdAt: { createdAt: order === 'asc' ? 1 : -1 },
      email: { email: order === 'asc' ? 1 : -1 },
      firstName: {
        firstName: order === 'asc' ? 1 : -1,
        lastName: order === 'asc' ? 1 : -1,
      },
      lastName: {
        lastName: order === 'asc' ? 1 : -1,
        firstName: order === 'asc' ? 1 : -1,
      },
      lastLoginAt: { lastLoginAt: order === 'asc' ? 1 : -1 },
    };

    const sort = {
      ...(sortMap[sortBy] ?? { createdAt: -1 }),
      _id: 1,
    };

    // QUERY
    const [items, total] = await Promise.all([
      this.accountModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(validLimit)
        .select({
          firstName: 1,
          lastName: 1,
          email: 1,
          phone: 1,
          avatarUrl: 1,
          address: 1,
          dateOfBirth: 1,
          sex: 1,
          status: 1,
          role: 1,
          lastLoginAt: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .lean(),

      this.accountModel.countDocuments(filter),
    ]);

    return ApiResponse.paginated(
      items,
      {
        page: validPage,
        limit: validLimit,
        total,
      },
      'Lấy danh sách nhân viên thành công',
    );
  }

  async getStaffDetail(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid staff id');
    }

    const STAFF_ROLES: number[] = [
      SearchStaffDto.AccountRole.ADMIN,
      SearchStaffDto.AccountRole.SELLER,
      SearchStaffDto.AccountRole.WAREHOUSE,
    ];

    const staff = await this.accountModel
      .findOne({
        _id: id,
        role: { $in: STAFF_ROLES },
        status: { $ne: SearchStaffDto.AccountStatus.BANNED },
      })
      .select({
        firstName: 1,
        lastName: 1,
        dateOfBirth: 1,
        phone: 1,
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

    return ApiResponse.success(staff, 'Lấy chi tiết nhân viên thành công');
  }

  async addStaff(dto: CreateStaffDto) {
    const STAFF_ROLES = this.STAFF_ROLES();

    if (!STAFF_ROLES.includes(dto.role)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'role', message: 'Role is not a staff role' }]),
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
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.accountModel.create({
      firstName: dto.firstName?.trim(),
      lastName: dto.lastName?.trim(),
      dateOfBirth: dto.dateOfBirth,
      phone: dto.phone,
      avatarUrl: dto.avatarUrl,
      address: dto.address,
      email,
      password: passwordHash,
      role: dto.role,
      status: dto.status ?? SearchStaffDto.AccountStatus.ACTIVE,
      sex: dto.sex ?? 0,
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

    return ApiResponse.success(data, 'Tạo nhân viên thành công');
  }
}

import { Injectable, BadRequestException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import * as bcrypt from 'bcrypt';

import { AccountRole, AccountStatus, StaffSortBy, SortOrder } from './constants/staff.enum';

import { Account, AccountDocument } from '../accounts/schemas/account.schema';

import { SearchStaffDto } from './dto/search-staff.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto';
import { UpdateStaffRoleDto } from './dto/update-staff-role.dto';

import { ApiResponse } from '../../shared/responses/api-response';
import { ErrorResponse } from '../../shared/responses/error.response';
import { ConfigService } from '@nestjs/config';
import { hashPassword } from 'src/shared/utils/bcrypt';

@Injectable()
export class StaffService {
  private readonly STAFF_ROLES: number[] = [AccountRole.ADMIN, AccountRole.SELLER, AccountRole.WAREHOUSE];

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}

  async getStaffList(query: SearchStaffDto) {
    const {
      q,
      status,
      role,
      isDeleted,
      sortBy = StaffSortBy.CREATED_AT,
      order = SortOrder.DESC,
      page = 1,
      limit = 10,
    } = query;

    // PAGINATION
    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // FILTER
    const filter: any = {
      role: {
        $in: this.STAFF_ROLES,
        $ne: AccountRole.ADMIN,
      },
      status: { $ne: AccountStatus.BANNED },
    };
    
    if (isDeleted === true) filter.isDeleted = true;
    else filter.isDeleted = { $ne: true };

    if (status !== undefined) {
      filter.status = status;
    }

    if (role !== undefined) {
      if (!this.STAFF_ROLES.includes(role)) {
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
      'Staff list retrieved successfully',
    );
  }

  async getStaffDetail(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid staff id');
    }

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

    return ApiResponse.success(staff, 'Staff details retrieved successfully');
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

    if (!this.STAFF_ROLES.includes(dto.role)) {
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
    const passwordHash = await hashPassword(dto.password, Number(this.configService.get<number>('bcrypt.saltRounds')));

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
      status: dto.status ?? AccountStatus.ACTIVE,
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

    return ApiResponse.success(data, 'Staff created successfully');
  }

  // Edit Staff
  async editStaff(id: string, dto: UpdateStaffDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid staff id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

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

    if (dto.role !== undefined && !this.STAFF_ROLES.includes(dto.role)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'role', message: 'Role is not a staff role' }]),
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

    if (dto.firstName !== undefined) staff.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) staff.lastName = dto.lastName.trim();
    if (dto.dateOfBirth !== undefined) staff.dateOfBirth = dto.dateOfBirth;
    if (dto.phone !== undefined) staff.phone = dto.phone;
    if (dto.avatarUrl !== undefined) staff.avatarUrl = dto.avatarUrl;
    if (dto.address !== undefined) staff.address = dto.address;
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

    return ApiResponse.success(data, 'Staff updated successfully');
  }

  // Delete Staff (soft delete)
  async deleteStaff(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid staff id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

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
    await staff.save();

    return ApiResponse.success({ _id: id }, 'Staff deleted successfully');
  }

  async restoreStaff(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid staff id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

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
    await staff.save();

    return ApiResponse.success({ _id: id }, 'Staff restored successfully');
  }

  async updateStaffStatus(id: string, dto: UpdateStaffStatusDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid staff id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

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

    return ApiResponse.success({ _id: id, status: dto.status }, 'Staff status updated successfully');
  }

  async updateStaffRole(id: string, dto: UpdateStaffRoleDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid staff id' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

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

    if (!this.STAFF_ROLES.includes(dto.role)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'role', message: 'Role is not a staff role' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    staff.role = dto.role;
    await staff.save();

    return ApiResponse.success({ _id: id, role: dto.role }, 'Staff role updated successfully');
  }
}

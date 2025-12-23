import { Injectable, OnModuleInit, OnModuleDestroy, Logger, NotFoundException } from '@nestjs/common';
import { MongoClient, Collection, ObjectId } from 'mongodb';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SupplierService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private collection: Collection;
  private readonly logger = new Logger(SupplierService.name);

  async onModuleInit() {
    const uri = process.env.MONGODB_URI ?? process.env.DATABASE_URL ?? process.env.MONGO_URI;
    if (!uri) {
      this.logger.error('MONGODB_URI or DATABASE_URL or MONGO_URI not set');
      return;
    }
    this.client = new MongoClient(uri);
    await this.client.connect();
    this.collection = this.client.db().collection('suppliers');
    this.logger.log('Connected to MongoDB for suppliers');
  }

  async onModuleDestroy() {
    try {
      await this.client?.close();
    } catch {
      // ignore
    }
  }

  async create(dto: CreateSupplierDto) {
    const doc = { ...dto, delete_flag: false, createdAt: new Date() };
    const res = await this.collection.insertOne(doc);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return { _id: res.insertedId.toHexString(), ...doc };
  }

  async findAll(): Promise<any[]> {
    return this.collection.find({ delete_flag: { $ne: true } }).toArray();
  }

  async search(q: string | undefined, page = 1, limit = 10) {
    const filter: any = {};
    if (q && q.trim().length > 0) {
      const re = new RegExp(q.trim(), 'i');
      filter.$or = [{ name: re }, { contactName: re }, { email: re }, { phone: re }, { address: re }];
    }

    const skip = Math.max(0, page - 1) * limit;
    const [total, items] = await Promise.all([
      this.collection.countDocuments(filter),
      this.collection.find(filter).skip(skip).limit(limit).toArray(),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<any> {
    let _id: ObjectId;
    try {
      _id = new ObjectId(id);
    } catch {
      throw new NotFoundException('Invalid id');
    }
    const doc = await this.collection.findOne({ _id, delete_flag: { $ne: true } });
    if (!doc) throw new NotFoundException('Supplier not found');
    return doc;
  }

  async update(id: string, dto: UpdateSupplierDto) {
    let _id: ObjectId;
    try {
      _id = new ObjectId(id);
    } catch {
      throw new NotFoundException('Invalid id');
    }
    const res = await this.collection.findOneAndUpdate(
      { _id, delete_flag: { $ne: true } },
      { $set: { ...dto } },
      { returnDocument: 'after' },
    );
    if (!res.value) throw new NotFoundException('Supplier not found');
    return res.value;
  }

  async remove(id: string) {
    let _id: ObjectId;
    try {
      _id = new ObjectId(id);
    } catch {
      throw new NotFoundException('Invalid id');
    }
    const res = await this.collection.findOneAndUpdate(
      { _id, delete_flag: { $ne: true } },
      { $set: { delete_flag: true, deletedAt: new Date() } },
      { returnDocument: 'after' },
    );
    if (!res.value) throw new NotFoundException('Supplier not found');
    return { deleted: true };
  }
}

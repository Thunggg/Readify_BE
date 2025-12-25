import { Injectable, OnModuleInit, OnModuleDestroy, Logger, NotFoundException } from '@nestjs/common';
import { MongoClient, Collection, ObjectId } from 'mongodb';
import * as XLSX from 'xlsx';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ImportStockRowDto, ImportStockResultDto } from './dto/import-stock.dto';

@Injectable()
export class StockService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private collection: Collection;
  private readonly logger = new Logger(StockService.name);

  async onModuleInit() {
    const uri = process.env.MONGODB_URI ?? process.env.DATABASE_URL ?? process.env.MONGO_URI;
    if (!uri) {
      this.logger.error('MONGODB_URI or DATABASE_URL or MONGO_URI not set');
      return;
    }
    this.client = new MongoClient(uri);
    await this.client.connect();
    this.collection = this.client.db().collection('stocks');
    this.logger.log('Connected to MongoDB for stocks');
  }

  async onModuleDestroy() {
    try {
      await this.client?.close();
    } catch {
      // ignore
    }
  }

  async findAll(): Promise<any[]> {
    // return stocks joined with book info (if available) so frontend can show book title instead of raw id
    try {
      const pipeline = [
        {
          $lookup: {
            from: 'books',
            localField: 'bookId',
            foreignField: '_id',
            as: 'book',
          },
        },
        { $unwind: { path: '$book', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            bookId: 1,
            quantity: 1,
            location: 1,
            price: 1,
            batch: 1,
            lastUpdated: 1,
            status: 1,
            book: 1,
          },
        },
      ];
      return this.collection.aggregate(pipeline).toArray();
    } catch (err) {
      this.logger.error('Error aggregating stocks with books: ' + String(err));
      return this.collection.find().toArray();
    }
  }

  async findOne(id: string): Promise<any> {
    let _id: ObjectId;
    try {
      _id = new ObjectId(id);
    } catch {
      throw new NotFoundException('Invalid id');
    }
    const doc = await this.collection.findOne({ _id });
    if (!doc) throw new NotFoundException('Stock not found');
    // try to fetch related book info from `books` collection
    try {
      const booksColl = this.client.db().collection('books');
      let book: any = null;
      if (doc.bookId) {
        try {
          const bookId = typeof doc.bookId === 'string' ? new ObjectId(doc.bookId) : doc.bookId;
          book = await booksColl.findOne({ _id: bookId });
        } catch {
          // ignore lookup errors
        }
      }
      return { stock: doc, book };
    } catch (err) {
      return { stock: doc };
    }
  }

  async importStockFromExcel(buffer: Buffer): Promise<ImportStockResultDto> {
    const result: ImportStockResultDto = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Parse Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON with header mapping
      // Expected columns: ISBN, Quantity, Location, Price, Batch, Status
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rows.length === 0) {
        result.success = false;
        result.errors.push({ row: 0, message: 'File Excel trống hoặc không có dữ liệu' });
        return result;
      }

      const booksColl = this.client.db().collection('books');

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const rowNum = i + 2; // Excel row number (header is row 1)
        const row = rows[i];

        try {
          // Map Excel columns to DTO (flexible column names)
          const isbn = row['ISBN'] || row['isbn'] || row['Isbn'] || '';
          const quantity = parseFloat(row['Quantity'] || row['quantity'] || row['SoLuong'] || row['So Luong'] || 0);
          const location = row['Location'] || row['location'] || row['ViTri'] || row['Vi Tri'] || '';
          const price = parseFloat(row['Price'] || row['price'] || row['Gia'] || row['Giá'] || 0);
          const batch = row['Batch'] || row['batch'] || row['Lo'] || row['Lô'] || '';
          const status = row['Status'] || row['status'] || row['TrangThai'] || row['Trang Thai'] || 'available';

          // Validate data using DTO
          const stockDto = plainToInstance(ImportStockRowDto, {
            isbn,
            quantity,
            location,
            price,
            batch,
            status,
          });

          const validationErrors = await validate(stockDto);
          if (validationErrors.length > 0) {
            const errorMessages = validationErrors
              .map((err) => Object.values(err.constraints || {}).join(', '))
              .join('; ');
            result.failed++;
            result.errors.push({
              row: rowNum,
              isbn,
              message: `Validation failed: ${errorMessages}`,
            });
            continue;
          }

          // Find book by ISBN
          const book = await booksColl.findOne({ isbn });
          if (!book) {
            result.failed++;
            result.errors.push({
              row: rowNum,
              isbn,
              message: `Không tìm thấy sách với ISBN: ${isbn}`,
            });
            continue;
          }

          // Check if stock already exists for this book
          const existingStock = await this.collection.findOne({ bookId: book._id });

          if (existingStock) {
            // Update existing stock
            await this.collection.updateOne(
              { _id: existingStock._id },
              {
                $set: {
                  quantity: existingStock.quantity + quantity,
                  location: location || existingStock.location,
                  price: price || existingStock.price,
                  batch: batch || existingStock.batch,
                  status: status || existingStock.status,
                  lastUpdated: new Date().toISOString(),
                },
              },
            );
          } else {
            // Create new stock entry
            await this.collection.insertOne({
              bookId: book._id,
              quantity,
              location,
              price,
              batch,
              status,
              lastUpdated: new Date().toISOString(),
            });
          }

          result.imported++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            row: rowNum,
            isbn: row['ISBN'] || row['isbn'] || '',
            message: `Error: ${error.message}`,
          });
        }
      }

      result.success = result.imported > 0;
    } catch (error) {
      result.success = false;
      result.errors.push({
        row: 0,
        message: `Failed to process Excel file: ${error.message}`,
      });
    }

    return result;
  }
  async exportStockToExcel(): Promise<Buffer> {
    // Fetch all stocks with book information
    const stocks = await this.findAll();

    // Prepare data for Excel
    const excelData = stocks.map((stock) => ({
      ISBN: stock.book?.isbn || '',
      'Book Title': stock.book?.title || '',
      Author: stock.book?.author || '',
      Quantity: stock.quantity || 0,
      Location: stock.location || '',
      Price: stock.price || 0,
      Batch: stock.batch || '',
      Status: stock.status || '',
      'Last Updated': stock.lastUpdated || '',
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Data');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // ISBN
      { wch: 30 }, // Book Title
      { wch: 20 }, // Author
      { wch: 10 }, // Quantity
      { wch: 12 }, // Location
      { wch: 12 }, // Price
      { wch: 12 }, // Batch
      { wch: 12 }, // Status
      { wch: 20 }, // Last Updated
    ];

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer as Buffer;
  }
}

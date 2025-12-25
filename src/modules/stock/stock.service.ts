import { Injectable, BadRequestException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as XLSX from 'xlsx';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { Stock, StockDocument } from './schemas/stock.schema';
import { ImportStockRowDto, ImportStockResultDto } from './dto/import-stock.dto';
import { ApiResponse } from '../../shared/responses/api-response';
import { ErrorResponse } from '../../shared/responses/error.response';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    @InjectModel(Stock.name)
    private readonly stockModel: Model<StockDocument>,
  ) {}

  async getStockList() {
    // LẤY DANH SÁCH TỒN KHO kèm thông tin sách
    // Dùng aggregation thay vì populate vì Book model chưa được đăng ký
    try {
      const stocks = await this.stockModel.aggregate([
        {
          // $lookup: JOIN với collection 'books' (giống LEFT JOIN trong SQL)
          $lookup: {
            from: 'books', // Collection cần join
            localField: 'bookId', // Field trong stocks
            foreignField: '_id', // Field trong books
            as: 'book', // Tên field chứa kết quả join (mảng)
          },
        },
        // $unwind: Chuyển mảng book thành object (vì mỗi stock chỉ có 1 book)
        // preserveNullAndEmptyArrays: true => Giữ stock ngay cả khi không tìm thấy book
        { $unwind: { path: '$book', preserveNullAndEmptyArrays: true } },
        {
          // $project: Chọn các field cần trả về (1 = hiển thị, 0 = ẩn)
          $project: {
            bookId: 1,
            quantity: 1,
            location: 1,
            price: 1,
            batch: 1,
            lastUpdated: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            book: 1, // Thông tin sách từ $lookup
          },
        },
      ]);

      return ApiResponse.success(stocks, 'Lấy danh sách tồn kho thành công');
    } catch (err) {
      this.logger.error('Error fetching stock list: ' + String(err));
      throw new HttpException(
        new ErrorResponse('Failed to fetch stock list', 'INTERNAL_ERROR', 500),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getStockDetail(id: string) {
    // Kiểm tra id có đúng format ObjectId của MongoDB không
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid stock id');
    }

    try {
      const stocks = await this.stockModel.aggregate([
        // $match: Lọc document theo điều kiện (giống WHERE trong SQL)
        { $match: { _id: new Types.ObjectId(id) } },
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
            createdAt: 1,
            updatedAt: 1,
            book: 1,
          },
        },
      ]);

      if (!stocks || stocks.length === 0) {
        throw new HttpException(ErrorResponse.notFound('Stock not found'), HttpStatus.NOT_FOUND);
      }

      return ApiResponse.success(stocks[0], 'Lấy chi tiết tồn kho thành công');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error('Error fetching stock detail: ' + String(err));
      throw new HttpException(
        new ErrorResponse('Failed to fetch stock detail', 'INTERNAL_ERROR', 500),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      // ĐỌC FILE EXCEL
      const workbook = XLSX.read(buffer, { type: 'buffer' }); // Đọc buffer thành workbook
      const sheetName = workbook.SheetNames[0]; // Lấy tên sheet đầu tiên
      const worksheet = workbook.Sheets[sheetName]; // Lấy sheet theo tên

      // CHUYỂN ĐỔI EXCEL SANG JSON
      // Dòng đầu tiên của Excel sẽ là key của object
      // defval: '' => Ô trống sẽ có giá trị rỗng thay vì undefined
      // Expected columns: ISBN, Quantity, Location, Price, Batch, Status
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rows.length === 0) {
        result.success = false;
        result.errors.push({ row: 0, message: 'File Excel trống hoặc không có dữ liệu' });
        return result;
      }

      // Truy cập trực tiếp vào collection 'books' (không qua Mongoose model)
      // Lý do: Book schema chưa được refactor sang Mongoose, vẫn dùng MongoDB native
      const bookModel = this.stockModel.db.collection('books');

      // XỬ LÝ TỪNG DÒNG TRONG EXCEL
      for (let i = 0; i < rows.length; i++) {
        const rowNum = i + 2; // Số dòng trong Excel (i=0 là dòng 2 vì dòng 1 là header)
        const row = rows[i];

        try {
          // ĐỌC Dữ LIỆU TỪ EXCEL - Hỗ trợ nhiều tên cột (tiếng Anh/Việt, hoa/thường)
          const isbn = row['ISBN'] || row['isbn'] || row['Isbn'] || ''; // Mã ISBN
          const quantity = parseFloat(
            String(row['Quantity'] || row['quantity'] || row['SoLuong'] || row['So Luong'] || 0), // Số lượng
          );
          const location = row['Location'] || row['location'] || row['ViTri'] || row['Vi Tri'] || ''; // Vị trí
          const price = parseFloat(String(row['Price'] || row['price'] || row['Gia'] || row['Giá'] || 0)); // Giá
          const batch = row['Batch'] || row['batch'] || row['Lo'] || row['Lô'] || ''; // Số lô
          const status = row['Status'] || row['status'] || row['TrangThai'] || row['Trang Thai'] || 'available'; // Trạng thái

          // VALIDATE DỮ LIỆU với class-validator
          // plainToInstance: Chuyển plain object thành instance của class để validate
          const stockDto = plainToInstance(ImportStockRowDto, {
            isbn,
            quantity,
            location,
            price,
            batch,
            status,
          });

          // Kiểm tra lỗi validation (VD: isbn bắt buộc, quantity phải là số...)
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

          // TÌM SÁCH THEO ISBN trong database
          const book = await bookModel.findOne({ isbn });
          if (!book) {
            result.failed++;
            result.errors.push({
              row: rowNum,
              isbn,
              message: `Không tìm thấy sách với ISBN: ${isbn}`,
            });
            continue;
          }

          // KIỂM TRA stock đã tồn tại cho cuốn sách này chưa
          const existingStock = await this.stockModel.findOne({ bookId: book._id });

          if (existingStock) {
            // NẾU ĐÃ TỒN TẠI: Cộng thêm số lượng và cập nhật thông tin
            existingStock.quantity = existingStock.quantity + quantity; // Cộng dồn số lượng
            if (location) existingStock.location = location;
            if (price) existingStock.price = price;
            if (batch) existingStock.batch = batch;
            if (status) existingStock.status = status;
            existingStock.lastUpdated = new Date();
            await existingStock.save();
          } else {
            // NẾU CHƯA TỒN TẠI: Tạo mới stock entry
            await this.stockModel.create({
              bookId: book._id,
              quantity,
              location,
              price,
              batch,
              status,
              lastUpdated: new Date(),
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
    try {
      // LẤY TOÀN BỘ STOCK kèm thông tin sách để export
      // Dùng aggregation để join với books collection
      const stocks = await this.stockModel.aggregate([
        {
          $lookup: {
            from: 'books',
            localField: 'bookId',
            foreignField: '_id',
            as: 'book',
          },
        },
        { $unwind: { path: '$book', preserveNullAndEmptyArrays: true } },
      ]);

      // CHUẨN BỊ DỮ LIỆU CHO EXCEL
      // Map data sang format dễ đọc với tên cột rõ ràng
      const excelData = stocks.map((stock: any) => ({
        ISBN: stock.book?.isbn || '', // Mã ISBN từ book
        'Book Title': stock.book?.title || '', // Tên sách
        Author: stock.book?.author || '', // Tác giả
        Publisher: stock.book?.publisher || '', // Nhà xuất bản
        Quantity: stock.quantity || 0, // Số lượng tồn
        Location: stock.location || '', // Vị trí kho
        Price: stock.price || 0, // Giá
        Batch: stock.batch || '', // Số lô
        Status: stock.status || '', // Trạng thái
        'Last Updated': stock.lastUpdated || '', // Cập nhật lần cuối
      }));

      // TẠO FILE EXCEL
      const worksheet = XLSX.utils.json_to_sheet(excelData); // Chuyển JSON thành worksheet
      const workbook = XLSX.utils.book_new(); // Tạo workbook mới
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Data'); // Thêm worksheet vào workbook

      // ĐẶT ĐỘ RỘNG CỘT (wch = width in characters)
      worksheet['!cols'] = [
        { wch: 20 }, // ISBN - 20 ký tự
        { wch: 30 }, // Book Title - 30 ký tự (dài nhất)
        { wch: 20 }, // Author
        { wch: 20 }, // Publisher
        { wch: 10 }, // Quantity - ngắn hơn vì là số
        { wch: 12 }, // Location
        { wch: 12 }, // Price
        { wch: 12 }, // Batch
        { wch: 12 }, // Status
        { wch: 20 }, // Last Updated
      ];

      // TẠO BUFFER từ workbook để trả về cho client
      // type: 'buffer' => Tạo binary buffer thay vì file
      // bookType: 'xlsx' => Format Excel hiện đại (.xlsx)
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return buffer as Buffer;
    } catch (error) {
      this.logger.error('Error exporting stock to Excel: ' + String(error));
      throw new HttpException(
        new ErrorResponse('Failed to export stock data', 'INTERNAL_ERROR', 500),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

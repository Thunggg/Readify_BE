import { Injectable, BadRequestException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as XLSX from 'xlsx';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { Stock, StockDocument } from './schemas/stock.schema';
import { ImportStockRowDto, ImportStockResultDto } from './dto/import-stock.dto';
import { ErrorResponse } from '../../shared/responses/error.response';
import { SuccessResponse } from '../../shared/responses/success.response';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    @InjectModel(Stock.name)
    private readonly stockModel: Model<StockDocument>,
  ) {}

  async getStockList() {
    // LẤY DANH SÁCH TỒN KHO kèm thông tin sách
    try {
      const stocks = await this.stockModel
        .find()
        .populate('bookId') // Tự động join với collection books qua bookId
        .exec();

      return new SuccessResponse(stocks, 'Successfully fetched stock list');
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
      const stock = await this.stockModel
        .findById(id)
        .populate('bookId') // Tự động join với collection books
        .exec();

      if (!stock) {
        throw new HttpException(ErrorResponse.notFound('Stock not found'), HttpStatus.NOT_FOUND);
      }

      return new SuccessResponse(stock, 'Successfully fetched stock detail');
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error('Error fetching stock detail: ' + String(err));
      throw new HttpException(
        new ErrorResponse('Failed to fetch stock detail', 'INTERNAL_ERROR', 500),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Import stock data from Excel file buffer
  async importStockFromExcel(buffer: Buffer): Promise<ImportStockResultDto> {
    // Kết quả import ban đầu
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

      // KIỂM TRA FILE EXCEL CÓ DỮ LIỆU HAY KHÔNG
      if (rows.length === 0) {
        result.success = false;
        result.errors.push({ row: 0, message: 'Excel file is empty or contains no data' });
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

          // Nếu có lỗi validation, ghi nhận lỗi và chuyển sang dòng tiếp theo
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
            // Tiếp tục với dòng kế tiếp
            continue;
          }

          // TÌM SÁCH THEO ISBN trong database
          const book = await bookModel.findOne({ isbn });
          if (!book) {
            result.failed++;
            result.errors.push({
              row: rowNum,
              isbn,
              message: `Book not found with ISBN: ${isbn}`,
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
      const stocks = await this.stockModel
        .find()
        .populate('bookId') // Tự động join với collection books
        .exec();

      // CHUẨN BỊ DỮ LIỆU CHO EXCEL
      // Map data sang format dễ đọc với tên cột rõ ràng
      const excelData = stocks.map((stock: any) => ({
        ISBN: stock.bookId?.isbn || '', // Mã ISBN từ book
        'Book Title': stock.bookId?.title || '', // Tên sách
        Author: stock.bookId?.authors?.[0] || '', // Tác giả đầu tiên
        Publisher: stock.bookId?.publisherId || '', // Publisher ID
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

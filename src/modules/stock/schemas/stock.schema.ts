
import { plainToInstance } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

export class StockSchema {
	@IsOptional()
	@IsString()
	_id?: string;

	@IsString()
	bookId: string; // reference to books._id (string)

	@IsOptional()
	@IsNumber()
	quantity?: number;

	@IsOptional()
	@IsString()
	location?: string;

	@IsOptional()
	@IsNumber()
	price?: number;

	@IsOptional()
	@IsString()
	batch?: string;

	@IsOptional()
	@IsDateString()
	lastUpdated?: string;

	@IsOptional()
	@IsString()
	status?: string;
}

export function validateStock(obj: unknown): { valid: boolean; errors?: any[]; value?: StockSchema } {
	const inst = plainToInstance(StockSchema, obj);
	const errors = validateSync(inst, { whitelist: true, forbidNonWhitelisted: false });
	if (errors.length > 0) {
		const mapped = errors.map((e) => ({ property: e.property, constraints: e.constraints }));
		return { valid: false, errors: mapped };
	}
	return { valid: true, value: inst };
}

export type StockDocument = Omit<StockSchema, '_id'> & { _id?: string };

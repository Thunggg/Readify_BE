import { IsNotEmpty, IsString } from 'class-validator';

export class VnpayCallbackDto {
  @IsString()
  @IsNotEmpty()
  vnp_Amount: string;

  @IsString()
  @IsNotEmpty()
  vnp_BankCode: string;

  @IsString()
  @IsNotEmpty()
  vnp_BankTranNo: string;

  @IsString()
  @IsNotEmpty()
  vnp_CardType: string;

  @IsString()
  @IsNotEmpty()
  vnp_OrderInfo: string;

  @IsString()
  @IsNotEmpty()
  vnp_PayDate: string;

  @IsString()
  @IsNotEmpty()
  vnp_ResponseCode: string;

  @IsString()
  @IsNotEmpty()
  vnp_TmnCode: string;

  @IsString()
  @IsNotEmpty()
  vnp_TransactionNo: string;

  @IsString()
  @IsNotEmpty()
  vnp_TransactionStatus: string;

  @IsString()
  @IsNotEmpty()
  vnp_TxnRef: string;

  @IsString()
  @IsNotEmpty()
  vnp_SecureHash: string;
}


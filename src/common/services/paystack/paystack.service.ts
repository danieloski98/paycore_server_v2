import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface IPaystackBank {
  name: string;
  code: string;
  slug?: string;
  longcode?: string;
  active?: boolean;
}

export interface IPaystackValidatedBank {
  account_number: string;
  account_name: string;
  bank_id: number;
}

export interface IPaystackTransaction {
  id: number;
  status: string;
  reference: string;
  amount: number; // in kobo
  gateway_response?: string;
  paid_at?: string;
  channel?: string;
  currency?: string;
  customer?: { email?: string; id?: number };
  authorization_url?: string;
  access_code?: string;
}

@Injectable()
export class PaystackService implements OnModuleInit {
  private readonly logger = new Logger(PaystackService.name);
  private readonly baseUrl: string;
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('PAYSTACK_BASE_URL') ||
      'https://api.paystack.co';
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
  }

  async onModuleInit() {
    if (!this.secretKey) {
      this.logger.error(
        'PAYSTACK_SECRET_KEY is not configured. Please set it in environment.',
      );
    }
  }

  private getAuthHeaders() {
    if (!this.secretKey) {
      throw new InternalServerErrorException(
        'Paystack secret key not configured.',
      );
    }
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  public async getBanks(): Promise<PaystackResponse<IPaystackBank[]>> {
    try {
      const response = await axios.get<PaystackResponse<IPaystackBank[]>>(
        `${this.baseUrl}/bank?currency=NGN`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.data.status) {
        throw new Error(`Paystack get banks failed: ${response.data.message}`);
      }

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get banks', error?.response?.data);
      throw new BadRequestException(error?.response?.data ?? error?.message);
    }
  }

  public async validateBank({
    accountNumber,
    bankCode,
  }: {
    accountNumber: string;
    bankCode: string;
  }): Promise<PaystackResponse<IPaystackValidatedBank>> {
    try {
      const response = await axios.get<
        PaystackResponse<IPaystackValidatedBank>
      >(
        `${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.data.status) {
        throw new Error(
          `Paystack validate bank failed: ${response.data.message}`,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to validate bank details',
        error?.response?.data,
      );
      throw new BadRequestException(error?.response?.data ?? error?.message);
    }
  }

  public async validateTransaction(
    reference: string,
  ): Promise<PaystackResponse<IPaystackTransaction>> {
    try {
      const response = await axios.get<PaystackResponse<IPaystackTransaction>>(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.data.status) {
        throw new BadRequestException(
          `Paystack verify transaction failed: ${response.data.message}`,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.log(error?.message, error?.response?.data);
      this.logger.error('Failed to verify transaction', error?.response?.data);
      throw new BadRequestException(error?.response?.data ?? error?.message);
    }
  }

  public async initiateSingleTransfer(payload: {
    amount: number; // in naira
    reference: string;
    narration: string;
    destinationBankCode: string;
    destinationAccountNumber: string;
    currency?: 'NGN';
    sourceAccountNumber?: string; // not applicable for Paystack, kept for signature compatibility
    destinationAccountName: string;
    async?: boolean;
  }): Promise<PaystackResponse<unknown>> {
    try {
      // Create transfer recipient
      const recipientRes = await axios.post<
        PaystackResponse<{ recipient_code: string }>
      >(
        `${this.baseUrl}/transferrecipient`,
        {
          type: 'nuban',
          name: payload.destinationAccountName,
          account_number: payload.destinationAccountNumber,
          bank_code: payload.destinationBankCode,
          currency: payload.currency ?? 'NGN',
        },
        {
          headers: this.getAuthHeaders(),
        },
      );

      if (!recipientRes.data.status) {
        throw new Error(
          `Paystack create recipient failed: ${recipientRes.data.message}`,
        );
      }

      const recipientCode = recipientRes.data.data.recipient_code;

      // Initiate transfer
      const transferRes = await axios.post<PaystackResponse<unknown>>(
        `${this.baseUrl}/transfer`,
        {
          source: 'balance',
          amount: Math.round(payload.amount * 100), // convert naira to kobo
          recipient: recipientCode,
          reason: payload.narration,
          reference: payload.reference,
        },
        {
          headers: this.getAuthHeaders(),
        },
      );

      if (!transferRes.data.status) {
        throw new Error(
          `Paystack transfer failed: ${transferRes.data.message}`,
        );
      }

      return transferRes.data;
    } catch (error) {
      this.logger.error(
        'Failed to initiate single transfer',
        error?.response?.data ?? error?.message,
      );
      throw new BadRequestException(error?.response?.data ?? error?.message);
    }
  }

  public async createTransaction(payload: {
    amount: number; // in naira
    customerName: string;
    customerEmail: string;
    paymentReference: string;
    paymentDescription: string;
    currencyCode?: string;
    contractCode?: string; // not applicable to Paystack
    redirectUrl?: string;
    paymentMethods?: string[];
    incomeSplitConfig?: Array<{
      subAccountCode: string;
      feePercentage?: number;
      splitAmount?: number;
      feeBearer?: boolean;
    }>;
  }): Promise<
    PaystackResponse<{
      authorization_url: string;
      access_code: string;
      reference: string;
    }>
  > {
    try {
      const body: any = {
        amount: Math.round(payload.amount * 100), // convert naira to kobo
        email: payload.customerEmail,
        reference: payload.paymentReference,
        currency: payload.currencyCode ?? 'NGN',
        callback_url: payload.redirectUrl,
        metadata: {
          customerName: payload.customerName,
          paymentDescription: payload.paymentDescription,
          incomeSplitConfig: payload.incomeSplitConfig ?? [],
        },
      };

      if (payload.paymentMethods && payload.paymentMethods.length > 0) {
        body.channels = payload.paymentMethods;
      }

      const response = await axios.post<
        PaystackResponse<{
          authorization_url: string;
          access_code: string;
          reference: string;
        }>
      >(`${this.baseUrl}/transaction/initialize`, body, {
        headers: this.getAuthHeaders(),
      });

      if (!response.data.status) {
        throw new Error(
          `Paystack initialize transaction failed: ${response.data.message}`,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to create transaction',
        error?.response?.data ?? error?.message,
      );
      throw new InternalServerErrorException(
        error?.response?.data ?? error?.message,
      );
    }
  }
}

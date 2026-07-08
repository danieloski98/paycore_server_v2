import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import axios from 'axios';
import { IMonnifyBank } from './models/MonnifyBanks';
import { IMonnifyValidatedBank } from './models/MonnifyValidatedBankDetails';
import { IMonnifyTransaction } from './models/MonnifyValiateTransaction';

export interface MonnifyResponse<T> {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: T;
}

interface MonnifyAuthResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: {
    accessToken: string;
    expiresIn: number;
  };
}

@Injectable()
export class MonnifyService implements OnModuleInit {
  private readonly logger = new Logger(MonnifyService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly secretKey: string;

  // keys
  private TOKEN: string = 'TOKEN';
  private TTL: string = 'TTL';

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.baseUrl = this.configService.get<string>('MONNIFY_BASE_URL');
    this.apiKey = this.configService.get<string>('MONNIFY_API_KEY');
    this.secretKey = this.configService.get<string>('MONNIFY_SECRET_KEY');
  }

  async onModuleInit() {
    // Initialize by getting the first access token
    //await this.getAccessToken();
  }

  /**
   * Generate base64 encoded credentials for Monnify API
   * @returns Base64 encoded string of ApiKey:SecretKey
   */
  private generateBase64Credentials(): string {
    const credentials = `${this.apiKey}:${this.secretKey}`;
    return Buffer.from(credentials).toString('base64');
  }

  /**
   * Get access token from Monnify API
   * @returns The access token
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Check if we have a valid token
      let accessToken: string = await this.cacheManager.get(this.TOKEN);
      const ttl: string = await this.cacheManager.get(this.TTL);
      if (accessToken && ttl && Date.now() < parseInt(ttl)) {
        this.logger.error('CACHED TOKEN', accessToken);
        return accessToken;
      }

      // Generate base64 credentials
      const base64Credentials = this.generateBase64Credentials();
      this.logger.debug('BASE64 STRING => ', base64Credentials);

      // Make request to Monnify authentication endpoint
      const response = await axios.post<MonnifyAuthResponse>(
        `${this.baseUrl}/api/v1/auth/login`,
        {},
        {
          headers: {
            Authorization: `Basic ${base64Credentials}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data.requestSuccessful) {
        throw new Error(
          `Monnify authentication failed: ${response.data.responseMessage}`,
        );
      }

      this.logger.log(response?.data);

      // Store token and calculate expiration time
      this.cacheManager.set(
        this.TOKEN,
        response?.data?.responseBody?.accessToken,
      );
      this.cacheManager.set(
        this.TTL,
        Date.now() + response?.data?.responseBody?.expiresIn * 1000,
      );
      accessToken = response?.data?.responseBody?.accessToken;

      // Set up token expiration cleanup
      setTimeout(() => {
        this.clearAccessToken();
      }, response.data.responseBody.expiresIn * 1000);

      return accessToken;
    } catch (error) {
      this.logger.error(`Failed to get Monnify access token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear the stored access token
   */
  private clearAccessToken(): void {
    this.cacheManager.del(this.TOKEN);
    this.cacheManager.del(this.TTL);
  }

  public async getBanks(): Promise<MonnifyResponse<IMonnifyBank[]>> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get<MonnifyResponse<IMonnifyBank[]>>(
        `${this.baseUrl}/api/v1/banks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data.requestSuccessful) {
        throw new Error(
          `Monnify authentication failed: ${response.data.responseMessage}`,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get banks: ${error?.response?.data}`);
      throw new BadRequestException(error?.response?.data);
    }
  }

  public async validateBank({
    accountNumber,
    bankCode,
  }: {
    accountNumber: string;
    bankCode: string;
  }): Promise<MonnifyResponse<IMonnifyValidatedBank>> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get<MonnifyResponse<IMonnifyValidatedBank>>(
        `${this.baseUrl}/api/v1/disbursements/account/validate?accountNumber=${accountNumber}&bankCode=${bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data.requestSuccessful) {
        throw new Error(
          `Monnify authentication failed: ${response.data.responseMessage}`,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to validate bank details`,
        error?.response?.data,
      );
      throw new BadRequestException(error?.response?.data);
    }
  }

  public async validateTransaction(
    reference: string,
  ): Promise<MonnifyResponse<IMonnifyTransaction>> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get<MonnifyResponse<IMonnifyTransaction>>(
        `${this.baseUrl}/api/v1/transaction/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.error(response);

      if (!response.data.requestSuccessful) {
        throw new BadRequestException(
          `Monnify authentication failed: ${response.data.responseMessage}`,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to validate transaction`,
        error?.response?.data,
      );
      throw new BadRequestException(error?.response?.data);
    }
  }

  public async initiateSingleTransfer(payload: {
    amount: number;
    reference: string;
    narration: string;
    destinationBankCode: string;
    destinationAccountNumber: string;
    currency?: 'NGN';
    sourceAccountNumber?: string;
    destinationAccountName: string;
    async?: boolean;
  }): Promise<MonnifyResponse<unknown>> {
    try {
      const token = await this.getAccessToken();
      const body = {
        amount: payload.amount,
        reference: payload.reference,
        narration: payload.narration,
        destinationBankCode: payload.destinationBankCode,
        destinationAccountNumber: payload.destinationAccountNumber,
        currency: payload.currency ?? 'NGN',
        sourceAccountNumber:
          payload.sourceAccountNumber ??
          this.configService.get<string>('MONNIFY_SOURCE_ACCOUNT_NUMBER'),
        destinationAccountName: payload.destinationAccountName,
        async: payload.async ?? false,
      };

      if (!body.sourceAccountNumber) {
        throw new BadRequestException(
          'Monnify source account number is not configured. Please set MONNIFY_SOURCE_ACCOUNT_NUMBER in environment.',
        );
      }

      const response = await axios.post<MonnifyResponse<unknown>>(
        `${this.baseUrl}/api/v2/disbursements/single`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data.requestSuccessful) {
        throw new Error(
          `Monnify initiate transfer failed: ${response.data.responseMessage}`,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to initiate single transfer`,
        error?.response?.data ?? error?.message,
      );
      throw new BadRequestException(error?.response?.data ?? error?.message);
    }
  }

  public async createTransaction(payload: {
    amount: number;
    customerName: string;
    customerEmail: string;
    paymentReference: string;
    paymentDescription: string;
    currencyCode?: string;
    contractCode?: string;
    redirectUrl?: string;
    paymentMethods?: string[];
    incomeSplitConfig?: Array<{
      subAccountCode: string;
      feePercentage?: number;
      splitAmount?: number;
      feeBearer?: boolean;
    }>;
  }): Promise<
    MonnifyResponse<{
      transactionReference: string;
      paymentReference: string;
      merchantName: string;
      apiKey: string;
      enabledPaymentMethod: string[];
      checkoutUrl: string;
    }>
  > {
    try {
      const token = await this.getAccessToken();
      const body = {
        amount: payload.amount,
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        paymentReference: payload.paymentReference,
        paymentDescription: payload.paymentDescription,
        currencyCode: payload.currencyCode ?? 'NGN',
        contractCode:
          payload.contractCode ??
          this.configService.get<string>('MONNIFY_CONTRACT_CODE'),
        redirectUrl: payload.redirectUrl,
        paymentMethods: payload.paymentMethods ?? ['CARD', 'ACCOUNT_TRANSFER'],
        incomeSplitConfig: payload.incomeSplitConfig ?? [],
      };

      if (!body.contractCode) {
        throw new BadRequestException(
          'Monnify contract code is not configured. Please set MONNIFY_CONTRACT_CODE in environment.',
        );
      }

      const response = await axios.post<
        MonnifyResponse<{
          transactionReference: string;
          paymentReference: string;
          merchantName: string;
          apiKey: string;
          enabledPaymentMethod: string[];
          checkoutUrl: string;
        }>
      >(`${this.baseUrl}/api/v1/merchant/transactions/init-transaction`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.data.requestSuccessful) {
        throw new Error(
          `Monnify create transaction failed: ${response.data.responseMessage}`,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to create transaction`,
        error?.response?.data ?? error?.message,
      );
      throw new InternalServerErrorException(
        error?.response?.data ?? error?.message,
      );
    }
  }
}

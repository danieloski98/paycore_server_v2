export interface ITransactionSuccessful {
  transactionReference: string;
  paymentReference: string;
  amountPaid: string;
  totalPayable: string;
  settlementAmount: string;
  paidOn: string;
  paymentStatus: string;
  paymentDescription: string;
  currency: string;
  paymentMethod: string;
  product: {
    type: string;
    reference: string;
  };
  cardDetails: {
    cardType: string;
    last4: string;
    expMonth: string;
    expYear: string;
    bin: string;
    bankCode: string | null;
    bankName: string | null;
    reusable: boolean;
    countryCode: string | null;
    cardToken: string | null;
    supportsTokenization: boolean;
    maskedPan: string;
  };
  accountDetails: null;
  accountPayments: any[];
  customer: {
    email: string;
    name: string;
  };
  metaData: Record<string, any>;
}

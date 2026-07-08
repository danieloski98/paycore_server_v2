export class PaginatedResponse<T> {
  success: boolean = true;
  message: string;
  data: {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };

  constructor({
    success,
    message,
    data,
    total,
    totalPages,
    limit,
    page,
  }: {
    success: boolean;
    message: string;
    data: T[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  }) {
    this.success = success;
    this.message = message;
    this.data = {
      data,
      total,
      page,
      totalPages,
      limit,
    };
  }
}

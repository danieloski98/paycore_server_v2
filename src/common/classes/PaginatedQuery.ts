export class PaginatedQuery {
  page: number = 1;
  limit: number = 10;

  constructor(page: any, limit: any) {
    this.page = parseInt(String(page), 10) || 1;
    this.limit = parseInt(String(limit), 10) || 10;
  }
}

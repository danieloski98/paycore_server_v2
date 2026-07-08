export class PaginatedQuery {
  page: number = 1;
  limit: number = 10;

  constructor(page: number, limit: number) {
    this.page = page || 1;
    this.limit = limit || 10;
  }
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // 0-based current page from Spring Data
  size: number;
  first: boolean;
  last: boolean;
}

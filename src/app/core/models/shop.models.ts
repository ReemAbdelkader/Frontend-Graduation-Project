export interface ApiResponse<T> {
  succeeded: boolean;
  message?: string;
  data: T;
  errors?: string[];
  meta?: unknown;
}

export interface PaginatedResult<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  meta?: unknown;
  messages?: string[];
  succeeded: boolean;
}

export interface ProductDto {
  id: string;
  name: string;
  basePrice: number;
  categoryName: string;
  previewImageUrl: string;
  isAvailable: boolean;
  averageRating: number;
}

export interface ProductImageDto {
  id: string;
  productId: string;
  imageUrl: string;
  viewAngle?: number | null;
  printableZoneJson?: string | null;
  isPrimary: boolean;
  displayOrder: number;
}

export interface CategoryDto {
  id: string;
  name: string;
}

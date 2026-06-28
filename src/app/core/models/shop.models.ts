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

export interface PrintableZoneBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ProductImageDto {
  id: string;
  productId: string;
  imageUrl: string;
  viewAngle?: number | null;
  printableZoneJson?: string | null;
  printableZone?: PrintableZoneBounds | null;
  isPrimary: boolean;
  displayOrder: number;
}

export interface CategoryDto {
  id: string;
  name: string;
}


export interface NotificationItem {
  id: string;       
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

export interface OrderDetailItemDto {
  designId: string;
  designName: string;
  variationDetails: string;
  quantity: number;
  unitPrice: number;
  snapshotImageURL: string;
}

export interface OrderDto {
  orderId: string;         
  orderNumber: string;     
  placedDate: string;      
  estimatedDeliveryDate: string; 
  orderStatus: string;      
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;           
  trackingNumber?: string | null;
  orderItems: OrderDetailItemDto[];

  id?: string;              
  status?: string;
  eta?: string;
}

export interface AddToCartPayload {
  productId: string;
  designId?: string | null;
  quantity: number;
}

export interface CartItemDto {
  cartItemId: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  designId?: string | null;
  designSnapshotImageUrl?: string | null;
}

export interface CartDto {
  id: string;
  userId: string;
  items: CartItemDto[];
  totalCost: number;
  itemCount: number;
}
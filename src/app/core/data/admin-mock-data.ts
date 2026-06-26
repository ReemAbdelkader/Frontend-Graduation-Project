// ============================================================
// MOCK DATA for the Admin Control Center (no backend calls).
// Your team will replace these with real API calls later.
// ============================================================

export type AdminRole = 'Admin' | 'User' | 'Printer';
export type AdminStatus = 'active' | 'suspended';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  joinedAt: string;
  status: AdminStatus;
}

export interface MockOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
  createdAt: string;
}

export interface MockCategory {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export interface MockProduct {
  id: string;
  name: string;
  categoryName: string;
  basePrice: number;
  stock: number;
  imageUrl: string;
  isAvailable: boolean;
}

export interface MockTemplate {
  id: string;
  name: string;
  creatorName: string;
  categoryName: string;
  createdAt: string;
  isPublic: boolean;
  status: 'Published' | 'Draft' | 'Under Review';
  imageUrl: string;
  likesCount: number;
}

export type ModerationStatus = 'Pending' | 'Reviewed' | 'ActionTaken' | 'Dismissed';

export interface MockModerationReport {
  id: string;
  reporterName: string;
  templateName: string;
  templateId: string;
  reason: string;
  status: ModerationStatus;
  submittedAt: string;
  actionTaken?: string;
}

// ============ OVERVIEW ============

export const overviewStats = {
  totalUsers: 1240,
  totalOrders: 3892,
  totalRevenue: 284310,
  pendingOrders: 47,
  totalProducts: 186,
  totalTemplates: 312,
  publicTemplates: 289,
  pendingModerationReports: 14,
};

export const ordersByStatus: { status: string; count: number }[] = [
  { status: 'Pending', count: 47 },
  { status: 'Processing', count: 128 },
  { status: 'Shipped', count: 1842 },
  { status: 'Delivered', count: 1684 },
  { status: 'Cancelled', count: 142 },
  { status: 'Returned', count: 49 },
];

export const recentOrders: MockOrder[] = [
  { id: 'o1', orderNumber: 'WLY-2026-00498', customerName: 'Elena Asher',     totalAmount: 184, status: 'Processing', createdAt: '2026-06-02T10:30:00Z' },
  { id: 'o2', orderNumber: 'WLY-2026-00482', customerName: 'Aiko Tanaka',     totalAmount: 320, status: 'Shipped',    createdAt: '2026-06-01T14:15:00Z' },
  { id: 'o3', orderNumber: 'WLY-2026-00461', customerName: 'Marco Silva',     totalAmount: 142, status: 'Delivered',  createdAt: '2026-05-28T09:00:00Z' },
  { id: 'o4', orderNumber: 'WLY-2026-00450', customerName: 'Lena Park',       totalAmount:  88, status: 'Cancelled',  createdAt: '2026-05-26T16:45:00Z' },
  { id: 'o5', orderNumber: 'WLY-2026-00441', customerName: 'Sofia Renault',   totalAmount: 248, status: 'Delivered',  createdAt: '2026-05-24T11:20:00Z' },
];

// ============ USERS ============

export const mockUsers: MockUser[] = [
  { id: 'u1', name: 'Elena Asher',      email: 'elena@atelier.com',     role: 'User',    joinedAt: '2026-01-12', status: 'active' },
  { id: 'u2', name: 'Aiko Tanaka',      email: 'aiko.t@wearly.co',      role: 'User',    joinedAt: '2026-02-04', status: 'active' },
  { id: 'u3', name: 'Marco Silva',      email: 'marco@silva.io',        role: 'User',    joinedAt: '2026-02-18', status: 'active' },
  { id: 'u4', name: 'Lena Park',        email: 'lena.park@gmail.com',   role: 'User',    joinedAt: '2026-03-02', status: 'active' },
  { id: 'u5', name: 'Idris Bello',      email: 'idris.b@wearly.co',     role: 'User',    joinedAt: '2026-03-22', status: 'suspended' },
  { id: 'u6', name: 'Sofia Renault',    email: 's.renault@atelier.fr',  role: 'User',    joinedAt: '2026-04-10', status: 'active' },
  { id: 'u7', name: 'Atelier Admin',    email: 'admin@itigraduation.com', role: 'Admin',  joinedAt: '2026-01-01', status: 'active' },
  { id: 'u8', name: 'Porto Print Co.',  email: 'ops@porto-print.pt',    role: 'Printer', joinedAt: '2026-02-15', status: 'active' },
  { id: 'u9', name: 'Lisbon Atelier',   email: 'team@lisbonatelier.pt', role: 'Printer', joinedAt: '2026-03-08', status: 'active' },
];

// ============ ORDERS ============

export const mockOrders: MockOrder[] = [
  { id: 'o1', orderNumber: 'WLY-2026-00498', customerName: 'Elena Asher',     totalAmount: 184, status: 'Processing', createdAt: '2026-06-02T10:30:00Z' },
  { id: 'o2', orderNumber: 'WLY-2026-00482', customerName: 'Aiko Tanaka',     totalAmount: 320, status: 'Shipped',    createdAt: '2026-06-01T14:15:00Z' },
  { id: 'o3', orderNumber: 'WLY-2026-00461', customerName: 'Marco Silva',     totalAmount: 142, status: 'Delivered',  createdAt: '2026-05-28T09:00:00Z' },
  { id: 'o4', orderNumber: 'WLY-2026-00450', customerName: 'Lena Park',       totalAmount:  88, status: 'Cancelled',  createdAt: '2026-05-26T16:45:00Z' },
  { id: 'o5', orderNumber: 'WLY-2026-00441', customerName: 'Sofia Renault',   totalAmount: 248, status: 'Delivered',  createdAt: '2026-05-24T11:20:00Z' },
  { id: 'o6', orderNumber: 'WLY-2026-00433', customerName: 'Idris Bello',     totalAmount: 412, status: 'Returned',   createdAt: '2026-05-22T08:10:00Z' },
  { id: 'o7', orderNumber: 'WLY-2026-00420', customerName: 'Lin Park',        totalAmount: 156, status: 'Pending',    createdAt: '2026-05-20T13:00:00Z' },
  { id: 'o8', orderNumber: 'WLY-2026-00411', customerName: 'Theo Wren',       totalAmount:  98, status: 'Shipped',    createdAt: '2026-05-18T15:25:00Z' },
];

// ============ CATEGORIES ============

export const mockCategories: MockCategory[] = [
  { id: 'c1', name: 'T-Shirts',  description: 'Premium cotton tees — breathable, durable, made for everyday wear.', imageUrl: 'assets/garment-tshirt-black.jpg' },
  { id: 'c2', name: 'Hoodies',   description: 'Heavyweight fleece hoodies for layering and streetwear drops.',     imageUrl: 'assets/garment-hoodie-charcoal.jpg' },
  { id: 'c3', name: 'Pants',     description: 'Tailored trousers and relaxed fits in earthy tones.',               imageUrl: 'assets/garment-pants-olive.jpg' },
  { id: 'c4', name: 'Footwear',  description: 'Court sneakers and limited-run collaborations.',                    imageUrl: 'assets/garment-sneakers.jpg' },
  { id: 'c5', name: 'Headwear',  description: 'Six-panel caps and embroidered beanies.',                            imageUrl: 'assets/garment-cap-black.jpg' },
];

// ============ PRODUCTS ============

export const mockProducts: MockProduct[] = [
  { id: 'p1', name: 'Atelier Cotton Tee — Onyx',       categoryName: 'T-Shirts',  basePrice: 68,  stock: 240, imageUrl: 'assets/garment-tshirt-black.jpg',    isAvailable: true },
  { id: 'p2', name: 'Studio Crew Tee — Bone',          categoryName: 'T-Shirts',  basePrice: 62,  stock: 180, imageUrl: 'assets/garment-tshirt-white.jpg',    isAvailable: true },
  { id: 'p3', name: 'Heavyweight Hoodie — Charcoal',   categoryName: 'Hoodies',   basePrice: 148, stock: 95,  imageUrl: 'assets/garment-hoodie-charcoal.jpg', isAvailable: true },
  { id: 'p4', name: 'Brushed Fleece Hoodie — Cream',   categoryName: 'Hoodies',   basePrice: 138, stock: 0,   imageUrl: 'assets/garment-hoodie-cream.jpg',    isAvailable: false },
  { id: 'p5', name: 'Pleated Wide Trouser — Olive',    categoryName: 'Pants',     basePrice: 184, stock: 60,  imageUrl: 'assets/garment-pants-olive.jpg',     isAvailable: true },
  { id: 'p6', name: 'Court Sneaker — Violet Stripe',   categoryName: 'Footwear',  basePrice: 210, stock: 40,  imageUrl: 'assets/garment-sneakers.jpg',        isAvailable: true },
  { id: 'p7', name: 'Embroidered Six-Panel — Coral',   categoryName: 'Headwear',  basePrice: 58,  stock: 120, imageUrl: 'assets/garment-cap-black.jpg',       isAvailable: true },
  { id: 'p8', name: 'Botanic Print Tee — Moss',        categoryName: 'T-Shirts',  basePrice: 78,  stock: 75,  imageUrl: 'assets/template-botanical.jpg',      isAvailable: true },
  { id: 'p9', name: 'Prism Block Hoodie — Atelier',    categoryName: 'Hoodies',   basePrice: 168, stock: 50,  imageUrl: 'assets/template-geometric.jpg',      isAvailable: true },
];

// ============ TEMPLATES (read-only) ============

export const mockTemplates: MockTemplate[] = [
  { id: 't1', name: 'Verdant Folio',      creatorName: 'Maya Okafor',   categoryName: 'T-Shirts',  createdAt: '2026-05-12', isPublic: true,  status: 'Published',   imageUrl: 'assets/template-botanical.jpg',   likesCount: 246 },
  { id: 't2', name: 'Prism Field',        creatorName: 'Lin Park',      categoryName: 'Hoodies',   createdAt: '2026-05-08', isPublic: true,  status: 'Published',   imageUrl: 'assets/template-geometric.jpg',   likesCount: 318 },
  { id: 't3', name: 'Quiet Bone',         creatorName: 'Theo Wren',     categoryName: 'T-Shirts',  createdAt: '2026-04-29', isPublic: true,  status: 'Published',   imageUrl: 'assets/garment-tshirt-white.jpg', likesCount: 184 },
  { id: 't4', name: 'Onyx Studio',        creatorName: 'Marco Rivera',  categoryName: 'Hoodies',   createdAt: '2026-04-22', isPublic: true,  status: 'Published',   imageUrl: 'assets/garment-hoodie-charcoal.jpg', likesCount: 132 },
  { id: 't5', name: 'Coral Mark',         creatorName: 'Sana Bouchard', categoryName: 'Headwear',  createdAt: '2026-04-15', isPublic: true,  status: 'Published',   imageUrl: 'assets/garment-cap-black.jpg',    likesCount: 201 },
  { id: 't6', name: 'Olive Drift',        creatorName: 'Atelier AI',     categoryName: 'Pants',     createdAt: '2026-04-10', isPublic: true,  status: 'Published',   imageUrl: 'assets/garment-pants-olive.jpg',  likesCount: 156 },
  { id: 't7', name: 'Court Violet',       creatorName: 'Lin Park',      categoryName: 'Footwear',  createdAt: '2026-04-02', isPublic: true,  status: 'Published',   imageUrl: 'assets/garment-sneakers.jpg',     likesCount: 412 },
  { id: 't8', name: 'Sand Atelier (draft)', creatorName: 'Aiko Tanaka', categoryName: 'Hoodies',   createdAt: '2026-03-28', isPublic: false, status: 'Draft',       imageUrl: 'assets/garment-hoodie-cream.jpg', likesCount: 0 },
];

// ============ MODERATION REPORTS ============

export const mockModerationReports: MockModerationReport[] = [
  { id: 'r1', reporterName: 'Sofia Renault',  templateName: 'Prism Field',       templateId: 't2', reason: 'Contains imagery that may infringe on a third-party trademark.',           status: 'Pending',     submittedAt: '2026-06-01T09:15:00Z' },
  { id: 'r2', reporterName: 'Idris Bello',    templateName: 'Onyx Studio',       templateId: 't4', reason: 'Offensive text in the print design.',                                       status: 'Pending',     submittedAt: '2026-05-30T14:30:00Z' },
  { id: 'r3', reporterName: 'Lena Park',      templateName: 'Coral Mark',        templateId: 't5', reason: 'Misleading product description — claims limited edition but restocked.', status: 'Reviewed',    submittedAt: '2026-05-28T11:00:00Z' },
  { id: 'r4', reporterName: 'Marco Silva',    templateName: 'Verdant Folio',     templateId: 't1', reason: 'Botanical artwork appears copied from a stock photo without license.',    status: 'ActionTaken', submittedAt: '2026-05-25T16:45:00Z', actionTaken: 'Template removed from public feed; creator notified.' },
  { id: 'r5', reporterName: 'Aiko Tanaka',    templateName: 'Court Violet',      templateId: 't7', reason: 'Sneaker design resembles a competitor product too closely.',               status: 'Dismissed',   submittedAt: '2026-05-22T08:20:00Z', actionTaken: 'Reviewed — no trademark conflict found.' },
  { id: 'r6', reporterName: 'Theo Wren',      templateName: 'Sand Atelier',      templateId: 't8', reason: 'Draft leaked personal contact info in mockup.',                              status: 'Pending',     submittedAt: '2026-05-20T10:00:00Z' },
  { id: 'r7', reporterName: 'Sana Bouchard',  templateName: 'Olive Drift',       templateId: 't6', reason: 'Description mentions unauthorized collaboration.',                          status: 'Reviewed',    submittedAt: '2026-05-18T13:30:00Z' },
];

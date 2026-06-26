// Wearly data — ported from src/lib/wearly-data.ts

export type ProductCategory = string;

export type ProductBadge = 'BESTSELLER' | 'NEW' | 'LIMITED';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  rating: number;
  reviews?: number;
  image: string;
  colors: string[];
  badge?: ProductBadge;
  isAvailable?: boolean;
  galleryImages?: string[];
}

export interface Template {
  id: string;
  name: string;
  tags: string[];
  season: string;
  category: string;
  image: string;
  author: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  author: string;
  avatar: string;
  rating: number;
  ratings: number;
  comments: number;
  uses: number;
  image: string;
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  image: string;
  size: string;
}

export interface Order {
  id: string;
  placedDate: string;
  eta: string;
  status: 'SHIPPED' | 'DELIVERED' | 'PROCESSING';
  tracking: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  timeline: number;
}

export interface DashboardActivity {
  time: string;
  action: string;
  target: string;
}

const ASSETS = 'assets/';

export const garmentImages = {
  tshirtBlack: ASSETS + 'garment-tshirt-black.jpg',
  tshirtWhite: ASSETS + 'garment-tshirt-white.jpg',
  hoodieCharcoal: ASSETS + 'garment-hoodie-charcoal.jpg',
  hoodieCream: ASSETS + 'garment-hoodie-cream.jpg',
  pantsOlive: ASSETS + 'garment-pants-olive.jpg',
  sneakers: ASSETS + 'garment-sneakers.jpg',
  capBlack: ASSETS + 'garment-cap-black.jpg',
  templateBotanical: ASSETS + 'template-botanical.jpg',
  templateGeometric: ASSETS + 'template-geometric.jpg',
};

export const heroImage = ASSETS + 'hero-editorial.jpg';
export const shopBanner = ASSETS + 'shop-banner.jpg';
export const authImage = ASSETS + 'auth-editorial.jpg';
export const logoImage = ASSETS + 'wearly-logo.png';

export const products: Product[] = [
  {
    id: 'p1',
    name: 'Atelier Cotton Tee — Onyx',
    category: 'T-Shirts',
    price: 68,
    rating: 4.8,
    reviews: 412,
    image: garmentImages.tshirtBlack,
    colors: ['#1A1A2E', '#FAF8F5', '#7AA7D9'],
    badge: 'BESTSELLER',
  },
  {
    id: 'p2',
    name: 'Studio Crew Tee — Bone',
    category: 'T-Shirts',
    price: 62,
    rating: 4.7,
    reviews: 289,
    image: garmentImages.tshirtWhite,
    colors: ['#FAF8F5', '#1A1A2E', '#FF6B4A'],
  },
  {
    id: 'p3',
    name: 'Heavyweight Hoodie — Charcoal',
    category: 'Hoodies',
    price: 148,
    rating: 4.9,
    reviews: 736,
    image: garmentImages.hoodieCharcoal,
    colors: ['#1A1A2E', '#FAF8F5', '#556B2F'],
    badge: 'BESTSELLER',
  },
  {
    id: 'p4',
    name: 'Brushed Fleece Hoodie — Cream',
    category: 'Hoodies',
    price: 138,
    rating: 4.6,
    reviews: 204,
    image: garmentImages.hoodieCream,
    colors: ['#FAF8F5', '#1A1A2E', '#FF6B4A'],
    badge: 'NEW',
  },
  {
    id: 'p5',
    name: 'Pleated Wide Trouser — Olive',
    category: 'Pants',
    price: 184,
    rating: 4.7,
    reviews: 156,
    image: garmentImages.pantsOlive,
    colors: ['#556B2F', '#1A1A2E', '#FAF8F5'],
  },
  {
    id: 'p6',
    name: 'Court Sneaker — Violet Stripe',
    category: 'Footwear',
    price: 210,
    rating: 4.9,
    reviews: 938,
    image: garmentImages.sneakers,
    colors: ['#FAF8F5', '#7AA7D9', '#1A1A2E'],
    badge: 'BESTSELLER',
  },
  {
    id: 'p7',
    name: 'Embroidered Six-Panel — Coral',
    category: 'Headwear',
    price: 58,
    rating: 4.5,
    reviews: 312,
    image: garmentImages.capBlack,
    colors: ['#1A1A2E', '#FF6B4A', '#FAF8F5'],
    badge: 'NEW',
  },
  {
    id: 'p8',
    name: 'Botanic Print Tee — Moss',
    category: 'T-Shirts',
    price: 78,
    rating: 4.6,
    reviews: 98,
    image: garmentImages.templateBotanical,
    colors: ['#556B2F', '#FF6B4A', '#FAF8F5'],
    badge: 'LIMITED',
  },
  {
    id: 'p9',
    name: 'Prism Block Hoodie — Atelier',
    category: 'Hoodies',
    price: 168,
    rating: 4.8,
    reviews: 421,
    image: garmentImages.templateGeometric,
    colors: ['#7AA7D9', '#FF6B4A', '#00C9A7'],
    badge: 'LIMITED',
  },
];

export const templates: Template[] = [
  {
    id: 't1',
    name: 'Verdant Folio',
    tags: ['Botanical', 'Earthy'],
    season: 'SS 2026',
    category: 'T-Shirts',
    image: garmentImages.templateBotanical,
    author: 'Atelier AI',
  },
  {
    id: 't2',
    name: 'Prism Field',
    tags: ['Geometric', 'Abstract'],
    season: 'FW 2025',
    category: 'Hoodies',
    image: garmentImages.templateGeometric,
    author: 'Atelier AI',
  },
  {
    id: 't3',
    name: 'Quiet Bone',
    tags: ['Minimal', 'Essential'],
    season: 'SS 2026',
    category: 'T-Shirts',
    image: garmentImages.tshirtWhite,
    author: 'Maya Okafor',
  },
  {
    id: 't4',
    name: 'Onyx Studio',
    tags: ['Streetwear', 'Mono'],
    season: 'FW 2025',
    category: 'Hoodies',
    image: garmentImages.hoodieCharcoal,
    author: 'Atelier AI',
  },
  {
    id: 't5',
    name: 'Coral Mark',
    tags: ['Logomark', 'Bold'],
    season: 'SS 2026',
    category: 'Headwear',
    image: garmentImages.capBlack,
    author: 'Theo Wren',
  },
  {
    id: 't6',
    name: 'Olive Drift',
    tags: ['Tailored', 'Earthy'],
    season: 'FW 2025',
    category: 'Pants',
    image: garmentImages.pantsOlive,
    author: 'Atelier AI',
  },
  {
    id: 't7',
    name: 'Court Violet',
    tags: ['Sport', 'Statement'],
    season: 'SS 2026',
    category: 'Footwear',
    image: garmentImages.sneakers,
    author: 'Lin Park',
  },
  {
    id: 't8',
    name: 'Sand Atelier',
    tags: ['Soft', 'Editorial'],
    season: 'SS 2026',
    category: 'Hoodies',
    image: garmentImages.hoodieCream,
    author: 'Atelier AI',
  },
];

export const communityPosts: CommunityPost[] = [
  {
    id: 'c1',
    title: 'Prism Field — Remix 02',
    author: 'Lin Park',
    avatar: 'LP',
    rating: 4.9,
    ratings: 318,
    comments: 42,
    uses: 211,
    image: garmentImages.templateGeometric,
  },
  {
    id: 'c2',
    title: 'Verdant Folio Capsule',
    author: 'Maya Okafor',
    avatar: 'MO',
    rating: 4.8,
    ratings: 246,
    comments: 31,
    uses: 178,
    image: garmentImages.templateBotanical,
  },
  {
    id: 'c3',
    title: 'Atelier Cream Set',
    author: 'Theo Wren',
    avatar: 'TW',
    rating: 4.7,
    ratings: 184,
    comments: 22,
    uses: 134,
    image: garmentImages.hoodieCream,
  },
  {
    id: 'c4',
    title: 'Court Violet Editorial',
    author: 'Aiko Tanaka',
    avatar: 'AT',
    rating: 5.0,
    ratings: 412,
    comments: 58,
    uses: 289,
    image: garmentImages.sneakers,
  },
  {
    id: 'c5',
    title: 'Onyx Studio Tee',
    author: 'Marco Rivera',
    avatar: 'MR',
    rating: 4.6,
    ratings: 132,
    comments: 18,
    uses: 96,
    image: garmentImages.tshirtBlack,
  },
  {
    id: 'c6',
    title: 'Coral Mark Cap',
    author: 'Sana Bouchard',
    avatar: 'SB',
    rating: 4.8,
    ratings: 201,
    comments: 27,
    uses: 142,
    image: garmentImages.capBlack,
  },
];

export const orders: Order[] = [
  {
    id: 'WLY-2026-00482',
    placedDate: 'May 28, 2026',
    eta: 'Jun 4, 2026',
    status: 'SHIPPED',
    tracking: '1Z 999 AA1 0123 4567 89',
    items: [
      {
        name: 'Heavyweight Hoodie — Charcoal',
        qty: 1,
        price: 148,
        image: garmentImages.hoodieCharcoal,
        size: 'L',
      },
      {
        name: 'Embroidered Six-Panel — Coral',
        qty: 1,
        price: 58,
        image: garmentImages.capBlack,
        size: 'OS',
      },
    ],
    subtotal: 206,
    shipping: 0,
    tax: 16.48,
    total: 222.48,
    timeline: 3,
  },
  {
    id: 'WLY-2026-00471',
    placedDate: 'May 22, 2026',
    eta: 'May 30, 2026',
    status: 'DELIVERED',
    tracking: '1Z 999 AA1 0123 4561 02',
    items: [
      {
        name: 'Court Sneaker — Violet Stripe',
        qty: 1,
        price: 210,
        image: garmentImages.sneakers,
        size: '10',
      },
    ],
    subtotal: 210,
    shipping: 0,
    tax: 16.8,
    total: 226.8,
    timeline: 5,
  },
  {
    id: 'WLY-2026-00498',
    placedDate: 'Jun 1, 2026',
    eta: 'Jun 9, 2026',
    status: 'PROCESSING',
    tracking: 'Pending',
    items: [
      {
        name: 'Prism Block Hoodie — Atelier',
        qty: 1,
        price: 168,
        image: garmentImages.templateGeometric,
        size: 'M',
      },
      {
        name: 'Atelier Cotton Tee — Onyx',
        qty: 2,
        price: 68,
        image: garmentImages.tshirtBlack,
        size: 'M',
      },
    ],
    subtotal: 304,
    shipping: 0,
    tax: 24.32,
    total: 328.32,
    timeline: 1,
  },
];

export const dashboardActivity: DashboardActivity[] = [
  { time: '2h ago', action: 'Saved design', target: 'Prism Field — Remix 02' },
  { time: 'Yesterday', action: 'Order shipped', target: 'WLY-2026-00482' },
  { time: '2d ago', action: 'Published to community', target: 'Onyx Studio Tee' },
  { time: '4d ago', action: 'AI generated', target: 'Coral Mark Cap variant' },
];

export const topCreators = [
  { name: 'Aiko Tanaka', initials: 'AT', followers: '12.4k', trend: '+8%' },
  { name: 'Maya Okafor', initials: 'MO', followers: '9.8k', trend: '+12%' },
  { name: 'Theo Wren', initials: 'TW', followers: '7.2k', trend: '+4%' },
  { name: 'Lin Park', initials: 'LP', followers: '6.1k', trend: '+19%' },
  { name: 'Marco Rivera', initials: 'MR', followers: '4.3k', trend: '+6%' },
];

export const trendingTags = [
  { tag: '#PrismBlock', posts: 2.1 },
  { tag: '#OnyxStudio', posts: 1.8 },
  { tag: '#CoralMark', posts: 1.2 },
  { tag: '#VerdantFolio', posts: 0.9 },
  { tag: '#CourtViolet', posts: 0.7 },
];

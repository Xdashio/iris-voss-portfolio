export type ISODate = string;

export interface Category {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  /** Lucide icon name, resolved in components/shared/CategoryIcon */
  icon: string;
}

export interface ProductVariant {
  id: string;
  label: string;
  sku: string;
  price: number;
  stock: number;
  updatedAt: ISODate;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  categoryId: string;
  name: string;
  brand: string;
  description: string;
  /** Public URLs (/products/x.webp) or "idb:<key>" references to IndexedDB uploads */
  images: string[];
  published: boolean;
  featured: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
  /** True while the name/model was read from a photo and not yet confirmed by the owner */
  nameUnconfirmed?: boolean;
  variants: ProductVariant[];
}

export interface CartLine {
  productId: string;
  variantId: string;
  qty: number;
}

export type Fulfilment = "pickup" | "delivery";
export type PaymentMethod = "mpesa_till" | "mpesa_paybill" | "cash";
export type PaymentStatus = "pending" | "paid" | "failed" | "unpaid" | "refunded";

export type OrderStatus =
  | "placed"
  | "packed"
  | "out_for_delivery"
  | "ready_for_pickup"
  | "delivered"
  | "collected"
  | "cancelled";

export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  sku: string;
  image: string;
  unitPrice: number;
  qty: number;
}

export interface StatusEvent {
  status: OrderStatus;
  at: ISODate;
  by: string; // staff name or "Customer" / "System"
  note?: string;
}

export interface Order {
  id: string;
  number: string;
  /** Idempotency key from the checkout session; prevents double-submits */
  checkoutKey: string;
  createdAt: ISODate;
  customer: { name: string; phone: string; email?: string };
  items: OrderItem[];
  fulfilment: Fulfilment;
  zoneId?: string;
  zoneName?: string;
  deliveryNote?: string;
  deliveryFee: number;
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentRef?: string;
  paidAt?: ISODate;
  status: OrderStatus;
  history: StatusEvent[];
  /** Stock is deducted at placement; set once restored after cancellation */
  restocked: boolean;
}

export type PosPayment = "cash" | "mpesa";

export interface PosSale {
  id: string;
  receiptNo: string;
  createdAt: ISODate;
  cashierId: string;
  cashierName: string;
  items: OrderItem[];
  total: number;
  payment: PosPayment;
  tendered?: number;
  change?: number;
  mpesaRef?: string;
}

export type MovementType = "stock_in" | "stock_out" | "adjustment" | "online_sale" | "pos_sale" | "restock_cancel" | "opening";

export interface StockMovement {
  id: string;
  at: ISODate;
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  type: MovementType;
  change: number;
  before: number;
  after: number;
  reason: string;
  staffName: string;
  ref?: string;
}

export type Role = "owner" | "cashier" | "stock";

export interface Staff {
  id: string;
  name: string;
  username: string;
  pin: string;
  role: Role;
  active: boolean;
  phone?: string;
  createdAt: ISODate;
}

export interface DeliveryZone {
  id: string;
  name: string;
  areas: string;
  fee: number;
}

export interface Settings {
  shopName: string;
  tagline: string;
  logo?: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  tillNumber: string;
  paybillNumber: string;
  paybillAccountFormat: string;
  zones: DeliveryZone[];
  lowStockThreshold: number;
  currency: "KES";
}

export interface ActivityEntry {
  id: string;
  at: ISODate;
  actor: string;
  text: string;
  kind: "order" | "payment" | "stock" | "product" | "pos" | "staff" | "settings";
}

export interface AppState {
  version: number;
  seededAt: ISODate;
  products: Product[];
  categories: Category[];
  orders: Order[];
  posSales: PosSale[];
  movements: StockMovement[];
  staff: Staff[];
  settings: Settings;
  activity: ActivityEntry[];
  counters: { order: number; receipt: number };
}

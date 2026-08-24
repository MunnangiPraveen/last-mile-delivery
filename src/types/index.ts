// Role types
export type Role = 'CUSTOMER' | 'AGENT' | 'ADMIN';

// Order status lifecycle
export type OrderStatus = 'CREATED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';

// Order type
export type OrderType = 'B2B' | 'B2C';

// Payment type
export type PaymentType = 'PREPAID' | 'COD';

// Zone type for rate calculation
export type ZoneType = 'INTRA_ZONE' | 'INTER_ZONE';

// Agent availability
export type AgentAvailability = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

// Notification types
export type NotificationType =
  | 'ORDER_CREATED'
  | 'AGENT_ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'RESCHEDULED';

// Valid status transitions
export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ['PICKED_UP'],
  PICKED_UP: ['IN_TRANSIT'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: ['PICKED_UP'], // After reschedule, restart from PICKED_UP
};

// Status display labels
export const STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: 'Created',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
};

// Rate type labels
export const RATE_TYPE_LABELS: Record<string, string> = {
  B2B_INTRA_ZONE: 'B2B Intra-Zone',
  B2B_INTER_ZONE: 'B2B Inter-Zone',
  B2C_INTRA_ZONE: 'B2C Intra-Zone',
  B2C_INTER_ZONE: 'B2C Inter-Zone',
};

// Order creation input
export interface CreateOrderInput {
  pickupAddress: string;
  pickupPincode: string;
  dropAddress: string;
  dropPincode: string;
  length: number;
  breadth: number;
  height: number;
  actualWeight: number;
  orderType: OrderType;
  paymentType: PaymentType;
}

// Rate calculation result
export interface RateCalculationResult {
  pickupZoneId: string | null;
  pickupZoneName: string;
  dropZoneId: string | null;
  dropZoneName: string;
  orderType: OrderType;
  paymentType: PaymentType;
  actualWeight: number;
  volumetricWeight: number;
  billableWeight: number;
  rateType: string;
  ratePerKg: number;
  baseCharge: number;
  codSurcharge: number;
  totalCharge: number;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

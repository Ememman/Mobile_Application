// apiClient.ts - COMPLETE UPDATED VERSION WITH AVAILABILITY & STAFF FUNCTIONALITY
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  total?: number;
  category?: string;
  data: T;
  user?: {
    _id?: string;
    role?: string;
    isLoggedIn: boolean;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  profileImage: string;
  role: string;
  isGuest: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  delayActive?: boolean;
  remainingTime?: number;
  failedAttempts?: number;
  delaySeconds?: number;
  redirectTo?: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  resetToken?: string;
  expiresIn?: string;
  instructions?: string;
  cooldownRemaining?: number;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  passwordStrength?: {
    strength: string;
    color: string;
    score: number;
  };
}

// ==================== RATING INTERFACES ====================
export interface RatingBreakdown {
  [key: number]: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface RatingPercentages {
  [key: number]: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface Service {
  _id: string;
  name: string;
  duration: string;
  priceRange: string;
  rating: {
    average: number;
    totalRaters: number;
    breakdown: RatingBreakdown;
    percentages?: RatingPercentages;
  };
  totalBookings: number;
  category: string;
  isPromo: boolean;
  availability: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  totalRaters?: number;
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  rating: {
    average: number;
    totalRaters: number;
    breakdown: RatingBreakdown;
    percentages?: RatingPercentages;
  };
  inStock: boolean;
  description?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  _id: string;
  userId: string;
  serviceId: string;
  status: string;
  date: string;
  time: string;
  createdAt: string;
  updatedAt: string;
  serviceName: string;
  isRated?: boolean;
  rating?: string;
  canBeRated?: boolean;
}

export interface Stylist {
  _id: string;
  username: string;
  position: string;
  rating?: number;
  reviewCount?: number;
  topRated?: boolean;
  profileImage?: string;
}

// ==================== UPDATED BOOKING INTERFACE WITH DOWNPAYMENT ====================
export interface Booking {
  _id: string;
  customer: string | User;
  service: string | Service;
  stylistPreference: string;
  selectedStylist?: string | User;
  preferredDate: string;
  preferredTime: string;
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";

  // Payment fields
  paymentOption: "full" | "downpayment";
  downpaymentPercentage: number;
  servicePrice: number;
  discountApplied: number;
  totalAmount: number;
  downpaymentAmount: number;
  remainingAmount: number;
  amountPaid: number;
  paymentStatus:
    | "pending"
    | "downpayment_paid"
    | "fully_paid"
    | "overdue"
    | "refunded";
  refundableAmount: number;
  nonRefundableAmount: number;

  customerNotes?: string;
  isRated?: boolean;
  rating?: string;
  canBeRated?: boolean;
  cancellationReason?: string;
  cancelledAt?: string;

  // Refund fields
  refundStatus: "none" | "pending" | "processed" | "denied";
  refundAmount: number;
  refundProcessedAt?: string;
  refundProcessedBy?: string;

  // Payment references
  payments: string[];

  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  _id: string;
  userId: string;
  productId: Product | string;
  quantity: number;
  addedAt: string;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteItem {
  _id: string;
  userId: string;
  productId: Product;
  addedAt: string;
}

export interface UserBooking {
  _id: string;
  serviceId: {
    _id: string;
    name: string;
    category?: string;
    duration?: string;
    priceRange?: string;
  };
  customerName: string;
  preferredDate: string;
  preferredTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  selectedStylistId?: {
    _id: string;
    username: string;
  };
  createdAt: string;
  cancelledAt?: string;
  completedAt?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  totalAmount?: number;
  isRated?: boolean;
  rating?: string;
  canBeRated?: boolean;
}

// ==================== UPDATED PAYMENT INTERFACE WITH DOWNPAYMENT ====================
export interface Payment {
  _id: string;
  booking?: string;
  order?: string;
  customer: string;
  amount: number;
  paymentMethod: string;
  status: string;

  // Downpayment fields
  paymentFor: "full" | "downpayment" | "remaining";
  isDownpayment: boolean;

  qrCode?: {
    data: string;
    imageUrl?: string;
    expiresAt: Date;
  };
  paymentReference: string;
  proofOfPayment?: {
    imageUrl: string;
    uploadedAt: Date;
    fileName?: string;
    fileSize?: number;
    referenceNumber?: string;
    name?: string;
    amountPaid?: number;
    dateOfTransaction?: Date;
  };
  processingNotes?: string;

  // Auto-approval fields
  autoApproved?: boolean;
  autoApprovalReason?: string;
  verificationScore?: number;

  processedBy?: string;
  processedAt?: Date;

  // Refund fields
  refund?: {
    amount: number;
    reason: string;
    processedAt: Date;
    processedBy: string;
    refundReference: string;
    originalPayment?: string;
  };

  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface OrderItem {
  product: Product | string;
  quantity: number;
  price: number;
  subtotal: number;
  isRated?: boolean;
  rating?: string;
}

export interface Order {
  _id: string;
  customer: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  deliveryInfo: {
    type: "pickup" | "delivery";
    address?: string;
    contactNumber: string;
    specialInstructions?: string;
  };
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  payment?: string;
  paymentStatus?: string;
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
  isRated?: boolean;
  rating?: string;
  canBeRated?: boolean;
}

export interface RatingCategories {
  serviceQuality?: number;
  professionalism?: number;
  communication?: number;
  timeliness?: number;
  valueForMoney?: number;
}

export interface Rating {
  _id: string;
  rater: {
    _id: string;
    username: string;
    firstName: string;
    profileImage?: string;
  };
  ratedEntity: {
    type: "appointment" | "booking" | "order" | "staff" | "product" | "service";
    id: string;
  };
  ratedStaff?: {
    _id: string;
    username: string;
    firstName: string;
    profileImage?: string;
    position?: string;
  };
  ratedService?: {
    _id: string;
    name: string;
    category?: string;
  };
  ratedProduct?: {
    _id: string;
    name: string;
    category?: string;
    image?: string;
  };
  rating: number;
  comment?: string;
  categories?: RatingCategories;
  status: "active" | "flagged" | "removed";
  response?: {
    text?: string;
    respondedBy?: string;
    respondedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AverageRating {
  averageRating: number;
  totalRatings: number;
  breakdown: RatingBreakdown;
}

export interface StaffRating extends AverageRating {
  categoryAverages: {
    serviceQuality: number;
    professionalism: number;
    communication: number;
    timeliness: number;
  };
}

export interface SubmitRatingData {
  entityType:
    | "appointment"
    | "booking"
    | "order"
    | "staff"
    | "product"
    | "service";
  entityId: string;
  staffId?: string;
  serviceId?: string;
  productId?: string;
  rating: number;
  comment?: string;
  categories?: RatingCategories;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: any;
  delayActive?: boolean;
  remainingTime?: number;
  failedAttempts?: number;
  delaySeconds?: number;
  redirectTo?: string;
}

export interface UpdateRatingData {
  rating?: number;
  comment?: string;
  categories?: RatingCategories;
}

export interface RatingsResponse {
  success: boolean;
  data: {
    ratings: Rating[];
    averageRating?: AverageRating;
    staffRating?: StaffRating;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message?: string;
}

export interface RateableEntities {
  appointments: Appointment[];
  bookings: Booking[];
  orders: Order[];
  products: {
    orderId: string;
    orderNumber: string;
    product: Product;
    quantity: number;
    deliveredAt?: string;
  }[];
}

export interface ProductRatingsResponse {
  success: boolean;
  data: {
    product: {
      _id: string;
      name: string;
      rating: Product["rating"];
    };
    ratings: Rating[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface ServiceRatingsResponse {
  success: boolean;
  data: {
    service: {
      _id: string;
      name: string;
      rating: Service["rating"];
    };
    ratings: Rating[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface RatingStatsResponse {
  success: boolean;
  message: string;
  data?: Service | Product;
}

export interface RatingStatisticsResponse {
  success: boolean;
  data: {
    totalRatings: number;
    averageRating: number;
    ratingsByType: {
      _id: string;
      count: number;
      average: number;
    }[];
    recentRatings: Rating[];
    period: string;
  };
}

// ==================== ENHANCED RATING INTERFACES ====================
export interface EnhancedRating extends Rating {
  entityDetails?: {
    name: string;
    type: string;
    image?: string;
    category?: string;
  };
}

export interface RatingValidationResult {
  canRate: boolean;
  reason?: string;
  entity?: any;
  isProduct?: boolean;
  orderId?: string;
}

export interface BulkRatingUpdateResponse {
  success: boolean;
  message: string;
  updated: string[];
  failed: string[];
}

export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
}

export interface BookingStatsResponse {
  success: boolean;
  data: {
    period: {
      startDate: string;
      endDate: string;
    };
    stats: BookingStats;
  };
}

export interface StaffBookingsResponse {
  success: boolean;
  data: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ==================== NOTIFICATION INTERFACES ====================
export interface Notification {
  _id: string;
  user: string;
  type: string;
  title: string;
  message: string;
  data: any;
  relatedEntity?: {
    type: string;
    id: string;
  };
  isRead: boolean;
  priority: string;
  actionUrl?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  typeBreakdown: {
    [key: string]: number;
  };
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data: Notification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount?: number;
}

export interface NotificationStatsResponse {
  success: boolean;
  data: NotificationStats;
}

// ==================== DOWNPAYMENT INTERFACES ====================
export interface CreateBookingData {
  serviceId: string;
  stylistPreference: string;
  selectedStylistId?: string;
  preferredDate: string;
  preferredTime: string;
  customerNotes?: string;
  paymentOption?: "full" | "downpayment";
  downpaymentPercentage?: number;
}

export interface CreatePaymentData {
  bookingId?: string;
  orderId?: string;
  paymentMethod: string;
  paymentFor?: "full" | "downpayment" | "remaining";
}

export interface RefundDetails {
  refundAmount: number;
  nonRefundableAmount: number;
  refundStatus: string;
  note: string;
}

export interface BookingCancellationResponse {
  success: boolean;
  message: string;
  data: {
    booking: Booking;
    refundDetails: RefundDetails;
  };
}

// ==================== AVAILABILITY INTERFACES ====================
export interface AvailableSlotsResponse {
  success: boolean;
  availableSlots: string[];
  bookedSlots: string[];
  date: string;
  staffId?: string | null;
}

export interface StaffAvailabilityResponse {
  success: boolean;
  date: string;
  data: StaffAvailability[];
}

export interface StaffAvailability {
  staffId: string;
  staffName: string;
  profileImage: string;
  position: string;
  bookedSlots: string[];
  availableSlots: string[];
  availabilityPercentage: number;
}

export interface StaffAvailabilityCheckResponse {
  success: boolean;
  isAvailable: boolean;
  staffId: string;
  date: string;
  time: string;
}

export interface AvailableSlotsWithStaffResponse {
  success: boolean;
  availableSlots: string[];
  bookedSlots: string[];
  staffAvailableSlots: string[];
  staffUnavailableSlots: string[];
  date: string;
  staffId?: string | null;
}

const API_BASE_URL = "https://sandrealeesalon.onrender.com/api";

const convertTimeTo24HourFormat = (timeString: string): string => {
  console.log("⏰ Processing time for API:", timeString);

  try {
    let time = timeString.trim().toUpperCase();

    // If it's already in HH:MM format, return as is
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      return time;
    }

    // If it's already in HH:MM AM/PM format, return as is
    if (/^([01]?[0-9]):[0-5][0-9]\s+(AM|PM)$/.test(time)) {
      return time;
    }

    // Parse and format the time properly
    const match = time.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/i);
    if (!match) {
      console.warn("⚠️ Invalid time format, using default:", timeString);
      return "09:30 AM";
    }

    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const period = match[3].toUpperCase();

    // Format as HH:MM AM/PM (what the API expects)
    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedTime = `${formattedHours}:${formattedMinutes} ${period}`;

    console.log("✅ Time formatted for API:", timeString, "->", formattedTime);
    return formattedTime;
  } catch (error: any) {
    console.error("❌ Error processing time:", error);
    return "09:30 AM";
  }
};
const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      console.log("🔑 Token retrieved:", token.substring(0, 30) + "...");
    } else {
      console.log("⚠️ No token found in storage");
    }
    return token;
  } catch (error: any) {
    console.error("❌ Error retrieving token:", error);
    return null;
  }
};

const handleApiResponse = async (response: Response) => {
  let data;
  const responseText = await response.text();

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    console.error("❌ Failed to parse API response");
    console.log("📄 Raw response:", responseText);
    // Return a safe default instead of throwing
    return {
      success: false,
      message: "Invalid response from server",
      data: {},
    };
  }

  console.log("📡 API Response:", {
    status: response.status,
    ok: response.ok,
    success: data.success,
    message: data.message,
    data: data.data ? "present" : "missing",
  });

  if (!response.ok) {
    console.error("❌ API Error Response:", {
      status: response.status,
      statusText: response.statusText,
      data: data,
    });

    if (response.status === 401 || response.status === 403) {
      console.warn("⚠️ Authentication failed. Clearing session...");
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      // Return instead of throwing to prevent infinite loops
      return {
        success: false,
        message: "Authentication failed. Please login again.",
        data: {},
      };
    } else if (response.status === 400) {
      return {
        success: false,
        message: data.message || "Invalid request data",
        data: {},
      };
    } else if (response.status === 500) {
      return {
        success: false,
        message: data.message || "Server error. Please try again later.",
        data: {},
      };
    } else {
      return {
        success: false,
        message: data.message || `Request failed: ${response.status}`,
        data: {},
      };
    }
  }

  return data;
};

// ==================== DOWNPAYMENT UTILITY FUNCTIONS ====================

/**
 * Calculate payment amounts based on payment option
 */
export const calculatePaymentAmounts = (
  totalAmount: number,
  paymentOption: "full" | "downpayment" = "full",
  downpaymentPercentage: number = 30,
) => {
  let downpaymentAmount = 0;
  let remainingAmount = 0;
  let nonRefundableAmount = 0;
  let refundableAmount = totalAmount;

  if (paymentOption === "downpayment") {
    downpaymentAmount = Math.round((totalAmount * downpaymentPercentage) / 100);
    remainingAmount = totalAmount - downpaymentAmount;
    nonRefundableAmount = downpaymentAmount;
    refundableAmount = totalAmount - nonRefundableAmount;
  }

  return {
    downpaymentAmount,
    remainingAmount,
    nonRefundableAmount,
    refundableAmount,
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Get payment option display text
 */
export const getPaymentOptionDisplay = (
  paymentOption: "full" | "downpayment",
): string => {
  return paymentOption === "full" ? "Full Payment" : "30% Downpayment";
};

/**
 * Get refund policy explanation
 */
export const getRefundPolicyExplanation = (
  paymentOption: "full" | "downpayment",
): string => {
  if (paymentOption === "downpayment") {
    return "30% downpayment is non-refundable reservation fee. 70% is refundable if cancelled.";
  }
  return "Full payment is refundable based on cancellation policy.";
};

// ==================== ENHANCED RATING VALIDATION ====================

/**
 * Enhanced method to validate if an entity can be rated
 */
export const validateRatingEligibility = async (
  entityType: string,
  entityId: string,
  productId?: string,
): Promise<RatingValidationResult> => {
  try {
    console.log(`🔍 Validating rating eligibility:`, {
      entityType,
      entityId,
      productId,
    });

    // FIX: Validate entity ID format first
    if (!entityId || entityId === "my-ratings" || !isValidObjectId(entityId)) {
      console.log(`❌ Invalid entity ID format: ${entityId}`);
      return {
        canRate: false,
        reason: "Invalid entity ID format",
      };
    }

    // FIX: Validate product ID if provided
    if (
      productId &&
      (!isValidObjectId(productId) || productId === "my-ratings")
    ) {
      console.log(`❌ Invalid product ID format: ${productId}`);
      return {
        canRate: false,
        reason: "Invalid product ID format",
      };
    }

    const token = await getToken();
    if (!token) {
      return { canRate: false, reason: "Authentication required" };
    }

    let canRate = false;
    let entity: any = null;
    let isProduct = false;
    let orderId: string | undefined;
    let validationError: string | undefined;

    // FIX: Add try-catch for each entity type validation
    try {
      switch (entityType) {
        case "appointment":
          const appointment = await apiClient.getAppointmentById(entityId);
          entity = appointment.data;
          if (!entity) {
            validationError = "Appointment not found";
          } else {
            canRate = entity?.status === "completed" && !entity?.isRated;
            if (!canRate) {
              validationError =
                entity?.status !== "completed"
                  ? "Only completed appointments can be rated"
                  : "Appointment has already been rated";
            }
          }
          break;

        case "booking":
          const booking = await apiClient.getBookingById(entityId);
          entity = booking.data;
          if (!entity) {
            validationError = "Booking not found";
          } else {
            // FIX: Enhanced booking validation with detailed checks
            canRate = entity?.status === "completed" && !entity?.isRated;

            console.log(`📊 Booking rating validation:`, {
              bookingId: entityId,
              status: entity?.status,
              isRated: entity?.isRated,
              canRate: canRate,
              customerId: entity?.customer?._id || entity?.customer,
            });

            if (!canRate) {
              if (entity?.status !== "completed") {
                validationError = "Only completed bookings can be rated";
              } else if (entity?.isRated) {
                validationError = "Booking has already been rated";
              } else {
                validationError = "Booking cannot be rated at this time";
              }
            }
          }
          break;

        case "order":
          const order = await apiClient.getOrderById(entityId);
          entity = order.data;
          if (!entity) {
            validationError = "Order not found";
          } else {
            if (productId) {
              // Rating a specific product in the order
              canRate = await apiClient.canRateOrderProduct(
                entityId,
                productId,
              );
              isProduct = true;
              orderId = entityId;
              if (!canRate) {
                validationError = "Product in this order cannot be rated";
              }
            } else {
              // Rating the entire order
              canRate = entity?.status === "delivered" && !entity?.isRated;
              if (!canRate) {
                validationError =
                  entity?.status !== "delivered"
                    ? "Only delivered orders can be rated"
                    : "Order has already been rated";
              }
            }
          }
          break;

        case "product":
          // For standalone product ratings (not from order)
          const product = await apiClient.getProductById(entityId);
          entity = product.data;
          if (!entity) {
            validationError = "Product not found";
          } else {
            canRate = !!entity; // Allow rating any product
            isProduct = true;
          }
          break;

        case "service":
          const service = await apiClient.getServiceById(entityId);
          entity = service.data;
          if (!entity) {
            validationError = "Service not found";
          } else {
            canRate = !!entity; // Allow rating any service
          }
          break;

        case "staff":
          const staff = await apiClient.getUserById(entityId);
          entity = staff.data;
          if (!entity) {
            validationError = "Staff member not found";
          } else {
            canRate = !!entity && entity.role === "salon_staff";
            if (!canRate) {
              validationError = "User is not a staff member";
            }
          }
          break;

        default:
          return {
            canRate: false,
            reason: `Invalid entity type: ${entityType}`,
          };
      }
    } catch (fetchError: any) {
      console.error(`❌ Error fetching ${entityType}:`, fetchError);
      return {
        canRate: false,
        reason: `Error loading ${entityType} details: ${fetchError.message}`,
      };
    }

    if (!entity) {
      return {
        canRate: false,
        reason: validationError || `${entityType} not found`,
      };
    }

    // FIX: Enhanced check if user has already rated this entity
    if (canRate) {
      try {
        const hasRated = await apiClient.hasRatedEntity(
          entityType,
          entityId,
          productId,
        );

        console.log(`🔍 Existing rating check:`, {
          entityType,
          entityId,
          productId,
          hasRated,
        });

        if (hasRated) {
          canRate = false;
          validationError =
            "You have already rated this " +
            (isProduct ? "product" : entityType);
        }
      } catch (ratingCheckError: any) {
        console.warn("⚠️ Could not check existing rating:", ratingCheckError);
        // For rating check failures, we'll be permissive and allow rating
        // but log the issue for monitoring
        console.log("📝 Rating check failed, allowing rating submission...");
      }
    }

    // FIX: Provide detailed reason if cannot rate
    const reason = !canRate
      ? validationError || `This ${entityType} cannot be rated at this time`
      : undefined;

    console.log(`✅ Rating eligibility result:`, {
      entityType,
      entityId,
      canRate,
      reason,
      isProduct,
      orderId,
    });

    return {
      canRate,
      reason,
      entity,
      isProduct,
      orderId,
    };
  } catch (error: any) {
    console.error("❌ Error validating rating eligibility:", error);

    // FIX: Provide more specific error messages
    let errorMessage = error.message;
    if (error.message.includes("Network")) {
      errorMessage = "Network error. Please check your connection.";
    } else if (error.message.includes("401") || error.message.includes("403")) {
      errorMessage = "Authentication failed. Please login again.";
    } else if (error.message.includes("404")) {
      errorMessage = "Entity not found or you don't have access to it.";
    } else if (error.message.includes("Cast to ObjectId failed")) {
      errorMessage = "Invalid entity ID format.";
    }

    return {
      canRate: false,
      reason: errorMessage,
    };
  }
};

// FIX: Add ObjectId validation helper function
const isValidObjectId = (id: string): boolean => {
  if (!id || typeof id !== "string") return false;

  // Check for common invalid values
  if (id === "my-ratings" || id === "undefined" || id === "null") {
    return false;
  }

  // Standard MongoDB ObjectId format (24 hex characters)
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// FIX: Add helper function to validate and clean rating categories
const validateAndCleanRatingCategories = (
  categories?: RatingCategories,
): RatingCategories | undefined => {
  if (!categories) return undefined;

  const cleanedCategories: RatingCategories = {};

  // Validate each category value - ensure they are between 1 and 5
  if (categories.serviceQuality !== undefined) {
    cleanedCategories.serviceQuality = Math.max(
      1,
      Math.min(5, categories.serviceQuality),
    );
  }
  if (categories.professionalism !== undefined) {
    cleanedCategories.professionalism = Math.max(
      1,
      Math.min(5, categories.professionalism),
    );
  }
  if (categories.communication !== undefined) {
    cleanedCategories.communication = Math.max(
      1,
      Math.min(5, categories.communication),
    );
  }
  if (categories.timeliness !== undefined) {
    cleanedCategories.timeliness = Math.max(
      1,
      Math.min(5, categories.timeliness),
    );
  }
  if (categories.valueForMoney !== undefined) {
    cleanedCategories.valueForMoney = Math.max(
      1,
      Math.min(5, categories.valueForMoney),
    );
  }

  console.log("🧹 Cleaned rating categories:", cleanedCategories);
  return cleanedCategories;
};

export const apiClient = {
  // ==================== PROMO & DISCOUNT METHODS ====================
  validatePromo: async (
    code: string,
    amount: number = 0,
    targetType: "all" | "products" | "services" = "all"
  ): Promise<{
    success: boolean;
    message?: string;
    data?: {
      code: string;
      description: string;
      discountType: string;
      discountValue: number;
      discountAmount: number;
      originalAmount: number;
      finalAmount: number;
    };
  }> => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/promos/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code, amount, targetType }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, message: error.message || "Failed to validate promo" };
    }
  },

  getActivePromos: async (): Promise<ApiResponse<any[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/promos/active`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: [] };
    }
  },

  // ==================== RESCHEDULE BOOKING ====================
  rescheduleBooking: async (
    bookingId: string,
    preferredDate: string,
    preferredTime: string,
    reason?: string
  ): Promise<ApiResponse<Booking>> => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/reschedule`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ preferredDate, preferredTime, reason }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, message: error.message || "Failed to reschedule booking", data: null as any };
    }
  },
  // ==================== AVAILABILITY & STAFF METHODS ====================

  /**
   * Get available time slots for a specific date
   */
  /**
   * Get available time slots for a specific date - FIXED VERSION (No Infinite Loop)
   */
  getAvailableTimeSlots: async (
    date: string,
    staffId?: string,
  ): Promise<AvailableSlotsResponse> => {
    try {
      console.log(
        "⏰ [API] Fetching available time slots for:",
        date,
        "Staff:",
        staffId,
      );

      const token = await getToken();

      let url = `${API_BASE_URL}/bookings/available-slots/${date}`;

      if (staffId && staffId !== "undefined" && staffId !== "null") {
        url += `?staffId=${staffId}`;
      }

      console.log("🌐 [API] Calling URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      // Handle 404 gracefully by providing default slots
      if (response.status === 404) {
        console.warn(
          "⚠️ [API] Available time slots route not found. Using default slots.",
        );
        return {
          success: true,
          availableSlots: [
            "09:30 AM",
            "10:00 AM",
            "10:30 AM",
            "11:00 AM",
            "11:30 AM",
            "12:00 PM",
            "12:30 PM",
            "01:00 PM",
            "01:30 PM",
            "02:00 PM",
            "02:30 PM",
            "03:00 PM",
            "03:30 PM",
            "04:00 PM",
            "04:30 PM",
            "05:00 PM",
            "05:30 PM",
            "06:00 PM",
            "06:30 PM",
            "07:00 PM",
            "07:30 PM",
            "08:00 PM",
            "08:30 PM",
          ],
          bookedSlots: [],
          date: date,
          staffId: staffId || null,
        };
      }

      // Handle other non-200 responses
      if (!response.ok) {
        console.warn(
          `⚠️ [API] Available slots endpoint returned ${response.status}. Using default slots.`,
        );
        return {
          success: true,
          availableSlots: [
            "09:30 AM",
            "10:00 AM",
            "10:30 AM",
            "11:00 AM",
            "11:30 AM",
            "12:00 PM",
            "12:30 PM",
            "01:00 PM",
            "01:30 PM",
            "02:00 PM",
            "02:30 PM",
            "03:00 PM",
            "03:30 PM",
            "04:00 PM",
            "04:30 PM",
            "05:00 PM",
            "05:30 PM",
            "06:00 PM",
            "06:30 PM",
            "07:00 PM",
            "07:30 PM",
            "08:00 PM",
            "08:30 PM",
          ],
          bookedSlots: [],
          date: date,
          staffId: staffId || null,
        };
      }

      const data = await handleApiResponse(response);
      console.log(
        "✅ [API] Available slots fetched:",
        data.availableSlots?.length || 0,
      );
      return data;
    } catch (error: any) {
      console.error(
        "❌ [API] Error fetching available time slots:",
        error.message,
      );
      // Return default slots as fallback without throwing error
      return {
        success: true,
        availableSlots: [
          "09:30 AM",
          "10:00 AM",
          "10:30 AM",
          "11:00 AM",
          "11:30 AM",
          "12:00 PM",
          "12:30 PM",
          "01:00 PM",
          "01:30 PM",
          "02:00 PM",
          "02:30 PM",
          "03:00 PM",
          "03:30 PM",
          "04:00 PM",
          "04:30 PM",
          "05:00 PM",
          "05:30 PM",
          "06:00 PM",
          "06:30 PM",
          "07:00 PM",
          "07:30 PM",
          "08:00 PM",
          "08:30 PM",
        ],
        bookedSlots: [],
        date: date,
        staffId: staffId || null,
      };
    }
  },

  /**
   * Get available time slots with staff consideration
   */
  getAvailableSlotsWithStaff: async (
    date: string,
    staffId?: string,
  ): Promise<AvailableSlotsWithStaffResponse> => {
    try {
      console.log(
        "⏰ Fetching available slots with staff consideration for:",
        date,
        "Staff:",
        staffId,
      );

      const token = await getToken();

      let url = `${API_BASE_URL}/bookings/available-slots-with-staff/${date}`;

      if (staffId && staffId !== "undefined" && staffId !== "null") {
        url += `?staffId=${staffId}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Available slots with staff fetched:", {
        allAvailable: data.availableSlots?.length || 0,
        staffAvailable: data.staffAvailableSlots?.length || 0,
        staffUnavailable: data.staffUnavailableSlots?.length || 0,
      });
      return data;
    } catch (error: any) {
      console.error(
        "❌ Error fetching available slots with staff:",
        error.message,
      );
      throw error;
    }
  },

  /**
   * Check specific staff availability for date and time
   */
  checkStaffAvailability: async (
    staffId: string,
    date: string,
    time: string,
  ): Promise<StaffAvailabilityCheckResponse> => {
    try {
      console.log("🔍 Checking staff availability:", { staffId, date, time });

      const token = await getToken();

      const response = await fetch(
        `${API_BASE_URL}/bookings/check-staff-availability`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ staffId, date, time }),
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Staff availability checked:", data.isAvailable);
      return data;
    } catch (error: any) {
      console.error("❌ Error checking staff availability:", error.message);
      throw error;
    }
  },

  /**
   * Get all staff availability for a specific date
   */
  getStaffAvailabilityForDate: async (
    date: string,
  ): Promise<StaffAvailabilityResponse> => {
    try {
      console.log("👥 Getting staff availability for date:", date);

      const token = await getToken();

      const response = await fetch(
        `${API_BASE_URL}/bookings/staff-availability/${date}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log(
        "✅ Staff availability fetched:",
        data.data?.length || 0,
        "staff members",
      );
      return data;
    } catch (error: any) {
      console.error("❌ Error getting staff availability:", error.message);
      throw error;
    }
  },

  /**
   * Get staff available slots for a specific staff member and date
   */
  getStaffAvailableSlots: async (
    staffId: string,
    date: string,
  ): Promise<{ success: boolean; availableSlots: string[] }> => {
    try {
      console.log("💇 Getting staff available slots:", { staffId, date });

      const token = await getToken();

      // Use the staff-specific availability endpoint
      const response = await fetch(
        `${API_BASE_URL}/bookings/available-slots-with-staff/${date}?staffId=${staffId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const data = await handleApiResponse(response);

      // Return staff-specific available slots
      const availableSlots =
        data.staffAvailableSlots || data.availableSlots || [];

      console.log("✅ Staff available slots fetched:", availableSlots.length);
      return {
        success: true,
        availableSlots,
      };
    } catch (error: any) {
      console.error("❌ Error getting staff available slots:", error.message);
      throw error;
    }
  },

  /**
   * Validate booking data before submission
   */
  validateBookingData: async (
    bookingData: CreateBookingData,
  ): Promise<{ isValid: boolean; errors: string[] }> => {
    try {
      console.log("🔍 Validating booking data...");

      const errors: string[] = [];

      // Required field validation
      if (!bookingData.serviceId) {
        errors.push("Service ID is required");
      }

      if (!bookingData.stylistPreference) {
        errors.push("Stylist preference is required");
      }

      if (!bookingData.preferredDate) {
        errors.push("Preferred date is required");
      }

      if (!bookingData.preferredTime) {
        errors.push("Preferred time is required");
      }

      // Specific stylist validation
      if (
        bookingData.stylistPreference === "specific" &&
        !bookingData.selectedStylistId
      ) {
        errors.push("Stylist ID is required for specific stylist preference");
      }

      // Payment option validation
      if (
        bookingData.paymentOption &&
        !["full", "downpayment"].includes(bookingData.paymentOption)
      ) {
        errors.push("Invalid payment option. Must be 'full' or 'downpayment'");
      }

      // Downpayment percentage validation
      if (bookingData.paymentOption === "downpayment") {
        const percentage = bookingData.downpaymentPercentage || 30;
        if (percentage < 10 || percentage > 50) {
          errors.push("Downpayment percentage must be between 10% and 50%");
        }
      }

      // Date validation
      if (bookingData.preferredDate) {
        const bookingDate = new Date(bookingData.preferredDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        bookingDate.setHours(0, 0, 0, 0);

        if (bookingDate < today) {
          errors.push("Cannot book appointments in the past");
        }
      }

      const isValid = errors.length === 0;
      console.log("✅ Booking validation result:", { isValid, errors });

      return { isValid, errors };
    } catch (error: any) {
      console.error("❌ Error validating booking data:", error.message);
      return { isValid: false, errors: ["Validation error occurred"] };
    }
  },

  /**
   * Enhanced booking creation with availability validation
   */
  createBookingWithValidation: async (
    bookingData: CreateBookingData,
  ): Promise<ApiResponse<Booking>> => {
    try {
      console.log("📝 Creating booking with validation...");

      // First validate the booking data
      const validation = await apiClient.validateBookingData(bookingData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Check staff availability if specific stylist is selected
      if (
        bookingData.stylistPreference === "specific" &&
        bookingData.selectedStylistId
      ) {
        console.log("🔍 Checking staff availability before booking...");

        const availabilityCheck = await apiClient.checkStaffAvailability(
          bookingData.selectedStylistId,
          bookingData.preferredDate,
          bookingData.preferredTime,
        );

        if (!availabilityCheck.isAvailable) {
          throw new Error(
            "Selected stylist is not available at the chosen time. Please choose a different time or stylist.",
          );
        }
      }

      // Proceed with booking creation
      return await apiClient.createBookingWithPaymentOption(bookingData);
    } catch (error: any) {
      console.error("❌ Error in validated booking creation:", error.message);
      throw error;
    }
  },

  /**
   * Get all salon staff/employees
   */
  getSalonStaff: async (): Promise<ApiResponse<Stylist[]>> => {
    try {
      console.log("👥 Fetching salon staff...");

      const token = await getToken();

      // Try the stylists endpoint first
      try {
        const response = await fetch(`${API_BASE_URL}/stylists`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          const data = await handleApiResponse(response);
          console.log(
            "✅ Salon staff fetched via /stylists:",
            data.data?.length || 0,
          );
          return data;
        }
      } catch (error) {
        console.log("⚠️ /stylists endpoint failed, trying alternative...");
      }

      // Alternative: Get staff from users endpoint
      try {
        const response = await fetch(`${API_BASE_URL}/users?role=salon_staff`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          const data = await handleApiResponse(response);
          console.log(
            "✅ Salon staff fetched via /users:",
            data.data?.length || 0,
          );

          // Transform user data to stylist format if needed
          const staffData =
            data.data?.map((user: any) => ({
              _id: user._id,
              username: user.username,
              position: user.position || "Stylist",
              profileImage: user.profileImage,
              rating: user.rating?.average || 0,
              reviewCount: user.rating?.totalRaters || 0,
            })) || [];

          return {
            success: true,
            data: staffData,
            message: "Staff fetched successfully",
          };
        }
      } catch (error) {
        console.log("⚠️ /users endpoint also failed");
      }

      throw new Error("Could not fetch salon staff");
    } catch (error: any) {
      console.error("❌ Error fetching salon staff:", error.message);
      throw error;
    }
  },

  /**
   * Get staff member details by ID
   */
  getStaffById: async (staffId: string): Promise<ApiResponse<Stylist>> => {
    try {
      console.log("👤 Fetching staff details:", staffId);

      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/users/${staffId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await handleApiResponse(response);

      // Transform user to stylist format
      const staffData: Stylist = {
        _id: data.data._id,
        username: data.data.username,
        position: data.data.position || "Stylist",
        profileImage: data.data.profileImage,
        rating: data.data.rating?.average || 0,
        reviewCount: data.data.rating?.totalRaters || 0,
      };

      console.log("✅ Staff details fetched:", staffData.username);
      return {
        success: true,
        data: staffData,
        message: "Staff details fetched successfully",
      };
    } catch (error: any) {
      console.error("❌ Error fetching staff details:", error.message);
      throw error;
    }
  },

  // ==================== DOWNPAYMENT BOOKING METHODS ====================

  /**
   * Create booking with payment option (full or downpayment)
   */
  createBookingWithPaymentOption: async (
    bookingData: CreateBookingData,
  ): Promise<ApiResponse<Booking>> => {
    try {
      console.log("📝 Creating booking with payment option...");
      console.log("📤 Booking data:", JSON.stringify(bookingData, null, 2));

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      const user = await apiClient.getUserFromStorage();
      console.log(
        "👤 Current user:",
        user?.username,
        "(Guest:",
        user?.isGuest,
        ")",
      );

      if (!user || user.isGuest) {
        console.error("❌ Invalid user or guest account");
        throw new Error("Valid user account required to create booking");
      }

      const convertedBookingData = {
        ...bookingData,
        preferredTime: convertTimeTo24HourFormat(bookingData.preferredTime),
      };

      console.log(
        "🔄 Converted booking data:",
        JSON.stringify(convertedBookingData, null, 2),
      );

      let response;
      let endpoint = `${API_BASE_URL}/bookings/create`;

      console.log("📡 Sending request to:", endpoint);

      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(convertedBookingData),
      });

      console.log("📥 Booking response status:", response.status);

      if (!response.ok && response.status === 404) {
        console.log("🔄 Trying alternative booking endpoint...");
        endpoint = `${API_BASE_URL}/bookings`;

        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(convertedBookingData),
        });

        console.log(
          "📥 Alternative endpoint response status:",
          response.status,
        );
      }

      const data = await handleApiResponse(response);

      if (data.success && data.data) {
        console.log("✅ Booking created successfully:", data.data._id);
        console.log("💰 Payment details:", {
          paymentOption: data.data.paymentOption,
          totalAmount: data.data.totalAmount,
          downpaymentAmount: data.data.downpaymentAmount,
          remainingAmount: data.data.remainingAmount,
          nonRefundableAmount: data.data.nonRefundableAmount,
          refundableAmount: data.data.refundableAmount,
        });
        return data;
      } else {
        console.error("❌ Booking creation failed:", data.message);
        throw new Error(data.message || "Failed to create booking");
      }
    } catch (error: any) {
      console.error("❌ Error creating booking:", error.message);
      console.error("Stack trace:", error.stack);

      if (error.message.includes("Network request failed")) {
        throw new Error(
          "Network error. Please check your connection and try again.",
        );
      } else if (error.message.includes("Time must be in HH:MM format")) {
        throw new Error("Invalid time format. Please select a valid time.");
      } else if (error.message.includes("Failed to create booking")) {
        throw new Error(
          "Booking creation failed. Please try again or contact support.",
        );
      } else {
        throw error;
      }
    }
  },

  /**
   * Create payment for booking with payment type
   */
  createPaymentForBooking: async (
    paymentData: CreatePaymentData,
  ): Promise<ApiResponse<Payment>> => {
    try {
      console.log("💳 Creating payment for booking...");
      console.log("📤 Payment data:", JSON.stringify(paymentData, null, 2));

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      const response = await fetch(`${API_BASE_URL}/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      console.log("📥 Payment response status:", response.status);

      const data = await handleApiResponse(response);

      if (data.success && data.data) {
        console.log("✅ Payment created successfully:", data.data._id);
        console.log("💰 Payment details:", {
          paymentFor: data.data.paymentFor,
          amount: data.data.amount,
          isDownpayment: data.data.isDownpayment,
        });
        return data;
      } else {
        console.error("❌ Payment creation failed:", data.message);
        throw new Error(data.message || "Failed to create payment");
      }
    } catch (error: any) {
      console.error("❌ Error creating payment:", error.message);
      console.error("Stack trace:", error.stack);
      throw error;
    }
  },

  /**
   * Create payment for remaining amount
   */
  createRemainingPayment: async (
    bookingId: string,
    paymentMethod: string,
  ): Promise<ApiResponse<Payment>> => {
    try {
      console.log("💳 Creating remaining payment for booking:", bookingId);

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/payments/${bookingId}/pay-remaining`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentMethod }),
        },
      );

      console.log("📥 Remaining payment response status:", response.status);

      const data = await handleApiResponse(response);

      if (data.success && data.data) {
        console.log(
          "✅ Remaining payment created successfully:",
          data.data._id,
        );
        return data;
      } else {
        console.error("❌ Remaining payment creation failed:", data.message);
        throw new Error(data.message || "Failed to create remaining payment");
      }
    } catch (error: any) {
      console.error("❌ Error creating remaining payment:", error.message);
      console.error("Stack trace:", error.stack);
      throw error;
    }
  },

  /**
   * Cancel booking with refund calculation
   */
  cancelBookingWithRefund: async (
    bookingId: string,
    cancellationReason?: string,
  ): Promise<BookingCancellationResponse> => {
    try {
      console.log("🚫 Cancelling booking with refund calculation:", bookingId);

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cancellationReason }),
        },
      );

      console.log("📥 Cancellation response status:", response.status);

      const data = await handleApiResponse(response);

      if (data.success) {
        console.log("✅ Booking cancelled with refund calculation");
        console.log("💰 Refund details:", data.data?.refundDetails);
        return data;
      } else {
        console.error("❌ Booking cancellation failed:", data.message);
        throw new Error(data.message || "Failed to cancel booking");
      }
    } catch (error: any) {
      console.error("❌ Error cancelling booking:", error.message);
      console.error("Stack trace:", error.stack);
      throw error;
    }
  },

  /**
   * Process refund for cancelled booking (staff only)
   */
  processBookingRefund: async (
    bookingId: string,
    refundReference: string,
    notes?: string,
  ): Promise<ApiResponse<any>> => {
    try {
      console.log("💰 Processing refund for booking:", bookingId);

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/process-refund`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ refundReference, notes }),
        },
      );

      console.log("📥 Refund processing response status:", response.status);

      const data = await handleApiResponse(response);

      if (data.success) {
        console.log("✅ Refund processed successfully");
        return data;
      } else {
        console.error("❌ Refund processing failed:", data.message);
        throw new Error(data.message || "Failed to process refund");
      }
    } catch (error: any) {
      console.error("❌ Error processing refund:", error.message);
      console.error("Stack trace:", error.stack);
      throw error;
    }
  },

  /**
   * Get booking payment summary
   */
  getBookingPaymentSummary: async (
    bookingId: string,
  ): Promise<
    ApiResponse<{
      paymentOption: string;
      totalAmount: number;
      downpaymentAmount: number;
      remainingAmount: number;
      amountPaid: number;
      refundableAmount: number;
      nonRefundableAmount: number;
      paymentStatus: string;
    }>
  > => {
    try {
      console.log("💰 Getting booking payment summary:", bookingId);

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📥 Payment summary response status:", response.status);

      const data = await handleApiResponse(response);

      if (data.success && data.data) {
        const booking = data.data;
        const paymentSummary = {
          paymentOption: booking.paymentOption,
          totalAmount: booking.totalAmount,
          downpaymentAmount: booking.downpaymentAmount,
          remainingAmount: booking.remainingAmount,
          amountPaid: booking.amountPaid,
          refundableAmount: booking.refundableAmount,
          nonRefundableAmount: booking.nonRefundableAmount,
          paymentStatus: booking.paymentStatus,
        };

        console.log("✅ Payment summary:", paymentSummary);
        return {
          success: true,
          data: paymentSummary,
          message: "Payment summary retrieved successfully",
        };
      } else {
        console.error("❌ Failed to get payment summary:", data.message);
        throw new Error(data.message || "Failed to get payment summary");
      }
    } catch (error: any) {
      console.error("❌ Error getting payment summary:", error.message);
      console.error("Stack trace:", error.stack);
      throw error;
    }
  },

  // ==================== NOTIFICATION METHODS ====================

  /**
   * Get user notifications
   */
  getNotifications: async (
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      type?: string;
      sortBy?: string;
      sortOrder?: string;
    } = {},
  ): Promise<NotificationResponse> => {
    try {
      console.log("🔔 Fetching user notifications...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      let url = `${API_BASE_URL}/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

      if (type) {
        url += `&type=${type}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Notifications fetched:", data.data?.length || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching notifications:", error.message);
      throw error;
    }
  },

  /**
   * Get notification statistics
   */
  getNotificationStats: async (): Promise<NotificationStatsResponse> => {
    try {
      console.log("📊 Fetching notification statistics...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/notifications/stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Notification stats fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching notification stats:", error.message);
      throw error;
    }
  },

  /**
   * Mark notification as read
   */
  markNotificationAsRead: async (
    notificationId: string,
  ): Promise<{ success: boolean; message: string; data?: Notification }> => {
    try {
      console.log("📖 Marking notification as read:", notificationId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Notification marked as read");
      return data;
    } catch (error: any) {
      console.error("❌ Error marking notification as read:", error.message);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead: async (): Promise<{
    success: boolean;
    message: string;
    data?: { unreadCount: number };
  }> => {
    try {
      console.log("📖 Marking all notifications as read...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ All notifications marked as read");
      return data;
    } catch (error: any) {
      console.error(
        "❌ Error marking all notifications as read:",
        error.message,
      );
      throw error;
    }
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (
    notificationId: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("🗑️ Deleting notification:", notificationId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Notification deleted");
      return data;
    } catch (error: any) {
      console.error("❌ Error deleting notification:", error.message);
      throw error;
    }
  },

  /**
   * Delete all notifications
   */
  deleteAllNotifications: async (options?: {
    type?: string;
    readOnly?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    data?: { remainingCount: number };
  }> => {
    try {
      console.log("🗑️ Deleting all notifications...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      let url = `${API_BASE_URL}/notifications`;

      if (options) {
        const params = new URLSearchParams();
        if (options.type) params.append("type", options.type);
        if (options.readOnly) params.append("readOnly", "true");

        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ All notifications deleted");
      return data;
    } catch (error: any) {
      console.error("❌ Error deleting all notifications:", error.message);
      throw error;
    }
  },

  /**
   * Get admin activities (staff only)
   */
  getAdminActivities: async (
    options: {
      page?: number;
      limit?: number;
      userId?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
    } = {},
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      activities: Notification[];
      statistics: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    };
  }> => {
    try {
      console.log("👨‍💼 Fetching admin activities...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const {
        page = 1,
        limit = 50,
        userId,
        type,
        startDate,
        endDate,
      } = options;

      let url = `${API_BASE_URL}/notifications/admin/activities?page=${page}&limit=${limit}`;

      if (userId) url += `&userId=${userId}`;
      if (type) url += `&type=${type}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log(
        "✅ Admin activities fetched:",
        data.data?.activities?.length || 0,
      );
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching admin activities:", error.message);
      throw error;
    }
  },

  // ==================== NOTIFICATION UTILITY METHODS ====================

  /**
   * Subscribe to real-time notifications (WebSocket/Push)
   */
  subscribeToNotifications: (
    callback: (notification: Notification) => void,
  ) => {
    console.log("🔔 Subscribing to real-time notifications");
    // This would typically set up WebSocket or Push notification listeners
    // For now, it's a placeholder for future implementation
  },

  /**
   * Unsubscribe from notifications
   */
  unsubscribeFromNotifications: () => {
    console.log("🔕 Unsubscribing from notifications");
    // Clean up notification listeners
  },

  /**
   * Check for new notifications periodically
   */
  checkForNewNotifications: async (): Promise<number> => {
    try {
      const stats = await apiClient.getNotificationStats();
      return stats.data.unread;
    } catch (error) {
      console.error("❌ Error checking for new notifications:", error);
      return 0;
    }
  },

  /**
   * Format notification time for display
   */
  formatNotificationTime: (timestamp: string): string => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor(
      (now.getTime() - notificationTime.getTime()) / 1000,
    );

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return notificationTime.toLocaleDateString();
    }
  },

  /**
   * Get notification icon based on type
   */
  getNotificationIcon: (type: string): string => {
    const icons: { [key: string]: string } = {
      // Authentication & Profile
      user_registered: "👋",
      user_logged_in: "🔐",
      password_changed: "🔒",
      profile_updated: "👤",
      profile_picture_updated: "🖼️",

      // Purchases & Orders
      product_purchased: "🛍️",
      order_created: "📦",
      order_status_updated: "🔄",
      order_cancelled: "❌",
      order_delivered: "✅",

      // Services & Bookings
      service_booked: "💇",
      booking_created: "📅",
      booking_confirmed: "✅",
      booking_completed: "🎉",
      booking_cancelled: "❌",
      appointment_scheduled: "📅",
      appointment_completed: "✅",
      appointment_cancelled: "❌",

      // Cart & Favorites
      cart_updated: "🛒",
      item_added_to_cart: "➕",
      item_removed_from_cart: "➖",
      product_added_to_favorites: "⭐",
      product_removed_from_favorites: "💔",

      // Payments
      payment_initiated: "💳",
      payment_completed: "✅",
      payment_failed: "❌",
      payment_refunded: "↩️",

      // Ratings & Reviews
      rating_submitted: "⭐",
      review_added: "📝",
      rating_updated: "✏️",

      // System & Admin
      admin_action: "👨‍💼",
      system_alert: "⚠️",
      maintenance_notice: "🔧",
    };

    return icons[type] || "🔔";
  },

  /**
   * Get notification color based on priority
   */
  getNotificationColor: (priority: string): string => {
    const colors: { [key: string]: string } = {
      low: "#6B7280",
      medium: "#3B82F6",
      high: "#F59E0B",
      urgent: "#EF4444",
    };

    return colors[priority] || "#3B82F6";
  },

  // ==================== EXISTING BOOKING METHODS ====================

  /**
   * Get booking statistics (staff only)
   */
  getBookingStats: async (
    startDate?: string,
    endDate?: string,
  ): Promise<BookingStatsResponse> => {
    try {
      console.log("📊 Fetching booking statistics...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      let url = `${API_BASE_URL}/bookings/stats/overview`;
      const params = new URLSearchParams();

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Booking statistics fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching booking statistics:", error.message);
      throw error;
    }
  },

  /**
   * Get all bookings for staff
   */
  getStaffBookings: async (
    options: {
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<StaffBookingsResponse> => {
    try {
      console.log("📋 Fetching all bookings for staff...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const { status, page = 1, limit = 100 } = options;
      let url = `${API_BASE_URL}/bookings/staff/all?page=${page}&limit=${limit}`;

      if (status && status !== "all") {
        url += `&status=${status}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Staff bookings fetched:", data.data?.length || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching staff bookings:", error.message);
      throw error;
    }
  },

  /**
   * Update booking status (staff only)
   */
  updateBookingStatus: async (
    bookingId: string,
    status: string,
    adminNotes?: string,
  ): Promise<ApiResponse<Booking>> => {
    try {
      console.log("🔄 Updating booking status:", bookingId, "to", status);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status, adminNotes }),
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Booking status updated successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error updating booking status:", error.message);
      throw error;
    }
  },

  /**
   * Cancel booking with reason
   */
  cancelBookingWithReason: async (
    bookingId: string,
    cancellationReason?: string,
  ): Promise<ApiResponse<Booking>> => {
    try {
      console.log("❌ Cancelling booking with reason:", bookingId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cancellationReason }),
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Booking cancelled successfully with reason");
      return data;
    } catch (error: any) {
      console.error("❌ Error cancelling booking with reason:", error.message);
      throw error;
    }
  },

  /**
   * Notify staff about new booking
   */
  notifyStaffBooking: async (
    bookingId: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("🔔 Notifying staff about booking:", bookingId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/bookings/${bookingId}/notify-staff`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Staff notified successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error notifying staff:", error.message);
      // Return success anyway to not block the booking flow
      return { success: true, message: "Staff notification attempted" };
    }
  },

  // ==================== ENHANCED RATING VALIDATION METHODS ====================

  /**
   * Check if user has already rated an entity
   */
  hasRatedEntity: async (
    entityType: string,
    entityId: string,
    productId?: string,
  ): Promise<boolean> => {
    try {
      console.log(`🔍 Checking if user has rated:`, {
        entityType,
        entityId,
        productId,
      });

      const token = await getToken();
      if (!token) return false;

      // For product ratings within orders, check specifically
      if (entityType === "order" && productId) {
        const order = await apiClient.getOrderById(entityId);
        const item = order.data.items.find(
          (item: any) =>
            (item.product._id === productId || item.product === productId) &&
            item.isRated,
        );
        return !!item;
      }

      // For other entity types, check ratings collection
      const userRatings = await apiClient.getUserRatings({ entityType });
      return userRatings.data.ratings.some(
        (rating: Rating) =>
          rating.ratedEntity.type === entityType &&
          rating.ratedEntity.id === entityId,
      );
    } catch (error) {
      console.error("❌ Error checking existing rating:", error);
      return false;
    }
  },

  /**
   * Get appointment by ID
   */
  getAppointmentById: async (
    appointmentId: string,
  ): Promise<ApiResponse<Appointment>> => {
    try {
      console.log("📅 Fetching appointment:", appointmentId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/appointments/${appointmentId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Appointment fetched:", data.data?._id);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching appointment:", error.message);
      throw error;
    }
  },

  /**
   * Get product by ID
   */
  getProductById: async (productId: string): Promise<ApiResponse<Product>> => {
    try {
      console.log("🛍️ Fetching product:", productId);

      const response = await fetch(`${API_BASE_URL}/products/${productId}`);
      const data = await handleApiResponse(response);
      console.log("✅ Product fetched:", data.data?._id);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching product:", error.message);
      throw error;
    }
  },

  /**
   * Get service by ID
   */
  getServiceById: async (serviceId: string): Promise<ApiResponse<Service>> => {
    try {
      console.log("🔧 Fetching service:", serviceId);

      const response = await fetch(`${API_BASE_URL}/services/${serviceId}`);
      const data = await handleApiResponse(response);
      console.log("✅ Service fetched:", data.data?._id);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching service:", error.message);
      throw error;
    }
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId: string): Promise<ApiResponse<User>> => {
    try {
      console.log("👤 Fetching user:", userId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ User fetched:", data.data?._id);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching user:", error.message);
      throw error;
    }
  },

  // ==================== ENHANCED RATING SUBMISSION ====================

  /**
   * Enhanced rating submission with validation
   */
  submitRatingWithValidation: async (
    ratingData: SubmitRatingData,
  ): Promise<{ success: boolean; data: Rating; message: string }> => {
    try {
      console.log("⭐ Submitting rating with validation...");
      console.log("📤 Rating data:", JSON.stringify(ratingData, null, 2));

      // Validate rating eligibility
      const validation = await validateRatingEligibility(
        ratingData.entityType,
        ratingData.entityId,
        ratingData.productId,
      );

      if (!validation.canRate) {
        throw new Error(validation.reason || "Cannot rate this entity");
      }

      // Submit the rating
      const result = await apiClient.submitRating(ratingData);

      // Force update rating stats for all related entities
      await apiClient.forceUpdateRatingStats(
        ratingData.entityType,
        ratingData.entityId,
      );

      return result;
    } catch (error: any) {
      console.error("❌ Error in validated rating submission:", error.message);
      throw error;
    }
  },

  /**
   * Force update rating stats with retry logic
   */
  forceUpdateRatingStats: async (
    entityType: string,
    entityId: string,
  ): Promise<void> => {
    try {
      console.log("🔄 Force updating rating stats:", entityType, entityId);

      // Try multiple update methods
      const updatePromises = [];

      // Method 1: Entity-specific update
      updatePromises.push(
        apiClient
          .updateEntityRatingStats(entityType, entityId)
          .catch((error) => {
            console.warn(`⚠️ Method 1 failed: ${error.message}`);
            return null;
          }),
      );

      // Method 2: Manual stats recalculation
      updatePromises.push(
        apiClient
          .manualRecalculateStats(entityType, entityId)
          .catch((error) => {
            console.warn(`⚠️ Method 2 failed: ${error.message}`);
            return null;
          }),
      );

      // Wait for all update attempts
      await Promise.allSettled(updatePromises);

      console.log("✅ Rating stats update attempts completed");
    } catch (error: any) {
      console.error("❌ Error in force update rating stats:", error.message);
      // Don't throw - this shouldn't fail the main rating operation
    }
  },

  /**
   * Manual stats recalculation
   */
  manualRecalculateStats: async (
    entityType: string,
    entityId: string,
  ): Promise<RatingStatsResponse> => {
    try {
      console.log("🧮 Manually recalculating stats:", entityType, entityId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/ratings/recalculate-stats/${entityType}/${entityId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Manual stats recalculation completed");
      return await apiClient.updateEntityRatingStats(entityType, entityId);
    } catch (error: any) {
      console.error("❌ Error in manual stats recalculation:", error.message);
      throw error;
    }
  },

  // ==================== BULK RATING OPERATIONS ====================

  /**
   * Submit multiple ratings at once
   */
  submitBulkRatings: async (
    ratings: SubmitRatingData[],
  ): Promise<BulkRatingUpdateResponse> => {
    try {
      console.log("📦 Submitting bulk ratings:", ratings.length);

      const results = {
        success: true,
        message: "Bulk rating submission completed",
        updated: [] as string[],
        failed: [] as string[],
      };

      for (const ratingData of ratings) {
        try {
          await apiClient.submitRatingWithValidation(ratingData);
          results.updated.push(ratingData.entityId);
        } catch (error: any) {
          console.error(
            `❌ Failed to rate ${ratingData.entityId}:`,
            error.message,
          );
          results.failed.push(ratingData.entityId);
        }
      }

      results.success = results.failed.length === 0;
      results.message = `Updated: ${results.updated.length}, Failed: ${results.failed.length}`;

      return results;
    } catch (error: any) {
      console.error("❌ Error in bulk rating submission:", error.message);
      throw error;
    }
  },

  // ==================== ENHANCED RATING QUERIES ====================

  /**
   * Get ratings with advanced filtering
   */
  getRatingsWithFilters: async (
    filters: {
      entityType?: string;
      entityId?: string;
      minRating?: number;
      maxRating?: number;
      hasComment?: boolean;
      dateFrom?: string;
      dateTo?: string;
      includeReplies?: boolean;
    } = {},
    options: { page?: number; limit?: number; sortBy?: string } = {},
  ): Promise<RatingsResponse> => {
    try {
      console.log("🔍 Getting ratings with filters:", filters);

      const {
        entityType,
        entityId,
        minRating,
        maxRating,
        hasComment,
        dateFrom,
        dateTo,
        includeReplies,
      } = filters;

      const { page = 1, limit = 10, sortBy = "createdAt" } = options;

      let url = `${API_BASE_URL}/ratings?page=${page}&limit=${limit}&sortBy=${sortBy}`;

      if (entityType) url += `&entityType=${entityType}`;
      if (entityId) url += `&entityId=${entityId}`;
      if (minRating) url += `&minRating=${minRating}`;
      if (maxRating) url += `&maxRating=${maxRating}`;
      if (hasComment) url += `&hasComment=true`;
      if (dateFrom) url += `&dateFrom=${dateFrom}`;
      if (dateTo) url += `&dateTo=${dateTo}`;
      if (includeReplies) url += `&includeReplies=true`;

      const response = await fetch(url);
      const data = await handleApiResponse(response);
      console.log(
        "✅ Filtered ratings fetched:",
        data.data?.ratings?.length || 0,
      );
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching filtered ratings:", error.message);
      throw error;
    }
  },

  /**
   * Get rating summary for multiple entities
   */
  getRatingSummary: async (
    entities: { type: string; id: string }[],
  ): Promise<{
    success: boolean;
    data: {
      [key: string]: {
        averageRating: number;
        totalRatings: number;
        breakdown: RatingBreakdown;
      };
    };
  }> => {
    try {
      console.log("📊 Getting rating summary for entities:", entities.length);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/ratings/summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ entities }),
      });

      const data = await handleApiResponse(response);
      console.log("✅ Rating summary fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching rating summary:", error.message);
      throw error;
    }
  },

  // ==================== RATING ANALYTICS ====================

  /**
   * Get user's rating behavior analytics
   */
  getUserRatingAnalytics: async (): Promise<{
    success: boolean;
    data: {
      totalRatings: number;
      averageGivenRating: number;
      ratingDistribution: { [key: number]: number };
      favoriteEntities: {
        entityType: string;
        entityId: string;
        name: string;
        rating: number;
      }[];
      ratingTrend: {
        date: string;
        count: number;
        average: number;
      }[];
    };
  }> => {
    try {
      console.log("📈 Getting user rating analytics...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/ratings/analytics/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ User rating analytics fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching user rating analytics:", error.message);
      throw error;
    }
  },

  // ==================== ENHANCED UTILITY METHODS ====================

  /**
   * Calculate weighted average rating
   */
  calculateWeightedAverage: (
    ratings: Rating[],
    weights?: Record<number, number>,
  ): number => {
    if (!ratings.length) return 0;

    const defaultWeights: Record<number, number> = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
    };
    const weightMap: Record<number, number> = weights || defaultWeights;

    const totalWeight = ratings.reduce(
      (sum, rating) => sum + (weightMap[rating.rating] ?? 0),
      0,
    );
    const weightedSum = ratings.reduce(
      (sum, rating) => sum + rating.rating * (weightMap[rating.rating] ?? 0),
      0,
    );

    if (totalWeight === 0) return 0;
    return Math.round((weightedSum / totalWeight) * 10) / 10;
  },

  /**
   * Generate rating insights
   */
  generateRatingInsights: (
    ratings: Rating[],
  ): {
    total: number;
    average: number;
    distribution: { [key: number]: number };
    trend: "improving" | "declining" | "stable";
    commonWords: string[];
  } => {
    const total = ratings.length;
    const average = apiClient.calculateAverageRating(ratings);
    const distribution = apiClient.getRatingBreakdown(ratings);

    // Simple trend analysis (last 10 ratings vs previous 10)
    const recentRatings = ratings.slice(0, 10);
    const previousRatings = ratings.slice(10, 20);

    const recentAverage = apiClient.calculateAverageRating(recentRatings);
    const previousAverage = apiClient.calculateAverageRating(previousRatings);

    let trend: "improving" | "declining" | "stable" = "stable";
    if (recentAverage > previousAverage + 0.2) trend = "improving";
    else if (recentAverage < previousAverage - 0.2) trend = "declining";

    // Extract common words from comments
    const allComments = ratings
      .map((r) => r.comment?.toLowerCase() || "")
      .join(" ");

    const words = allComments.split(/\s+/).filter((word) => word.length > 3);
    const wordCount: { [key: string]: number } = {};

    words.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    const commonWords = Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    return {
      total,
      average,
      distribution,
      trend,
      commonWords,
    };
  },

  // ==================== RATING EXPORT ====================

  /**
   * Export ratings to CSV
   */
  exportRatingsToCSV: async (
    filters: any = {},
  ): Promise<{ success: boolean; data: string; message: string }> => {
    try {
      console.log("📤 Exporting ratings to CSV...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/ratings/export/csv`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(filters),
      });

      const data = await handleApiResponse(response);
      console.log("✅ Ratings exported to CSV");
      return data;
    } catch (error: any) {
      console.error("❌ Error exporting ratings to CSV:", error.message);
      throw error;
    }
  },

  // ==================== FIXED RATING SUBMISSION METHODS ====================

  /**
   * Submit a rating for an entity - FIXED VERSION
   */
  submitRating: async (
    ratingData: SubmitRatingData,
  ): Promise<{ success: boolean; data: Rating; message: string }> => {
    try {
      console.log("⭐ Submitting rating...");
      console.log("📤 Rating data:", JSON.stringify(ratingData, null, 2));

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // FIX: Validate and clean rating data before submission
      const cleanedRatingData = {
        ...ratingData,
        // Ensure rating is between 1-5
        rating: Math.max(1, Math.min(5, ratingData.rating)),
        // Clean categories to ensure all values are between 1-5
        categories: validateAndCleanRatingCategories(ratingData.categories),
      };

      console.log(
        "🧹 Cleaned rating data:",
        JSON.stringify(cleanedRatingData, null, 2),
      );

      // FIX: First, validate if the entity can be rated
      console.log("🔍 Pre-validating rating eligibility...");
      const validation = await validateRatingEligibility(
        cleanedRatingData.entityType,
        cleanedRatingData.entityId,
        cleanedRatingData.productId,
      );

      if (!validation.canRate) {
        console.error("❌ Pre-validation failed:", validation.reason);
        throw new Error(
          validation.reason || "Cannot rate this entity at this time",
        );
      }

      const response = await fetch(`${API_BASE_URL}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cleanedRatingData),
      });

      // Enhanced response handling
      const responseText = await response.text();
      console.log("📥 Raw rating response:", responseText);

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("❌ Failed to parse rating response:", parseError);
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        console.error("❌ Rating submission failed:", {
          status: response.status,
          statusText: response.statusText,
          data: data,
        });

        // FIX: Provide more specific error messages for validation errors
        if (response.status === 400) {
          if (
            data.message?.includes("categories") ||
            data.message?.includes("validation")
          ) {
            throw new Error(
              "Rating validation failed. Please ensure all category ratings are between 1-5 stars.",
            );
          }
          throw new Error(data.message || "Rating validation failed");
        } else if (response.status === 404) {
          throw new Error("Entity not found or you don't have access to it");
        } else if (response.status === 500) {
          throw new Error("Server error while submitting rating");
        } else {
          throw new Error(data.message || `Rating failed: ${response.status}`);
        }
      }

      console.log("✅ Rating submitted successfully");

      // Auto-update the entity's rating stats after successful rating
      try {
        await apiClient.updateEntityRatingStats(
          cleanedRatingData.entityType,
          cleanedRatingData.entityId,
        );
        console.log("✅ Auto-updated entity rating stats");
      } catch (updateError) {
        console.warn(
          "⚠️ Could not auto-update entity rating stats:",
          updateError,
        );
        // Don't fail the main request if auto-update fails
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error submitting rating:", error.message);
      throw error;
    }
  },

  /**
   * Rate a product from a specific order
   */
  rateOrderProduct: async (
    orderId: string,
    productId: string,
    rating: number,
    comment?: string,
  ): Promise<{ success: boolean; data: Rating; message: string }> => {
    try {
      console.log("⭐ Rating product from order:", orderId, productId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // FIX: Clean rating data
      const cleanedRating = Math.max(1, Math.min(5, rating));

      const response = await fetch(`${API_BASE_URL}/ratings/order-product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          productId,
          rating: cleanedRating,
          comment,
        }),
      });

      const data = await handleApiResponse(response);
      console.log("✅ Product rated successfully from order");

      // Auto-update product rating stats
      try {
        await apiClient.updateProductRatingStats(productId);
      } catch (updateError) {
        console.warn(
          "⚠️ Could not auto-update product rating stats:",
          updateError,
        );
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error rating product from order:", error.message);
      throw error;
    }
  },

  /**
   * Rate an order or product in an order
   */
  rateOrder: async (
    orderId: string,
    rating: number,
    comment?: string,
    productId?: string,
  ): Promise<{ success: boolean; data: Rating; message: string }> => {
    try {
      console.log("⭐ Rating order:", orderId);

      // If productId is provided, use the order-product endpoint
      if (productId) {
        return await apiClient.rateOrderProduct(
          orderId,
          productId,
          rating,
          comment,
        );
      }

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // FIX: Clean rating data
      const cleanedRating = Math.max(1, Math.min(5, rating));

      const ratingData: any = {
        entityType: "order",
        entityId: orderId,
        rating: cleanedRating,
        comment,
      };

      const response = await fetch(`${API_BASE_URL}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ratingData),
      });

      const data = await handleApiResponse(response);
      console.log("✅ Order rated successfully");

      // Auto-update rating stats
      try {
        await apiClient.updateEntityRatingStats("order", orderId);
      } catch (updateError) {
        console.warn("⚠️ Could not auto-update rating stats:", updateError);
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error rating order:", error.message);
      throw error;
    }
  },

  /**
   * Get ratings for a specific entity
   */
  getEntityRatings: async (
    entityType: string,
    entityId: string,
    options: {
      page?: number;
      limit?: number;
      rating?: number;
      sortBy?: string;
    } = {},
  ): Promise<RatingsResponse> => {
    try {
      console.log("📊 Getting entity ratings:", entityType, entityId);

      const { page = 1, limit = 10, rating, sortBy = "createdAt" } = options;
      let endpoint = `/ratings/${entityType}/${entityId}?page=${page}&limit=${limit}&sortBy=${sortBy}`;

      if (rating) {
        endpoint += `&rating=${rating}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const data = await handleApiResponse(response);
      console.log(
        "✅ Entity ratings fetched:",
        data.data?.ratings?.length || 0,
      );
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching entity ratings:", error.message);
      throw error;
    }
  },

  /**
   * Get staff ratings with detailed information
   */
  getStaffRatings: async (
    staffId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<RatingsResponse> => {
    try {
      console.log("💇 Getting staff ratings:", staffId);

      const { page = 1, limit = 10 } = options;
      const endpoint = `/ratings/staff/${staffId}?page=${page}&limit=${limit}`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const data = await handleApiResponse(response);
      console.log("✅ Staff ratings fetched:", data.data?.ratings?.length || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching staff ratings:", error.message);
      throw error;
    }
  },

  /**
   * Get user's own ratings
   */
  getUserRatings: async (
    options: { page?: number; limit?: number; entityType?: string } = {},
  ): Promise<RatingsResponse> => {
    try {
      console.log("👤 Getting user ratings...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const { page = 1, limit = 10, entityType } = options;
      let endpoint = `/ratings/user/my-ratings?page=${page}&limit=${limit}`;

      if (entityType) {
        endpoint += `&entityType=${entityType}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ User ratings fetched:", data.data?.ratings?.length || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching user ratings:", error.message);
      throw error;
    }
  },

  /**
   * Update a rating
   */
  updateRating: async (
    ratingId: string,
    updateData: UpdateRatingData,
  ): Promise<{ success: boolean; data: Rating; message: string }> => {
    try {
      console.log("✏️ Updating rating:", ratingId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // FIX: Clean rating data
      const cleanedUpdateData = {
        ...updateData,
        rating: updateData.rating
          ? Math.max(1, Math.min(5, updateData.rating))
          : undefined,
        categories: validateAndCleanRatingCategories(updateData.categories),
      };

      const response = await fetch(`${API_BASE_URL}/ratings/${ratingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cleanedUpdateData),
      });

      const data = await handleApiResponse(response);
      console.log("✅ Rating updated successfully");

      // Get the original rating to update entity stats
      try {
        const originalRating = await apiClient.getRatingById(ratingId);
        if (originalRating.success) {
          const entityType = originalRating.data.ratedEntity.type;
          const entityId = originalRating.data.ratedEntity.id;
          await apiClient.updateEntityRatingStats(entityType, entityId);
        }
      } catch (updateError) {
        console.warn(
          "⚠️ Could not auto-update entity rating stats:",
          updateError,
        );
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error updating rating:", error.message);
      throw error;
    }
  },

  /**
   * Get rating by ID
   */
  getRatingById: async (
    ratingId: string,
  ): Promise<{ success: boolean; data: Rating; message: string }> => {
    try {
      console.log("🔍 Getting rating by ID:", ratingId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/ratings/${ratingId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Rating fetched successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching rating:", error.message);
      throw error;
    }
  },

  /**
   * Delete a rating
   */
  deleteRating: async (
    ratingId: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("🗑️ Deleting rating:", ratingId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // Get rating info before deletion for stats update
      let entityType: string | null = null;
      let entityId: string | null = null;

      try {
        const rating = await apiClient.getRatingById(ratingId);
        if (rating.success) {
          entityType = rating.data.ratedEntity.type;
          entityId = rating.data.ratedEntity.id;
        }
      } catch (error) {
        console.warn("⚠️ Could not get rating info before deletion:", error);
      }

      const response = await fetch(`${API_BASE_URL}/ratings/${ratingId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Rating deleted successfully");

      // Update entity stats after deletion
      if (entityType && entityId) {
        try {
          await apiClient.updateEntityRatingStats(entityType, entityId);
        } catch (updateError) {
          console.warn(
            "⚠️ Could not update entity stats after deletion:",
            updateError,
          );
        }
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error deleting rating:", error.message);
      throw error;
    }
  },

  /**
   * Get entities that can be rated by the current user
   */
  getRateableEntities: async (): Promise<{
    success: boolean;
    data: RateableEntities;
    counts: {
      appointments: number;
      bookings: number;
      orders: number;
      products: number;
    };
  }> => {
    try {
      console.log("📋 Getting rateable entities...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/ratings/user/rateable`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Rateable entities fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching rateable entities:", error.message);
      throw error;
    }
  },

  /**
   * Rate an appointment
   */
  rateAppointment: async (
    appointmentId: string,
    rating: number,
    comment?: string,
    categories?: RatingCategories,
    staffId?: string,
  ) => {
    return apiClient.submitRating({
      entityType: "appointment",
      entityId: appointmentId,
      staffId,
      rating,
      comment,
      categories,
    });
  },

  /**
   * Rate a booking
   */
  rateBooking: async (
    bookingId: string,
    rating: number,
    comment?: string,
    categories?: RatingCategories,
    staffId?: string,
  ) => {
    return apiClient.submitRating({
      entityType: "booking",
      entityId: bookingId,
      staffId,
      rating,
      comment,
      categories,
    });
  },

  /**
   * Rate a product
   */
  rateProduct: async (
    productId: string,
    rating: number,
    comment?: string,
    categories?: RatingCategories,
  ) => {
    return apiClient.submitRating({
      entityType: "product",
      entityId: productId,
      productId,
      rating,
      comment,
      categories,
    });
  },

  /**
   * Rate a staff member
   */
  rateStaff: async (
    staffId: string,
    rating: number,
    comment?: string,
    categories?: RatingCategories,
  ) => {
    return apiClient.submitRating({
      entityType: "staff",
      entityId: staffId,
      staffId,
      rating,
      comment,
      categories,
    });
  },

  /**
   * Rate a service
   */
  rateService: async (
    serviceId: string,
    rating: number,
    comment?: string,
    categories?: RatingCategories,
  ) => {
    return apiClient.submitRating({
      entityType: "service",
      entityId: serviceId,
      serviceId,
      rating,
      comment,
      categories,
    });
  },

  // ==================== ORDER RATING METHODS ====================

  /**
   * Check if an order can be rated
   */
  canRateOrder: async (orderId: string): Promise<boolean> => {
    try {
      const order = await apiClient.getOrderById(orderId);
      return order.data.status === "delivered" && !order.data.isRated;
    } catch {
      console.error("❌ Error checking if order can be rated");
      return false;
    }
  },

  /**
   * Check if a product in an order can be rated
   */
  canRateOrderProduct: async (
    orderId: string,
    productId: string,
  ): Promise<boolean> => {
    try {
      const order = await apiClient.getOrderById(orderId);

      if (order.data.status !== "delivered") {
        return false;
      }

      const item = order.data.items.find(
        (item: any) =>
          item.product._id === productId || item.product === productId,
      );

      return !!(item && !item.isRated);
    } catch {
      console.error("❌ Error checking if order product can be rated");
      return false;
    }
  },

  // ==================== BOOKING RATING METHODS ====================

  /**
   * Check if a booking can be rated
   */
  canRateBooking: async (bookingId: string): Promise<boolean> => {
    try {
      const booking = await apiClient.getBookingById(bookingId);
      return booking.data.status === "completed" && !booking.data.isRated;
    } catch {
      console.error("❌ Error checking if booking can be rated");
      return false;
    }
  },

  /**
   * Get booking by ID
   */
  getBookingById: async (bookingId: string): Promise<ApiResponse<Booking>> => {
    try {
      console.log("📋 Fetching booking:", bookingId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Booking fetched:", data.data?._id);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching booking:", error.message);
      throw error;
    }
  },

  // ==================== RATING STATS UPDATE METHODS ====================

  /**
   * Manually update service rating stats
   */
  updateServiceRatingStats: async (
    serviceId: string,
  ): Promise<RatingStatsResponse> => {
    try {
      console.log("🔄 Manually updating service rating stats:", serviceId);

      const response = await fetch(
        `${API_BASE_URL}/services/${serviceId}/update-rating`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Service rating stats updated manually");
      return data;
    } catch (error: any) {
      console.error("❌ Error updating service rating stats:", error.message);
      throw error;
    }
  },

  /**
   * Manually update product rating stats
   */
  updateProductRatingStats: async (
    productId: string,
  ): Promise<RatingStatsResponse> => {
    try {
      console.log("🔄 Manually updating product rating stats:", productId);

      const response = await fetch(
        `${API_BASE_URL}/products/${productId}/update-rating`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Product rating stats updated manually");
      return data;
    } catch (error: any) {
      console.error("❌ Error updating product rating stats:", error.message);
      throw error;
    }
  },

  /**
   * Manually update entity rating stats via ratings endpoint
   */
  updateEntityRatingStats: async (
    entityType: string,
    entityId: string,
  ): Promise<RatingStatsResponse> => {
    try {
      console.log(
        "🔄 Manually updating entity rating stats:",
        entityType,
        entityId,
      );

      // FIX: Token is optional, not required
      const token = await getToken();

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add token if available
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/ratings/update-stats/${entityType}/${entityId}`,
        {
          method: "PUT",
          headers,
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Entity rating stats updated manually");
      return data;
    } catch (error: any) {
      console.error("❌ Error updating entity rating stats:", error.message);
      throw error;
    }
  },

  // ==================== RATING STATISTICS METHODS ====================

  /**
   * Get rating statistics for dashboard
   */
  getRatingStatistics: async (
    period: string = "month",
  ): Promise<RatingStatisticsResponse> => {
    try {
      console.log("📊 Getting rating statistics for period:", period);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/ratings/stats/overview?period=${period}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Rating statistics fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching rating statistics:", error.message);
      throw error;
    }
  },

  // ==================== FIXED RATING UTILITY METHODS ====================

  /**
   * Calculate average rating from ratings array
   */
  calculateAverageRating: (ratings: Rating[]): number => {
    if (!ratings.length) return 0;

    const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    return Math.round((total / ratings.length) * 10) / 10;
  },

  /**
   * Get rating breakdown
   */
  getRatingBreakdown: (ratings: Rating[]): RatingBreakdown => {
    const breakdown: RatingBreakdown = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratings.forEach((rating) => {
      breakdown[rating.rating] = (breakdown[rating.rating] || 0) + 1;
    });

    return breakdown;
  },

  /**
   * Format rating for display
   */
  formatRating: (rating: number): string => {
    return rating.toFixed(1);
  },

  /**
   * Get star rating display (for UI)
   */
  getStarRating: (
    rating: number,
  ): { full: number; half: boolean; empty: number } => {
    const fullStars = Math.floor(rating);
    const decimal = rating - fullStars;
    const halfStar = decimal >= 0.3 && decimal <= 0.7;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return {
      full: fullStars,
      half: halfStar,
      empty: emptyStars,
    };
  },

  /**
   * Calculate rating percentages for display - FIXED VERSION
   */
  calculateRatingPercentages: (
    rating: Product["rating"] | Service["rating"],
  ): RatingPercentages => {
    const total = rating.totalRaters;
    if (total === 0) return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    const breakdown = rating.breakdown;

    return {
      1: Math.round((breakdown[1] / total) * 100),
      2: Math.round((breakdown[2] / total) * 100),
      3: Math.round((breakdown[3] / total) * 100),
      4: Math.round((breakdown[4] / total) * 100),
      5: Math.round((breakdown[5] / total) * 100),
    };
  },

  // ==================== PRODUCT RATING METHODS ====================

  /**
   * Get product ratings
   */
  getProductRatings: async (
    productId: string,
    options: { page?: number; limit?: number; rating?: number } = {},
  ): Promise<ProductRatingsResponse> => {
    try {
      console.log("⭐ Getting product ratings:", productId);

      const { page = 1, limit = 10, rating } = options;
      let url = `${API_BASE_URL}/products/${productId}/ratings?page=${page}&limit=${limit}`;

      if (rating) {
        url += `&rating=${rating}`;
      }

      const response = await fetch(url);
      const data = await handleApiResponse(response);
      console.log(
        "✅ Product ratings fetched:",
        data.data?.ratings?.length || 0,
      );
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching product ratings:", error.message);
      throw error;
    }
  },

  /**
   * Get top rated products
   */
  getTopRatedProducts: async (
    limit: number = 10,
  ): Promise<ApiResponse<Product[]>> => {
    try {
      console.log("🏆 Getting top rated products...");

      const response = await fetch(
        `${API_BASE_URL}/products/featured/top-rated?limit=${limit}`,
      );
      const data = await handleApiResponse(response);
      console.log("✅ Top rated products fetched:", data.data?.length || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching top rated products:", error.message);
      throw error;
    }
  },

  // ==================== SERVICE RATING METHODS ====================

  /**
   * Get service ratings
   */
  getServiceRatings: async (
    serviceId: string,
    options: { page?: number; limit?: number; rating?: number } = {},
  ): Promise<ServiceRatingsResponse> => {
    try {
      console.log("⭐ Getting service ratings:", serviceId);

      const { page = 1, limit = 10, rating } = options;
      let url = `${API_BASE_URL}/services/${serviceId}/ratings?page=${page}&limit=${limit}`;

      if (rating) {
        url += `&rating=${rating}`;
      }

      const response = await fetch(url);
      const data = await handleApiResponse(response);
      console.log(
        "✅ Service ratings fetched:",
        data.data?.ratings?.length || 0,
      );
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching service ratings:", error.message);
      throw error;
    }
  },

  /**
   * Get top rated services
   */
  getTopRatedServices: async (
    limit: number = 10,
  ): Promise<ApiResponse<Service[]>> => {
    try {
      console.log("🏆 Getting top rated services...");

      const response = await fetch(
        `${API_BASE_URL}/services/featured/top-rated?limit=${limit}`,
      );
      const data = await handleApiResponse(response);
      console.log("✅ Top rated services fetched:", data.data?.length || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching top rated services:", error.message);
      throw error;
    }
  },

  // ==================== ORDER METHODS ====================

  /**
   * Get user's orders with filtering
   */
  getUserOrders: async (
    options: {
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<ApiResponse<Order[]>> => {
    try {
      console.log("📦 Fetching user orders...");

      const token = await getToken();
      if (!token) {
        return {
          success: false,
          message: "Authentication required",
          data: [],
        };
      }

      const { status, page = 1, limit = 20 } = options;
      let url = `${API_BASE_URL}/orders?page=${page}&limit=${limit}`;

      if (status && status !== "all") {
        url += `&status=${status}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Orders fetched:", data.count || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching orders:", error.message);
      throw error;
    }
  },

  /**
   * Create a new order
   */
  createOrder: async (orderData: {
    items: { productId: string; quantity: number }[];
    deliveryType: "pickup" | "delivery";
    deliveryAddress?: string;
    contactNumber: string;
    specialInstructions?: string;
    customerNotes?: string;
  }): Promise<ApiResponse<Order>> => {
    try {
      console.log("🛒 Creating order...");
      console.log("📤 Order data:", JSON.stringify(orderData, null, 2));

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      const response = await fetch(`${API_BASE_URL}/orders/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      console.log("📥 Order response status:", response.status);

      const data = await handleApiResponse(response);

      if (data.success && data.data) {
        console.log("✅ Order created successfully:", data.data._id);
        return {
          success: true,
          data: data.data,
          message: data.message || "Order created successfully",
        };
      } else {
        console.error("❌ Order creation failed:", data.message);
        throw new Error(data.message || "Failed to create order");
      }
    } catch (error: any) {
      console.error("❌ Error creating order:", error.message);
      console.error("Stack trace:", error.stack);
      throw error;
    }
  },

  /**
   * Get all orders for current user
   */
  getOrders: async (): Promise<ApiResponse<Order[]>> => {
    try {
      console.log("📦 Fetching user orders...");

      const token = await getToken();
      if (!token) {
        return {
          success: false,
          message: "Authentication required",
          data: [],
        };
      }

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Orders fetched:", data.count || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching orders:", error.message);
      throw error;
    }
  },

  /**
   * Get specific order by ID
   */
  getOrderById: async (orderId: string): Promise<ApiResponse<Order>> => {
    try {
      console.log("📦 Fetching order:", orderId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Order fetched:", data.data?._id);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching order:", error.message);
      throw error;
    }
  },

  /**
   * Cancel an order
   */
  cancelOrder: async (
    orderId: string,
    cancellationReason?: string,
  ): Promise<ApiResponse<Order>> => {
    try {
      console.log("❌ Cancelling order:", orderId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cancellationReason }),
      });

      const data = await handleApiResponse(response);
      console.log("✅ Order cancelled successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error cancelling order:", error.message);
      throw error;
    }
  },

  /**
   * Get order tracking information
   */
  getOrderTracking: async (orderId: string): Promise<ApiResponse<any>> => {
    try {
      console.log("📍 Fetching order tracking:", orderId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/orders/${orderId}/tracking`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Order tracking fetched");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching order tracking:", error.message);
      throw error;
    }
  },

  // ==================== BOOKING METHODS ====================

  /**
   * Get user bookings
   */
  getUserBookings: async (): Promise<ApiResponse<UserBooking[]>> => {
    try {
      console.log("📅 Fetching user bookings...");

      const token = await getToken();
      if (!token) {
        console.warn("⚠️ No token found, user not authenticated");
        return {
          success: false,
          message: "Authentication required",
          data: [],
        };
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      let response;
      let data;

      try {
        console.log("📡 Trying endpoint: /bookings/my-bookings");
        response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          data = await handleApiResponse(response);
          console.log(
            "✅ Bookings fetched from /my-bookings:",
            data.data?.length || 0,
          );
          return {
            success: true,
            data: data.data || data.bookings || [],
            message: data.message || "Bookings fetched successfully",
          };
        }
      } catch {
        console.log("⚠️ Endpoint /my-bookings failed, trying alternative...");
      }

      try {
        console.log("📡 Trying endpoint: /bookings");
        response = await fetch(`${API_BASE_URL}/bookings`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          data = await handleApiResponse(response);
          console.log(
            "✅ Bookings fetched from /bookings:",
            data.data?.length || 0,
          );
          return {
            success: true,
            data: data.data || data.bookings || [],
            message: data.message || "Bookings fetched successfully",
          };
        }
      } catch {
        console.log("⚠️ Endpoint /bookings failed, trying user-specific...");
      }

      try {
        console.log("📡 Trying endpoint: /users/me/bookings");
        response = await fetch(`${API_BASE_URL}/users/me/bookings`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          data = await handleApiResponse(response);
          console.log(
            "✅ Bookings fetched from /users/me/bookings:",
            data.data?.length || 0,
          );
          return {
            success: true,
            data: data.data || data.bookings || [],
            message: data.message || "Bookings fetched successfully",
          };
        }
      } catch {
        console.log("⚠️ All booking endpoints failed");
      }

      console.warn("⚠️ Could not fetch bookings from any endpoint");
      return {
        success: false,
        message: "Booking endpoint not available",
        data: [],
      };
    } catch (error: any) {
      console.error("❌ Error fetching user bookings:", error.message);
      return {
        success: false,
        data: [],
        message: error.message || "Failed to fetch bookings",
      };
    }
  },

  /**
   * Cancel a booking
   */
  cancelBooking: async (
    bookingId: string,
  ): Promise<ApiResponse<UserBooking>> => {
    try {
      console.log("❌ Cancelling booking:", bookingId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      let response;

      try {
        console.log("📡 Trying endpoint: /bookings/:id/cancel");
        response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await handleApiResponse(response);
          console.log("✅ Booking cancelled successfully via /cancel");
          return {
            success: true,
            data: data.data || data.booking,
            message: data.message || "Booking cancelled successfully",
          };
        }
      } catch {
        console.log("⚠️ /cancel endpoint failed, trying PATCH...");
      }

      try {
        console.log("📡 Trying endpoint: PATCH /bookings/:id");
        response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "cancelled" }),
        });

        if (response.ok) {
          const data = await handleApiResponse(response);
          console.log("✅ Booking cancelled successfully via PATCH");
          return {
            success: true,
            data: data.data || data.booking,
            message: data.message || "Booking cancelled successfully",
          };
        }
      } catch {
        console.log("⚠️ PATCH endpoint failed, trying PUT...");
      }

      try {
        console.log("📡 Trying endpoint: PUT /bookings/:id");
        response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "cancelled" }),
        });

        if (response.ok) {
          const data = await handleApiResponse(response);
          console.log("✅ Booking cancelled successfully via PUT");
          return {
            success: true,
            data: data.data || data.booking,
            message: data.message || "Booking cancelled successfully",
          };
        }
      } catch {
        console.log("⚠️ All cancellation endpoints failed");
      }

      throw new Error("Could not cancel booking - endpoint not available");
    } catch (error: any) {
      console.error("❌ Error cancelling booking:", error.message);
      throw error;
    }
  },

  /**
   * Create a booking
   */
  createBooking: async (bookingData: {
    serviceId: string;
    stylistPreference: string;
    selectedStylistId?: string;
    preferredDate: string;
    preferredTime: string;
    customerNotes?: string;
  }): Promise<ApiResponse<Booking>> => {
    try {
      console.log("📝 Creating booking...");
      console.log(
        "📤 Original booking data:",
        JSON.stringify(bookingData, null, 2),
      );

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      const user = await apiClient.getUserFromStorage();
      console.log(
        "👤 Current user:",
        user?.username,
        "(Guest:",
        user?.isGuest,
        ")",
      );

      if (!user || user.isGuest) {
        console.error("❌ Invalid user or guest account");
        throw new Error("Valid user account required to create booking");
      }

      const convertedBookingData = {
        ...bookingData,
        preferredTime: convertTimeTo24HourFormat(bookingData.preferredTime),
      };

      console.log(
        "🔄 Converted booking data:",
        JSON.stringify(convertedBookingData, null, 2),
      );

      let response;
      let endpoint = `${API_BASE_URL}/bookings/create`;

      console.log("📡 Sending request to:", endpoint);

      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(convertedBookingData),
      });

      console.log("📥 Booking response status:", response.status);

      if (!response.ok && response.status === 404) {
        console.log("🔄 Trying alternative booking endpoint...");
        endpoint = `${API_BASE_URL}/bookings`;

        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(convertedBookingData),
        });

        console.log(
          "📥 Alternative endpoint response status:",
          response.status,
        );
      }

      const data = await handleApiResponse(response);

      if (data.success && data.data) {
        console.log("✅ Booking created successfully:", data.data._id);
        return data;
      } else {
        console.error("❌ Booking creation failed:", data.message);
        throw new Error(data.message || "Failed to create booking");
      }
    } catch (error: any) {
      console.error("❌ Error creating booking:", error.message);
      console.error("Stack trace:", error.stack);

      if (error.message.includes("Network request failed")) {
        throw new Error(
          "Network error. Please check your connection and try again.",
        );
      } else if (error.message.includes("Time must be in HH:MM format")) {
        throw new Error("Invalid time format. Please select a valid time.");
      } else if (error.message.includes("Failed to create booking")) {
        throw new Error(
          "Booking creation failed. Please try again or contact support.",
        );
      } else {
        throw error;
      }
    }
  },

  // ==================== SERVICE METHODS ====================

  /**
   * Get all services
   */
  getAllServices: async (
    sortBy?: string,
    sortOrder?: string,
  ): Promise<ApiResponse<Service[]>> => {
    try {
      console.log("🔧 Fetching all services...");

      let url = `${API_BASE_URL}/services`;
      if (sortBy) {
        url += `?sortBy=${sortBy}`;
        if (sortOrder) url += `&sortOrder=${sortOrder}`;
      }

      const response = await fetch(url);
      const data = await handleApiResponse(response);
      console.log("✅ Services fetched:", data.count || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching services:", error.message);
      throw error;
    }
  },

  /**
   * Get services by category
   */
  getServicesByCategory: async (
    category: string,
    sortBy?: string,
    sortOrder?: string,
  ): Promise<ApiResponse<Service[]>> => {
    try {
      console.log("🔧 Fetching services by category:", category);

      let url = `${API_BASE_URL}/services/category/${category}`;
      if (sortBy) {
        url += `?sortBy=${sortBy}`;
        if (sortOrder) url += `&sortOrder=${sortOrder}`;
      }

      const response = await fetch(url);
      const data = await handleApiResponse(response);
      console.log("✅ Services fetched:", data.count || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching services by category:", error.message);
      throw error;
    }
  },

  /**
   * Get service categories
   */
  getServiceCategories: async (): Promise<ApiResponse<string[]>> => {
    try {
      console.log("📂 Fetching service categories...");

      const response = await fetch(`${API_BASE_URL}/services/categories`);
      const data = await handleApiResponse(response);
      console.log("✅ Categories fetched:", data.data?.length || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching service categories:", error.message);
      throw error;
    }
  },

  /**
   * Get stylists
   */
  getStylists: async (): Promise<ApiResponse<Stylist[]>> => {
    try {
      console.log("💇 Fetching stylists...");

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/stylists`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Stylists fetched:", data.count || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching stylists:", error.message);
      throw error;
    }
  },

  /**
   * Book a service
   */
  bookService: async (serviceId: string): Promise<ApiResponse<any>> => {
    try {
      console.log("📝 Booking service:", serviceId);

      const token = await getToken();

      const response = await fetch(
        `${API_BASE_URL}/services/${serviceId}/book`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Service booked successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error booking service:", error.message);
      throw error;
    }
  },

  // ==================== PRODUCT METHODS ====================

  /**
   * Get all products
   */
  getAllProducts: async (): Promise<ApiResponse<Product[]>> => {
    try {
      console.log("🛍️ Fetching all products...");

      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await handleApiResponse(response);
      console.log("✅ Products fetched:", data.count || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching products:", error.message);
      throw error;
    }
  },

  /**
   * Get products by category
   */
  getProductsByCategory: async (
    category: string,
  ): Promise<ApiResponse<Product[]>> => {
    try {
      console.log("🛍️ Fetching products by category:", category);

      const response = await fetch(
        `${API_BASE_URL}/products/category/${category}`,
      );
      const data = await handleApiResponse(response);
      console.log("✅ Products fetched:", data.count || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching products by category:", error.message);
      throw error;
    }
  },

  /**
   * Get product categories
   */
  getProductCategories: async (): Promise<ApiResponse<string[]>> => {
    try {
      console.log("📂 Fetching product categories...");

      const response = await fetch(`${API_BASE_URL}/products/categories`);
      const data = await handleApiResponse(response);
      console.log("✅ Categories fetched:", data.data?.length || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching product categories:", error.message);
      throw error;
    }
  },

  // ==================== PAYMENT METHODS ====================

  /**
   * Create a payment
   */
  createPayment: async (paymentData: {
    bookingId?: string;
    orderId?: string;
    paymentMethod: string;
    paymentFor?: "full" | "downpayment" | "remaining";
  }): Promise<ApiResponse<Payment>> => {
    try {
      console.log("💳 Creating payment...");
      console.log("📤 Payment data:", JSON.stringify(paymentData, null, 2));

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      const response = await fetch(`${API_BASE_URL}/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      console.log("📥 Payment response status:", response.status);

      const data = await handleApiResponse(response);

      if (data.success && data.data) {
        console.log("✅ Payment created successfully:", data.data._id);
        return data;
      } else {
        console.error("❌ Payment creation failed:", data.message);
        throw new Error(data.message || "Failed to create payment");
      }
    } catch (error: any) {
      console.error("❌ Error creating payment:", error.message);
      console.error("Stack trace:", error.stack);
      throw error;
    }
  },

  /**
   * Upload proof of payment
   */
  uploadProofOfPayment: async (
    paymentId: string,
    formData: FormData,
  ): Promise<ApiResponse<any>> => {
    try {
      console.log("📤 Uploading proof of payment for:", paymentId);

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");
      console.log(
        "🌐 Upload URL:",
        `${API_BASE_URL}/payments/${paymentId}/upload-proof`,
      );

      const debugInfo: any = {};
      for (const pair of (formData as any).entries()) {
        const key = pair[0];
        const value = pair[1];
        if (typeof value === "object" && "uri" in value) {
          debugInfo[key] = {
            uri: value.uri?.substring(0, 50) + "...",
            type: value.type,
            name: value.name,
          };
        } else {
          debugInfo[key] = value;
        }
      }
      console.log("📋 FormData contents:", JSON.stringify(debugInfo, null, 2));

      const response = await fetch(
        `${API_BASE_URL}/payments/${paymentId}/upload-proof`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      console.log("📥 Upload response status:", response.status);

      const responseText = await response.text();
      console.log("📄 Raw response:", responseText.substring(0, 500));

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        console.error("❌ Failed to parse response");
        console.log("📄 Full response text:", responseText);
        throw new Error(
          `Invalid server response: ${responseText.substring(0, 100)}`,
        );
      }

      if (!response.ok) {
        console.error("❌ Upload failed:", {
          status: response.status,
          statusText: response.statusText,
          data: data,
        });

        const errorMessage =
          data.message ||
          data.error ||
          `Upload failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      console.log("✅ Proof of payment uploaded successfully");
      return {
        success: true,
        data: data.data || data,
        message: data.message || "Upload successful",
      };
    } catch (error: any) {
      console.error("❌ Error uploading proof of payment:", error.message);
      console.error("Stack trace:", error.stack);

      if (error.message.includes("Network request failed")) {
        throw new Error("Network error. Please check your connection.");
      } else if (error.message.includes("timeout")) {
        throw new Error("Upload timed out. Please try again.");
      }

      throw error;
    }
  },

  /**
   * Get payment status
   */
  getPaymentStatus: async (
    paymentId: string,
  ): Promise<ApiResponse<Payment>> => {
    try {
      console.log("🔍 [API CLIENT] Checking payment status for:", paymentId);

      const token = await getToken();
      if (!token) {
        console.error("❌ [API CLIENT] No authentication token available");
        throw new Error("Authentication required");
      }

      console.log(
        "🌐 [API CLIENT] Calling endpoint:",
        `${API_BASE_URL}/payments/${paymentId}/status`,
      );

      const response = await fetch(
        `${API_BASE_URL}/payments/${paymentId}/status`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("📥 [API CLIENT] Response status:", response.status);

      const data = await handleApiResponse(response);

      console.log("✅ [API CLIENT] Payment status response:", {
        success: data.success,
        status: data.data?.status,
        fullData: JSON.stringify(data.data, null, 2),
      });

      return data;
    } catch (error: any) {
      console.error(
        "❌ [API CLIENT] Error fetching payment status:",
        error.message,
      );
      throw error;
    }
  },

  // ==================== CART METHODS ====================

  /**
   * Get user cart
   */
  getCart: async (): Promise<ApiResponse<Cart>> => {
    try {
      console.log("🛒 Fetching user cart...");

      const token = await getToken();
      if (!token) {
        return {
          success: false,
          message: "Authentication required",
          data: {} as Cart,
        };
      }

      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Cart fetched:", data.data?.items?.length || 0, "items");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching cart:", error.message);
      throw error;
    }
  },

  /**
   * Add to cart
   */
  addToCart: async (
    productId: string,
    quantity: number = 1,
  ): Promise<ApiResponse<CartItem>> => {
    try {
      console.log("➕ Adding to cart:", productId, "Quantity:", quantity);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      const data = await handleApiResponse(response);
      console.log("✅ Item added to cart successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error adding to cart:", error.message);
      throw error;
    }
  },

  /**
   * Update cart item quantity
   */
  updateCartItemQuantity: async (
    cartItemId: string,
    quantity: number,
  ): Promise<ApiResponse<CartItem>> => {
    try {
      console.log(
        "🔄 Updating cart item:",
        cartItemId,
        "New quantity:",
        quantity,
      );

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/cart/update/${cartItemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity }),
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Cart item quantity updated");
      return data;
    } catch (error: any) {
      console.error("❌ Error updating cart item:", error.message);
      throw error;
    }
  },

  /**
   * Remove from cart
   */
  removeFromCart: async (cartItemId: string): Promise<ApiResponse<any>> => {
    try {
      console.log("🗑️ Removing from cart:", cartItemId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/cart/remove/${cartItemId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Item removed from cart");
      return data;
    } catch (error: any) {
      console.error("❌ Error removing from cart:", error.message);
      throw error;
    }
  },

  /**
   * Clear cart
   */
  clearCart: async (): Promise<ApiResponse<any>> => {
    try {
      console.log("🗑️ Clearing cart...");

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/cart/clear`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Cart cleared");
      return data;
    } catch (error: any) {
      console.error("❌ Error clearing cart:", error.message);
      throw error;
    }
  },

  // ==================== FAVORITES METHODS ====================

  /**
   * Get user favorites
   */
  getFavorites: async (): Promise<ApiResponse<FavoriteItem[]>> => {
    try {
      console.log("⭐ Fetching user favorites...");

      const token = await getToken();
      if (!token) {
        return {
          success: false,
          message: "Authentication required",
          data: [],
        };
      }

      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Favorites fetched:", data.data?.length || 0, "items");
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching favorites:", error.message);
      throw error;
    }
  },

  /**
   * Add to favorites
   */
  addToFavorites: async (
    productId: string,
  ): Promise<ApiResponse<FavoriteItem>> => {
    try {
      console.log("⭐ Adding to favorites:", productId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_BASE_URL}/favorites/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      const data = await handleApiResponse(response);
      console.log("✅ Item added to favorites successfully");
      return data;
    } catch (error: any) {
      console.error("❌ Error adding to favorites:", error.message);
      throw error;
    }
  },

  /**
   * Remove from favorites
   */
  removeFromFavorites: async (
    favoriteId: string,
  ): Promise<ApiResponse<any>> => {
    try {
      console.log("🗑️ Removing from favorites:", favoriteId);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/favorites/remove/${favoriteId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      console.log("✅ Item removed from favorites");
      return data;
    } catch (error: any) {
      console.error("❌ Error removing from favorites:", error.message);
      throw error;
    }
  },

  /**
   * Check if product is favorite
   */
  isFavorite: async (productId: string): Promise<{ isFavorite: boolean }> => {
    try {
      console.log("🔍 Checking if product is favorite:", productId);

      const token = await getToken();
      if (!token) {
        return { isFavorite: false };
      }

      const response = await fetch(
        `${API_BASE_URL}/favorites/check/${productId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      return { isFavorite: data.isFavorite };
    } catch (error: any) {
      console.error("❌ Error checking favorite status:", error.message);
      return { isFavorite: false };
    }
  },

  // ==================== AUTHENTICATION METHODS ====================

  /**
   * Forgot password
   */
  forgotPassword: async (
    emailOrPhone: string,
  ): Promise<ForgotPasswordResponse> => {
    try {
      console.log("🔐 Requesting password reset for:", emailOrPhone);

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone }),
      });

      const data = await handleApiResponse(response);

      if (data.success) {
        console.log("✅ Password reset request successful");
        return {
          success: true,
          message:
            data.message || "Password reset instructions sent successfully",
          resetToken: data.resetToken,
          expiresIn: data.expiresIn,
          instructions: data.instructions,
          cooldownRemaining: data.cooldownRemaining,
        };
      } else {
        console.error("❌ Password reset request failed:", data.message);
        return {
          success: false,
          message: data.message || "Failed to send password reset instructions",
        };
      }
    } catch (error: any) {
      console.error("❌ Error requesting password reset:", error.message);
      return {
        success: false,
        message: error.message || "Failed to process password reset request",
      };
    }
  },

  /**
   * Reset password
   */
  resetPassword: async (
    token: string,
    newPassword: string,
    emailOrPhone: string,
  ): Promise<ResetPasswordResponse> => {
    try {
      console.log("🔄 Resetting password...");

      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
          emailOrPhone,
        }),
      });

      const data = await handleApiResponse(response);

      if (data.success) {
        console.log("✅ Password reset successful");
        return {
          success: true,
          message: data.message || "Password reset successfully",
          passwordStrength: data.passwordStrength,
        };
      } else {
        console.error("❌ Password reset failed:", data.message);
        return {
          success: false,
          message: data.message || "Failed to reset password",
        };
      }
    } catch (error: any) {
      console.error("❌ Error resetting password:", error.message);
      return {
        success: false,
        message: error.message || "Failed to reset password",
      };
    }
  },

  /**
   * Update profile
   */
  updateProfile: async (
    profileData: UpdateProfileData,
  ): Promise<ApiResponse<User>> => {
    try {
      console.log("👤 Updating user profile...");
      console.log("📤 Profile data:", JSON.stringify(profileData, null, 2));

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      console.log("📥 Profile update response status:", response.status);

      const data = await handleApiResponse(response);

      if (data.success && data.user) {
        console.log("✅ Profile updated successfully:", data.user.username);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));

        return {
          success: true,
          data: data.user,
          message: data.message || "Profile updated successfully",
        };
      } else {
        console.error("❌ Profile update failed:", data.message);
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("❌ Error updating profile:", error.message);
      console.error("Stack trace:", error.stack);
      throw error;
    }
  },

  /**
   * Change password
   */
  changePassword: async (
    passwordData: ChangePasswordData,
  ): Promise<ApiResponse<{ message: string }>> => {
    try {
      console.log("🔒 Changing user password...");

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      });

      console.log("📥 Password change response status:", response.status);

      const data = await handleApiResponse(response);

      if (data.success) {
        console.log("✅ Password changed successfully");
        return {
          success: true,
          data: { message: data.message || "Password changed successfully" },
          message: data.message || "Password changed successfully",
        };
      } else {
        console.error("❌ Password change failed:", data.message);
        throw new Error(data.message || "Failed to change password");
      }
    } catch (error: any) {
      console.error("❌ Error changing password:", error.message);
      console.error("Stack trace:", error.stack);
      throw error;
    }
  },

  /**
   * Update profile picture
   */
  updateProfilePicture: async (
    imageUri: string,
  ): Promise<ApiResponse<User>> => {
    try {
      console.log("📸 Updating profile picture...");

      const token = await getToken();
      if (!token) {
        console.error("❌ No authentication token available");
        throw new Error("Authentication required");
      }

      console.log("🔑 Using token:", token.substring(0, 30) + "...");

      const formData = new FormData();
      const fileExtension = imageUri.split(".").pop() || "jpg";
      const fileName = `profile_${Date.now()}.${fileExtension}`;

      formData.append("profileImage", {
        uri: imageUri,
        type: `image/${fileExtension}`,
        name: fileName,
      } as any);

      console.log("📤 Uploading profile picture:", fileName);

      const response = await fetch(`${API_BASE_URL}/auth/profile/picture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log(
        "📥 Profile picture upload response status:",
        response.status,
      );

      const data = await handleApiResponse(response);

      if (data.success && data.user) {
        console.log("✅ Profile picture updated successfully");
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        await AsyncStorage.setItem("customProfileImage", imageUri);

        return {
          success: true,
          data: data.user,
          message: data.message || "Profile picture updated successfully",
        };
      } else {
        console.error("❌ Profile picture update failed:", data.message);
        await AsyncStorage.setItem("customProfileImage", imageUri);

        return {
          success: true,
          data: data.user,
          message: "Profile picture saved locally",
        };
      }
    } catch (error: any) {
      console.error("❌ Error updating profile picture:", error.message);
      console.error("Stack trace:", error.stack);

      try {
        await AsyncStorage.setItem("customProfileImage", imageUri);
        console.log("✅ Profile picture saved to AsyncStorage as fallback");
      } catch (storageError) {
        console.error("❌ Failed to save to AsyncStorage:", storageError);
      }

      throw error;
    }
  },

  /**
   * Create guest session
   */
  createGuestSession: async (): Promise<AuthResponse> => {
    try {
      console.log("🎭 Creating guest session...");

      const response = await fetch(`${API_BASE_URL}/auth/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await handleApiResponse(response);

      if (data.token) {
        console.log(
          "✅ Guest token received:",
          data.token.substring(0, 30) + "...",
        );
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        console.log("💾 Guest session saved to storage");
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error creating guest session:", error.message);
      throw error;
    }
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<{ success: boolean; user: User }> => {
    try {
      console.log("👤 Getting current user...");

      const token = await getToken();
      if (!token) {
        console.log("⚠️ No token available, creating guest session...");
        const guestData = await apiClient.createGuestSession();
        if (guestData.user) {
          return { success: true, user: guestData.user };
        }
        throw new Error("Failed to create guest session");
      }

      console.log("📡 Fetching user profile with token...");
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (
        response.status === 401 ||
        response.status === 403 ||
        response.status === 404
      ) {
        console.warn(
          "⚠️ Token invalid or user not found. Creating new guest session...",
        );
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");

        const guestData = await apiClient.createGuestSession();
        if (guestData.user) {
          console.log("✅ Guest user created:", guestData.user.username);
          return { success: true, user: guestData.user };
        }

        throw new Error("Failed to create guest session");
      }

      const data = await handleApiResponse(response);

      if (data.user) {
        console.log(
          "✅ User profile retrieved:",
          data.user.username,
          "(Guest:",
          data.user.isGuest,
          ")",
        );
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error fetching user profile:", error.message);
      if (
        error.message.includes("401") ||
        error.message.includes("403") ||
        error.message.includes("404")
      ) {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
      }
      throw error;
    }
  },

  /**
   * Get user profile
   */
  getUserProfile: async (): Promise<{ success: boolean; user: User }> => {
    return await apiClient.getCurrentUser();
  },

  /**
   * Get user from storage
   */
  getUserFromStorage: async (): Promise<User | null> => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        console.log(
          "📱 User from storage:",
          user.username,
          "(Guest:",
          user.isGuest,
          ")",
        );
        return user;
      }
      console.log("⚠️ No user in storage");
      return null;
    } catch (error: any) {
      console.error("❌ Error getting user from storage:", error.message);
      return null;
    }
  },

  /**
   * Check if authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await getToken();
    const isAuth = !!token;
    console.log("🔐 Is authenticated:", isAuth);
    return isAuth;
  },

  /**
   * Login
   */
  login: async (
    emailOrPhone: string,
    password: string,
    role: string,
  ): Promise<LoginResponse> => {
    try {
      console.log("🔑 Attempting login for:", emailOrPhone, "Role:", role);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, password, role }),
      });

      const responseText = await response.text();
      console.log("📥 Raw login response:", responseText);

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("❌ Failed to parse login response:", parseError);
        throw new Error("Invalid response from server");
      }

      // Handle different status codes with proper delay information
      if (!response.ok) {
        console.error("❌ Login failed with status:", response.status);

        if (response.status === 429) {
          // Rate limiting - delay active
          const loginResponse: LoginResponse = {
            success: false,
            message: data.message || "Too many attempts. Please wait.",
            delayActive: true,
            remainingTime: data.remainingTime,
            failedAttempts: data.failedAttempts,
            delaySeconds: data.delaySeconds,
          };
          return loginResponse;
        } else if (response.status === 400) {
          // Client error - invalid credentials with attempt info
          const loginResponse: LoginResponse = {
            success: false,
            message: data.message || "Invalid credentials",
            failedAttempts: data.failedAttempts || 1,
            delayActive: data.delayActive || false,
            delaySeconds: data.delaySeconds || 0,
          };
          return loginResponse;
        } else if (response.status === 500) {
          // Server error
          throw new Error(
            JSON.stringify({
              type: "SERVER_ERROR",
              message: data.message || "Server error. Please try again later.",
            }),
          );
        } else {
          // Other errors
          throw new Error(
            JSON.stringify({
              type: "UNKNOWN_ERROR",
              message: data.message || `Login failed: ${response.status}`,
            }),
          );
        }
      }

      // SUCCESS case
      if (data.token) {
        console.log("✅ Login successful!");
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
      }

      // Return success response with all data
      const loginResponse: LoginResponse = {
        success: true,
        message: data.message || "Login successful!",
        token: data.token,
        user: data.user,
        redirectTo: data.redirectTo,
      };

      return loginResponse;
    } catch (error: any) {
      console.error("❌ Error in login API call:", error.message);

      // Handle JSON stringified errors
      try {
        const errorData = JSON.parse(error.message);
        const loginResponse: LoginResponse = {
          success: false,
          message: errorData.message || "Login failed",
          delayActive: errorData.type === "DELAY_ACTIVE",
          remainingTime: errorData.remainingTime,
          failedAttempts: errorData.failedAttempts,
          delaySeconds: errorData.delaySeconds,
        };
        return loginResponse;
      } catch {
        // Regular error
        const loginResponse: LoginResponse = {
          success: false,
          message: error.message || "Login failed",
        };
        return loginResponse;
      }
    }
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    try {
      console.log("🚪 Logging out...");
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      console.log("✅ Logout successful");
    } catch (error: any) {
      console.error("❌ Error logging out:", error.message);
      throw error;
    }
  },

  /**
   * Convert guest to user
   */
  convertGuestToUser: async (
    userId: string,
    email: string,
    username: string,
    password: string,
    phoneNumber: string,
  ): Promise<AuthResponse> => {
    try {
      console.log("🔄 Converting guest to user:", userId);

      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/auth/convert-guest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId,
          email,
          username,
          password,
          phoneNumber,
        }),
      });

      const data = await handleApiResponse(response);

      if (data.token) {
        console.log("✅ Guest converted successfully!");
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error converting guest account:", error.message);
      throw error;
    }
  },

  /**
   * Get user appointments
   */
  getUserAppointments: async (): Promise<ApiResponse<Appointment[]>> => {
    try {
      console.log("📅 Fetching user appointments...");

      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      console.log("✅ Appointments fetched:", data.count || 0);
      return data;
    } catch (error: any) {
      console.error("❌ Error fetching appointments:", error.message);
      throw error;
    }
  },
};

export default apiClient;

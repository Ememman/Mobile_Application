// mobile-app/app/services/webSocketService.ts
import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

// Base WebSocket URL (can point to Render backend or local dev machine)
const WS_URL = "https://sandrealeesalon.onrender.com";

type ListenerCallback = (data: any) => void;

class MobileWebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private listeners: Map<string, Set<ListenerCallback>> = new Map();
  private userContext: { userId?: string; role?: string } | null = null;

  public connect(userContext?: { userId?: string; role?: string }): Socket {
    if (userContext) {
      this.userContext = userContext;
    }

    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.connect();
      return this.socket;
    }

    console.log("📱 [Mobile WS] Connecting to:", WS_URL);

    this.socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      query: { clientType: "mobile-app" },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2500,
    });

    this.socket.on("connect", () => {
      console.log("✅ [Mobile WS] Connected! Socket ID:", this.socket?.id);
      this.isConnected = true;
      this.triggerListeners("connected", { socketId: this.socket?.id });

      // Join mobile app room and user room if logged in
      if (this.userContext?.userId) {
        this.joinMobileClient(this.userContext.userId, this.userContext.role || "customer");
      } else {
        this.socket?.emit("join-mobile-client", { role: "guest" });
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ [Mobile WS] Disconnected:", reason);
      this.isConnected = false;
      this.triggerListeners("disconnected", { reason });
    });

    this.socket.on("connect_error", (error) => {
      console.warn("⚠️ [Mobile WS] Connection error:", error.message);
      this.isConnected = false;
    });

    // Handle real-time push notification
    this.socket.on("new_notification", (notification: any) => {
      console.log("🔔 [Mobile WS] Real-time notification received:", notification);
      Toast.show({
        type: "success",
        text1: notification.title || "New Notification",
        text2: notification.message || "You have an update from the salon.",
        visibilityTime: 4000,
      });
      this.triggerListeners("new_notification", notification);
    });

    // Handle real-time booking update
    this.socket.on("booking-update", (data: any) => {
      console.log("📅 [Mobile WS] Booking update:", data);
      Toast.show({
        type: "info",
        text1: "Booking Update",
        text2: data.action === "rescheduled" ? "Your appointment was rescheduled." : "Your booking status was updated.",
        visibilityTime: 3500,
      });
      this.triggerListeners("booking-update", data);
    });

    // Handle real-time order update
    this.socket.on("order-update", (data: any) => {
      console.log("📦 [Mobile WS] Order update:", data);
      Toast.show({
        type: "info",
        text1: "Order Update",
        text2: `Order status changed to ${data.status || "updated"}`,
        visibilityTime: 3500,
      });
      this.triggerListeners("order-update", data);
    });

    return this.socket;
  }

  public joinMobileClient(userId: string, role: string = "customer"): void {
    this.userContext = { userId, role };
    if (!this.socket) {
      this.connect({ userId, role });
      return;
    }

    this.socket.emit("join-mobile-client", { userId, role });
    this.socket.emit("join-customer-notifications", { customerId: userId });
    this.socket.emit("join-appointment-updates", { customerId: userId });
    console.log(`📱 [Mobile WS] Registered user ${userId} (${role})`);
  }

  public on(event: string, callback: ListenerCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    return () => this.off(event, callback);
  }

  public off(event: string, callback: ListenerCallback): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  private triggerListeners(event: string, data: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in mobile ws listener for ${event}:`, e);
        }
      });
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  public getStatus(): boolean {
    return this.isConnected && !!this.socket?.connected;
  }
}

export const mobileWebSocketService = new MobileWebSocketService();
export default mobileWebSocketService;


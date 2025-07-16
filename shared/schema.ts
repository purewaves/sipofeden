import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Juice product
export const juices = sqliteTable("juices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  stock: integer("stock").notNull().default(0),
  featured: integer("featured", { mode: 'boolean' }).default(false),
  sku: text("sku").notNull().unique()
});

export const juicesRelations = relations(juices, ({ many }) => ({
  cartItems: many(cartItems),
  orderItems: many(orderItems)
}));

export const insertJuiceSchema = createInsertSchema(juices).omit({
  id: true
});

// Cart items
export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  juiceId: integer("juice_id").notNull(),
  sessionId: text("session_id").notNull(),
  quantity: integer("quantity").notNull().default(1)
});

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  juice: one(juices, {
    fields: [cartItems.juiceId],
    references: [juices.id]
  })
}));

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true
});

// Subscription plans
export const subscriptionPlans = sqliteTable("subscription_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  frequency: text("frequency").notNull(), // weekly, monthly, etc.
  features: text("features").notNull(), // JSON string of features array
  createdAt: text("created_at").default('CURRENT_TIMESTAMP')
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true
});

// Subscription orders (for individual customer subscriptions)
export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: integer("plan_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address").notNull(),
  status: text("status").notNull().default("active"), // active, paused, cancelled
  startDate: text("start_date").notNull(),
  nextDelivery: text("next_delivery"),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP')
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id]
  })
}));

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true
});

// Juice Bundles
export const bundles = sqliteTable("bundles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  juiceIds: text("juice_ids").notNull(), // JSON string of juice IDs array
  imageUrl: text("image_url"),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP')
});

export const insertBundleSchema = createInsertSchema(bundles).omit({
  id: true,
  createdAt: true
});

// Order Table
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  total: real("total").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull() // Store as ISO string
});

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems)
}));

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true
});

// Order Items Table
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  juiceId: integer("juice_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull() // Price at time of order
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  juice: one(juices, {
    fields: [orderItems.juiceId],
    references: [juices.id]
  })
}));

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true
});

// Admin table
export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").default(''),
  fullName: text("full_name").default(''),
  phoneNumber: text("phone_number").default(''),
  isFirstLogin: integer("is_first_login", { mode: 'boolean' }).default(true),
  lastLogin: text("last_login").default('')
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true
});

// Loyalty Customers table
export const loyaltyCustomers = sqliteTable("loyalty_customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  totalPoints: integer("total_points").notNull().default(0),
  tier: text("tier").notNull().default("Bronze"),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP')
});

export const insertLoyaltyCustomerSchema = createInsertSchema(loyaltyCustomers).omit({
  id: true,
  createdAt: true
});

// Loyalty Rewards table
export const loyaltyRewards = sqliteTable("loyalty_rewards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull(),
  pointsUsed: integer("points_used").notNull(),
  rewardType: text("reward_type").notNull(),
  rewardValue: real("reward_value").notNull(),
  status: text("status").notNull().default("active"),
  redeemedAt: text("redeemed_at"),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP')
});

export const loyaltyRewardsRelations = relations(loyaltyRewards, ({ one }) => ({
  customer: one(loyaltyCustomers, {
    fields: [loyaltyRewards.customerId],
    references: [loyaltyCustomers.id]
  })
}));

export const insertLoyaltyRewardSchema = createInsertSchema(loyaltyRewards).omit({
  id: true,
  createdAt: true
});

// Loyalty Activities table
export const loyaltyActivities = sqliteTable("loyalty_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull(),
  activityType: text("activity_type").notNull(),
  pointsEarned: integer("points_earned").notNull(),
  source: text("source").notNull(),
  sourceId: text("source_id"),
  description: text("description"),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP')
});

export const loyaltyActivitiesRelations = relations(loyaltyActivities, ({ one }) => ({
  customer: one(loyaltyCustomers, {
    fields: [loyaltyActivities.customerId],
    references: [loyaltyCustomers.id]
  })
}));

export const insertLoyaltyActivitySchema = createInsertSchema(loyaltyActivities).omit({
  id: true,
  createdAt: true
});

// Website Settings table
export const websiteSettings = sqliteTable("website_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteName: text("site_name").notNull().default("Sip of Eden"),
  siteDescription: text("site_description").notNull().default("Organic Cold-Pressed Juices"),
  contactEmail: text("contact_email").notNull().default("hello@sipofeden.com"),
  contactPhone: text("contact_phone").notNull().default("+1 (555) 123-4567"),
  address: text("address").notNull().default("123 Juice St, Fresh City, FC 12345"),
  socialMediaLinks: text("social_media_links").notNull().default('{}'), // JSON string
  businessHours: text("business_hours").notNull().default('{}'), // JSON string
  shippingInfo: text("shipping_info").notNull().default("We offer free shipping on orders over $50"),
  returnPolicy: text("return_policy").notNull().default("30-day return policy on all products"),
  privacyPolicy: text("privacy_policy").notNull().default("Your privacy is important to us"),
  termsOfService: text("terms_of_service").notNull().default("Terms and conditions apply"),
  aboutUs: text("about_us").notNull().default("We are passionate about providing fresh, organic cold-pressed juices"),
  updatedAt: text("updated_at").default('CURRENT_TIMESTAMP')
});

export const insertWebsiteSettingsSchema = createInsertSchema(websiteSettings).omit({
  id: true,
  updatedAt: true
});

// Admin Notification Subscriptions table
export const adminNotificationSubscriptions = sqliteTable("admin_notification_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  adminId: integer("admin_id").notNull(),
  subscription: text("subscription").notNull(), // JSON string of push subscription
  userAgent: text("user_agent"),
  deviceName: text("device_name"),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP'),
  lastUsed: text("last_used")
});

export const adminNotificationSubscriptionsRelations = relations(adminNotificationSubscriptions, ({ one }) => ({
  admin: one(admins, {
    fields: [adminNotificationSubscriptions.adminId],
    references: [admins.id]
  })
}));

export const insertAdminNotificationSubscriptionSchema = createInsertSchema(adminNotificationSubscriptions).omit({
  id: true,
  createdAt: true
});

// Users table for email/OTP authentication
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  isVerified: integer("is_verified", { mode: 'boolean' }).default(false),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP'),
  lastLogin: text("last_login")
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true
});

// OTP verification table
export const otpVerifications = sqliteTable("otp_verifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: text("expires_at").notNull(),
  isUsed: integer("is_used", { mode: 'boolean' }).default(false),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP')
});

export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({
  id: true,
  createdAt: true
});

// Type exports
export type Juice = typeof juices.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof insertUserSchema._input;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = typeof insertOtpVerificationSchema._input;
export type InsertJuice = z.infer<typeof insertJuiceSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Bundle = typeof bundles.$inferSelect;
export type InsertBundle = z.infer<typeof insertBundleSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

export type LoyaltyCustomer = typeof loyaltyCustomers.$inferSelect;
export type InsertLoyaltyCustomer = z.infer<typeof insertLoyaltyCustomerSchema>;

export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;
export type InsertLoyaltyReward = z.infer<typeof insertLoyaltyRewardSchema>;

export type LoyaltyActivity = typeof loyaltyActivities.$inferSelect;
export type InsertLoyaltyActivity = z.infer<typeof insertLoyaltyActivitySchema>;

export type WebsiteSettings = typeof websiteSettings.$inferSelect;
export type UpdateWebsiteSettings = Partial<InsertWebsiteSettings>;
export type InsertWebsiteSettings = z.infer<typeof insertWebsiteSettingsSchema>;

export type AdminNotificationSubscription = typeof adminNotificationSubscriptions.$inferSelect;
export type InsertAdminNotificationSubscription = z.infer<typeof insertAdminNotificationSubscriptionSchema>;
export type UpdateAdminNotificationSubscription = Partial<InsertAdminNotificationSubscription>;

export type UpdateAdminProfile = {
  email?: string;
  fullName?: string;
  phoneNumber?: string;
};

export type UpdateLoyaltyPoints = {
  customerId: number;
  points: number;
  type: "earned" | "spent";
  source: string;
  sourceId?: string;
};
import { pgTable as table, text, integer, boolean, doublePrecision, primaryKey, timestamp, varchar, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Juice product
export const juices = table("juices", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  imageUrl: varchar("image_url", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  stock: integer("stock").notNull().default(0),
  featured: boolean("featured").default(false),
  sku: varchar("sku", { length: 100 }).notNull().unique()
});

export const juicesRelations = relations(juices, ({ many }) => ({
  cartItems: many(cartItems),
  orderItems: many(orderItems)
}));

export const insertJuiceSchema = createInsertSchema(juices).omit({
  id: true
});

// Dynamic types for runtime use (not stored in database)
// These will be added by the application logic at runtime

// Cart items
export const cartItems = table("cart_items", {
  id: serial("id").primaryKey(),
  juiceId: integer("juice_id").notNull(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
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
export const subscriptionPlans = table("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  frequency: varchar("frequency", { length: 100 }).notNull(), // weekly, monthly, etc.
  features: text("features").notNull(), // JSON string of features array
  createdAt: timestamp("created_at").defaultNow()
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true
});

// Subscription orders (for individual customer subscriptions)
export const subscriptions = table("subscriptions", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address").notNull(),
  status: varchar("status", { length: 100 }).notNull().default("active"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  nextDelivery: timestamp("next_delivery").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
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
export const bundles = table("bundles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  juiceIds: text("juice_ids").notNull(), // JSON string of juice IDs array
  imageUrl: varchar("image_url", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertBundleSchema = createInsertSchema(bundles).omit({
  id: true,
  createdAt: true
});

// Order Table
export const orders = table("orders", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  total: doublePrecision("total").notNull(),
  status: varchar("status", { length: 100 }).notNull().default("pending"),
  createdAt: varchar("created_at", { length: 255 }).notNull() // Store as ISO string
});

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems)
}));

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true
});

// Order Items
export const orderItems = table("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  juiceId: integer("juice_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull()
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

// Admin users
export const admins = table("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).default(""),
  fullName: varchar("full_name", { length: 255 }).default(""),
  phoneNumber: varchar("phone_number", { length: 20 }).default(""),
  isFirstLogin: boolean("is_first_login").default(false),
  lastLogin: varchar("last_login", { length: 255 }).default(""),
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true
});

export const updateAdminProfileSchema = createInsertSchema(admins).omit({
  id: true,
  username: true,
  password: true,
  isFirstLogin: true,
  lastLogin: true
});

export const updateAdminPasswordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// Schema types
export type Juice = typeof juices.$inferSelect & {
  calculatedSales?: number; // Optional runtime-only property for analytics
};
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

// Loyalty Points
export const loyaltyCustomers = table("loyalty_customers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  points: integer("points").notNull().default(0),
  tier: varchar("tier", { length: 100 }).notNull().default("bronze"), // bronze, silver, gold, platinum
  createdAt: timestamp("created_at").defaultNow()
});

export const insertLoyaltyCustomerSchema = createInsertSchema(loyaltyCustomers).omit({
  id: true,
  points: true,
  tier: true,
  createdAt: true
});

export const updateLoyaltyPointsSchema = z.object({
  email: z.string().email("Valid email is required"),
  points: z.number().int("Points must be a whole number"),
  source: z.string() // 'order', 'subscription', 'referral', etc.
});

export const loyaltyRewards = table("loyalty_rewards", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  description: text("description").notNull(),
  pointsRequired: integer("points_required").notNull(),
  redeemed: boolean("redeemed").default(false),
  redeemedAt: timestamp("redeemed_at").defaultNow(),
  expiresAt: timestamp("expires_at").defaultNow()
});

export const loyaltyRewardsRelations = relations(loyaltyRewards, ({ one }) => ({
  customer: one(loyaltyCustomers, {
    fields: [loyaltyRewards.customerId],
    references: [loyaltyCustomers.id]
  })
}));

export const insertLoyaltyRewardSchema = createInsertSchema(loyaltyRewards).omit({
  id: true,
  redeemed: true,
  redeemedAt: true
});

export const loyaltyActivities = table("loyalty_activities", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  points: integer("points").notNull(),
  type: varchar("type", { length: 100 }).notNull(), // 'earn' or 'redeem'
  source: varchar("source", { length: 255 }).notNull(), // 'order', 'subscription', 'referral', 'reward', etc.
  sourceId: varchar("source_id", { length: 255 }), // Optional reference to the source object ID (order ID, etc.)
  createdAt: timestamp("created_at").defaultNow()
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

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type UpdateAdminProfile = z.infer<typeof updateAdminProfileSchema>;
export type UpdateAdminPassword = z.infer<typeof updateAdminPasswordSchema>;

export type LoyaltyCustomer = typeof loyaltyCustomers.$inferSelect;
export type InsertLoyaltyCustomer = z.infer<typeof insertLoyaltyCustomerSchema>;
export type UpdateLoyaltyPoints = z.infer<typeof updateLoyaltyPointsSchema>;

export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;
export type InsertLoyaltyReward = z.infer<typeof insertLoyaltyRewardSchema>;

export type LoyaltyActivity = typeof loyaltyActivities.$inferSelect;
export type InsertLoyaltyActivity = z.infer<typeof insertLoyaltyActivitySchema>;

// Website Settings
export const websiteSettings = table("website_settings", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().default("Sip of Eden"),
  businessEmail: varchar("business_email", { length: 255 }).notNull().default("contact@sipofeden.com"),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull().default("+234 000 0000 000"),
  address: text("address").notNull().default("Lagos, Nigeria"),
  instagram: varchar("instagram", { length: 255 }).default("https://instagram.com/sipofeden"),
  twitter: varchar("twitter", { length: 255 }).default("https://twitter.com/sipofeden"),
  facebook: varchar("facebook", { length: 255 }).default("https://facebook.com/sipofeden"),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const updateWebsiteSettingsSchema = createInsertSchema(websiteSettings).omit({
  id: true,
  updatedAt: true
});

export type WebsiteSettings = typeof websiteSettings.$inferSelect;
export type UpdateWebsiteSettings = z.infer<typeof updateWebsiteSettingsSchema>;

// Admin Notification Subscriptions
export const adminNotificationSubscriptions = table("admin_notification_subscriptions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => admins.id, { onDelete: 'cascade' }),
  subscription: text("subscription").notNull(), // JSON string of PushSubscription object
  userAgent: varchar("user_agent", { length: 255 }), // Browser user agent info
  deviceName: varchar("device_name", { length: 255 }), // Custom device name (optional)
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at").defaultNow()
});

export const adminNotificationSubscriptionsRelations = relations(adminNotificationSubscriptions, ({ one }) => ({
  admin: one(admins, {
    fields: [adminNotificationSubscriptions.adminId],
    references: [admins.id]
  })
}));

export type AdminNotificationSubscription = typeof adminNotificationSubscriptions.$inferSelect;
export type InsertAdminNotificationSubscription = typeof adminNotificationSubscriptions.$inferInsert;
export const insertAdminNotificationSubscriptionSchema = createInsertSchema(adminNotificationSubscriptions).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true
});
export type UpdateAdminNotificationSubscription = Partial<Omit<InsertAdminNotificationSubscription, 'id'>>;
import { pgTable, text, serial, integer, boolean, doublePrecision, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Juice product
export const juices = pgTable("juices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  stock: integer("stock").notNull().default(0),
  featured: boolean("featured").default(false),
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
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
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
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  frequency: text("frequency").notNull(), // weekly, monthly, etc.
  features: text("features").array().notNull(), // Array of features
  createdAt: timestamp("created_at").defaultNow()
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true
});

// Subscription orders (for individual customer subscriptions)
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address").notNull(),
  status: text("status").notNull().default("active"), // active, paused, cancelled
  startDate: timestamp("start_date").notNull(),
  nextDelivery: timestamp("next_delivery"),
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
export const bundles = pgTable("bundles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  juiceIds: integer("juice_ids").array().notNull(), // Array of juice IDs
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertBundleSchema = createInsertSchema(bundles).omit({
  id: true,
  createdAt: true
});

// Order Table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  total: doublePrecision("total").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull() // Store as ISO string
});

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems)
}));

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true
});

// Order Items
export const orderItems = pgTable("order_items", {
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
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").default(""),
  fullName: text("full_name").default(""),
  phoneNumber: text("phone_number").default(""),
  isFirstLogin: boolean("is_first_login").default(true),
  lastLogin: text("last_login").default(""),
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
export type Juice = typeof juices.$inferSelect;
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
export const loyaltyCustomers = pgTable("loyalty_customers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  points: integer("points").notNull().default(0),
  tier: text("tier").notNull().default("bronze"), // bronze, silver, gold, platinum
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

export const loyaltyRewards = pgTable("loyalty_rewards", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  description: text("description").notNull(),
  pointsRequired: integer("points_required").notNull(),
  redeemed: boolean("redeemed").default(false),
  redeemedAt: timestamp("redeemed_at"),
  expiresAt: timestamp("expires_at")
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

export const loyaltyActivities = pgTable("loyalty_activities", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  points: integer("points").notNull(),
  type: text("type").notNull(), // 'earn' or 'redeem'
  source: text("source").notNull(), // 'order', 'subscription', 'referral', 'reward', etc.
  sourceId: text("source_id"), // Optional reference to the source object ID (order ID, etc.)
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
export const websiteSettings = pgTable("website_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("Sip of Eden"),
  businessEmail: text("business_email").notNull().default("contact@sipofeden.com"),
  phoneNumber: text("phone_number").notNull().default("+234 000 0000 000"),
  address: text("address").notNull().default("Lagos, Nigeria"),
  instagram: text("instagram").default("https://instagram.com/sipofeden"),
  twitter: text("twitter").default("https://twitter.com/sipofeden"),
  facebook: text("facebook").default("https://facebook.com/sipofeden"),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const updateWebsiteSettingsSchema = createInsertSchema(websiteSettings).omit({
  id: true,
  updatedAt: true
});

export type WebsiteSettings = typeof websiteSettings.$inferSelect;
export type UpdateWebsiteSettings = z.infer<typeof updateWebsiteSettingsSchema>;
import { pgTable, text, serial, integer, boolean, doublePrecision, primaryKey } from "drizzle-orm/pg-core";
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
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  plan: text("plan").notNull(),
  // Additional fields can be added here
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true
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
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true
});

// We'll need to implement these after we run the migrations
export const updateAdminProfileSchema = z.object({
  email: z.string().email("Invalid email").optional(),
  fullName: z.string().min(3, "Full name must be at least 3 characters").optional(),
  phoneNumber: z.string().optional(),
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

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type UpdateAdminProfile = z.infer<typeof updateAdminProfileSchema>;
export type UpdateAdminPassword = z.infer<typeof updateAdminPasswordSchema>;
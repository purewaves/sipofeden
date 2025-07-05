"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertAdminNotificationSubscriptionSchema = exports.adminNotificationSubscriptionsRelations = exports.adminNotificationSubscriptions = exports.updateWebsiteSettingsSchema = exports.websiteSettings = exports.insertLoyaltyActivitySchema = exports.loyaltyActivitiesRelations = exports.loyaltyActivities = exports.insertLoyaltyRewardSchema = exports.loyaltyRewardsRelations = exports.loyaltyRewards = exports.updateLoyaltyPointsSchema = exports.insertLoyaltyCustomerSchema = exports.loyaltyCustomers = exports.updateAdminPasswordSchema = exports.updateAdminProfileSchema = exports.insertAdminSchema = exports.admins = exports.insertOrderItemSchema = exports.orderItemsRelations = exports.orderItems = exports.insertOrderSchema = exports.ordersRelations = exports.orders = exports.insertBundleSchema = exports.bundles = exports.insertSubscriptionSchema = exports.subscriptionsRelations = exports.subscriptions = exports.insertSubscriptionPlanSchema = exports.subscriptionPlans = exports.insertCartItemSchema = exports.cartItemsRelations = exports.cartItems = exports.insertJuiceSchema = exports.juicesRelations = exports.juices = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_zod_1 = require("drizzle-zod");
var zod_1 = require("zod");
var drizzle_orm_1 = require("drizzle-orm");
// Juice product
exports.juices = (0, pg_core_1.pgTable)("juices", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    price: (0, pg_core_1.doublePrecision)("price").notNull(),
    imageUrl: (0, pg_core_1.varchar)("image_url", { length: 255 }).notNull(),
    category: (0, pg_core_1.varchar)("category", { length: 100 }).notNull(),
    stock: (0, pg_core_1.integer)("stock").notNull().default(0),
    featured: (0, pg_core_1.boolean)("featured").default(false),
    sku: (0, pg_core_1.varchar)("sku", { length: 100 }).notNull().unique()
});
exports.juicesRelations = (0, drizzle_orm_1.relations)(exports.juices, function (_a) {
    var many = _a.many;
    return ({
        cartItems: many(exports.cartItems),
        orderItems: many(exports.orderItems)
    });
});
exports.insertJuiceSchema = (0, drizzle_zod_1.createInsertSchema)(exports.juices).omit({
    id: true
});
// Dynamic types for runtime use (not stored in database)
// These will be added by the application logic at runtime
// Cart items
exports.cartItems = (0, pg_core_1.pgTable)("cart_items", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    juiceId: (0, pg_core_1.integer)("juice_id").notNull(),
    sessionId: (0, pg_core_1.varchar)("session_id", { length: 255 }).notNull(),
    quantity: (0, pg_core_1.integer)("quantity").notNull().default(1)
});
exports.cartItemsRelations = (0, drizzle_orm_1.relations)(exports.cartItems, function (_a) {
    var one = _a.one;
    return ({
        juice: one(exports.juices, {
            fields: [exports.cartItems.juiceId],
            references: [exports.juices.id]
        })
    });
});
exports.insertCartItemSchema = (0, drizzle_zod_1.createInsertSchema)(exports.cartItems).omit({
    id: true
});
// Subscription plans
exports.subscriptionPlans = (0, pg_core_1.pgTable)("subscription_plans", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    price: (0, pg_core_1.doublePrecision)("price").notNull(),
    frequency: (0, pg_core_1.varchar)("frequency", { length: 100 }).notNull(), // weekly, monthly, etc.
    features: (0, pg_core_1.text)("features").notNull(), // JSON string of features array
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow()
});
exports.insertSubscriptionPlanSchema = (0, drizzle_zod_1.createInsertSchema)(exports.subscriptionPlans).omit({
    id: true,
    createdAt: true
});
// Subscription orders (for individual customer subscriptions)
exports.subscriptions = (0, pg_core_1.pgTable)("subscriptions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    planId: (0, pg_core_1.integer)("plan_id").notNull(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull(),
    phone: (0, pg_core_1.varchar)("phone", { length: 20 }),
    address: (0, pg_core_1.text)("address").notNull(),
    status: (0, pg_core_1.varchar)("status", { length: 100 }).notNull().default("active"),
    startDate: (0, pg_core_1.timestamp)("start_date").notNull().defaultNow(),
    nextDelivery: (0, pg_core_1.timestamp)("next_delivery").defaultNow(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow()
});
exports.subscriptionsRelations = (0, drizzle_orm_1.relations)(exports.subscriptions, function (_a) {
    var one = _a.one;
    return ({
        plan: one(exports.subscriptionPlans, {
            fields: [exports.subscriptions.planId],
            references: [exports.subscriptionPlans.id]
        })
    });
});
exports.insertSubscriptionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.subscriptions).omit({
    id: true,
    createdAt: true
});
// Juice Bundles
exports.bundles = (0, pg_core_1.pgTable)("bundles", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    price: (0, pg_core_1.doublePrecision)("price").notNull(),
    juiceIds: (0, pg_core_1.text)("juice_ids").notNull(), // JSON string of juice IDs array
    imageUrl: (0, pg_core_1.varchar)("image_url", { length: 255 }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow()
});
exports.insertBundleSchema = (0, drizzle_zod_1.createInsertSchema)(exports.bundles).omit({
    id: true,
    createdAt: true
});
// Order Table
exports.orders = (0, pg_core_1.pgTable)("orders", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    customerName: (0, pg_core_1.varchar)("customer_name", { length: 255 }).notNull(),
    customerEmail: (0, pg_core_1.varchar)("customer_email", { length: 255 }).notNull(),
    total: (0, pg_core_1.doublePrecision)("total").notNull(),
    status: (0, pg_core_1.varchar)("status", { length: 100 }).notNull().default("pending"),
    createdAt: (0, pg_core_1.varchar)("created_at", { length: 255 }).notNull() // Store as ISO string
});
exports.ordersRelations = (0, drizzle_orm_1.relations)(exports.orders, function (_a) {
    var many = _a.many;
    return ({
        items: many(exports.orderItems)
    });
});
exports.insertOrderSchema = (0, drizzle_zod_1.createInsertSchema)(exports.orders).omit({
    id: true
});
// Order Items
exports.orderItems = (0, pg_core_1.pgTable)("order_items", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    orderId: (0, pg_core_1.integer)("order_id"),
    juiceId: (0, pg_core_1.integer)("juice_id").notNull(),
    quantity: (0, pg_core_1.integer)("quantity").notNull(),
    price: (0, pg_core_1.doublePrecision)("price").notNull()
});
exports.orderItemsRelations = (0, drizzle_orm_1.relations)(exports.orderItems, function (_a) {
    var one = _a.one;
    return ({
        order: one(exports.orders, {
            fields: [exports.orderItems.orderId],
            references: [exports.orders.id]
        }),
        juice: one(exports.juices, {
            fields: [exports.orderItems.juiceId],
            references: [exports.juices.id]
        })
    });
});
exports.insertOrderItemSchema = (0, drizzle_zod_1.createInsertSchema)(exports.orderItems).omit({
    id: true,
    orderId: true
});
// Admin users
exports.admins = (0, pg_core_1.pgTable)("admins", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.varchar)("username", { length: 255 }).notNull().unique(),
    password: (0, pg_core_1.varchar)("password", { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).default(""),
    fullName: (0, pg_core_1.varchar)("full_name", { length: 255 }).default(""),
    phoneNumber: (0, pg_core_1.varchar)("phone_number", { length: 20 }).default(""),
    isFirstLogin: (0, pg_core_1.boolean)("is_first_login").default(false),
    lastLogin: (0, pg_core_1.varchar)("last_login", { length: 255 }).default(""),
});
exports.insertAdminSchema = (0, drizzle_zod_1.createInsertSchema)(exports.admins).omit({
    id: true
});
exports.updateAdminProfileSchema = (0, drizzle_zod_1.createInsertSchema)(exports.admins).omit({
    id: true,
    username: true,
    password: true,
    isFirstLogin: true,
    lastLogin: true
});
exports.updateAdminPasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(6, "Current password is required"),
    newPassword: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: zod_1.z.string().min(6, "Confirm password is required")
}).refine(function (data) { return data.newPassword === data.confirmPassword; }, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});
// Loyalty Points
exports.loyaltyCustomers = (0, pg_core_1.pgTable)("loyalty_customers", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    points: (0, pg_core_1.integer)("points").notNull().default(0),
    tier: (0, pg_core_1.varchar)("tier", { length: 100 }).notNull().default("bronze"), // bronze, silver, gold, platinum
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow()
});
exports.insertLoyaltyCustomerSchema = (0, drizzle_zod_1.createInsertSchema)(exports.loyaltyCustomers).omit({
    id: true,
    points: true,
    tier: true,
    createdAt: true
});
exports.updateLoyaltyPointsSchema = zod_1.z.object({
    email: zod_1.z.string().email("Valid email is required"),
    points: zod_1.z.number().int("Points must be a whole number"),
    source: zod_1.z.string() // 'order', 'subscription', 'referral', etc.
});
exports.loyaltyRewards = (0, pg_core_1.pgTable)("loyalty_rewards", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    customerId: (0, pg_core_1.integer)("customer_id").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    pointsRequired: (0, pg_core_1.integer)("points_required").notNull(),
    redeemed: (0, pg_core_1.boolean)("redeemed").default(false),
    redeemedAt: (0, pg_core_1.timestamp)("redeemed_at").defaultNow(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at").defaultNow()
});
exports.loyaltyRewardsRelations = (0, drizzle_orm_1.relations)(exports.loyaltyRewards, function (_a) {
    var one = _a.one;
    return ({
        customer: one(exports.loyaltyCustomers, {
            fields: [exports.loyaltyRewards.customerId],
            references: [exports.loyaltyCustomers.id]
        })
    });
});
exports.insertLoyaltyRewardSchema = (0, drizzle_zod_1.createInsertSchema)(exports.loyaltyRewards).omit({
    id: true,
    redeemed: true,
    redeemedAt: true
});
exports.loyaltyActivities = (0, pg_core_1.pgTable)("loyalty_activities", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    customerId: (0, pg_core_1.integer)("customer_id").notNull(),
    points: (0, pg_core_1.integer)("points").notNull(),
    type: (0, pg_core_1.varchar)("type", { length: 100 }).notNull(), // 'earn' or 'redeem'
    source: (0, pg_core_1.varchar)("source", { length: 255 }).notNull(), // 'order', 'subscription', 'referral', 'reward', etc.
    sourceId: (0, pg_core_1.varchar)("source_id", { length: 255 }), // Optional reference to the source object ID (order ID, etc.)
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow()
});
exports.loyaltyActivitiesRelations = (0, drizzle_orm_1.relations)(exports.loyaltyActivities, function (_a) {
    var one = _a.one;
    return ({
        customer: one(exports.loyaltyCustomers, {
            fields: [exports.loyaltyActivities.customerId],
            references: [exports.loyaltyCustomers.id]
        })
    });
});
exports.insertLoyaltyActivitySchema = (0, drizzle_zod_1.createInsertSchema)(exports.loyaltyActivities).omit({
    id: true,
    createdAt: true
});
// Website Settings
exports.websiteSettings = (0, pg_core_1.pgTable)("website_settings", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull().default("Sip of Eden"),
    businessEmail: (0, pg_core_1.varchar)("business_email", { length: 255 }).notNull().default("contact@sipofeden.com"),
    phoneNumber: (0, pg_core_1.varchar)("phone_number", { length: 20 }).notNull().default("+234 000 0000 000"),
    address: (0, pg_core_1.text)("address").notNull().default("Lagos, Nigeria"),
    instagram: (0, pg_core_1.varchar)("instagram", { length: 255 }).default("https://instagram.com/sipofeden"),
    twitter: (0, pg_core_1.varchar)("twitter", { length: 255 }).default("https://twitter.com/sipofeden"),
    facebook: (0, pg_core_1.varchar)("facebook", { length: 255 }).default("https://facebook.com/sipofeden"),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow()
});
exports.updateWebsiteSettingsSchema = (0, drizzle_zod_1.createInsertSchema)(exports.websiteSettings).omit({
    id: true,
    updatedAt: true
});
// Admin Notification Subscriptions
exports.adminNotificationSubscriptions = (0, pg_core_1.pgTable)("admin_notification_subscriptions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    adminId: (0, pg_core_1.integer)("admin_id").references(function () { return exports.admins.id; }, { onDelete: 'cascade' }),
    subscription: (0, pg_core_1.text)("subscription").notNull(), // JSON string of PushSubscription object
    userAgent: (0, pg_core_1.varchar)("user_agent", { length: 255 }), // Browser user agent info
    deviceName: (0, pg_core_1.varchar)("device_name", { length: 255 }), // Custom device name (optional)
    active: (0, pg_core_1.boolean)("active").notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    lastUsedAt: (0, pg_core_1.timestamp)("last_used_at").defaultNow()
});
exports.adminNotificationSubscriptionsRelations = (0, drizzle_orm_1.relations)(exports.adminNotificationSubscriptions, function (_a) {
    var one = _a.one;
    return ({
        admin: one(exports.admins, {
            fields: [exports.adminNotificationSubscriptions.adminId],
            references: [exports.admins.id]
        })
    });
});
exports.insertAdminNotificationSubscriptionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.adminNotificationSubscriptions).omit({
    id: true,
    createdAt: true,
    lastUsedAt: true
});

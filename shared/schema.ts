import { pgTable, text, serial, integer, boolean, timestamp, real, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // 'admin', 'cashier', 'staff'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Services Schema
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'dynamic', 'standard'
  type: text("type").notNull(), // 'document', 'tarpaulin', 'lamination', 'standard'
  basePrice: real("base_price").notNull(),
  pricingRules: jsonb("pricing_rules"), // For dynamic services
  active: boolean("active").default(true),
    imageUrl: text("image_url"), // Service image for online store
  featured: boolean("featured").default(false), // Featured services
  displayOrder: integer("display_order").default(0), // For sorting in online store
  onlineAvailable: boolean("online_available").default(true), // Can customers order online
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

// Orders Schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").default('Walk-in Customer'),
  customerId: integer("customer_id").references(() => customers.id),
  total: real("total").notNull(),
  discount: real("discount").default(0),
  status: text("status").notNull().default('pending'), // 'pending', 'in_progress', 'ready', 'completed'
  paymentMethod: text("payment_method"), // 'cash', 'gcash', 'card'
  paymentStatus: text("payment_status").default('unpaid'), // 'paid', 'unpaid'
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

// Order Items Schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  amount: real("amount").notNull(),
  specifications: jsonb("specifications"), // Store service-specific details
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

// Inventory Schema
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'paper', 'ink', 'material', etc.
  unit: text("unit").notNull(), // 'sheets', 'bottles', 'pieces', etc.
  currentStock: integer("current_stock").notNull(),
  lowStockThreshold: integer("low_stock_threshold").notNull(),
  lastRestocked: timestamp("last_restocked"),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastRestocked: true,
});

// Customers Schema
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Expenses Schema
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  amount: real("amount").notNull(),
  category: text("category").notNull(), // 'supplies', 'equipment', 'utilities', 'misc'
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

// Define relations between tables
export const ordersRelations = relations(orders, ({ one }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [orders.createdBy],
    references: [users.id],
  }),
}));

// Define types for each schema
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

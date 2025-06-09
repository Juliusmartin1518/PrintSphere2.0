var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  customers: () => customers,
  expenses: () => expenses,
  insertCustomerSchema: () => insertCustomerSchema,
  insertExpenseSchema: () => insertExpenseSchema,
  insertInventorySchema: () => insertInventorySchema,
  insertOrderItemSchema: () => insertOrderItemSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertServiceSchema: () => insertServiceSchema,
  insertUserSchema: () => insertUserSchema,
  inventory: () => inventory,
  orderItems: () => orderItems,
  orders: () => orders,
  ordersRelations: () => ordersRelations,
  services: () => services,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  // 'admin', 'cashier', 'staff'
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  // 'dynamic', 'standard'
  type: text("type").notNull(),
  // 'document', 'tarpaulin', 'lamination', 'standard'
  basePrice: real("base_price").notNull(),
  pricingRules: jsonb("pricing_rules"),
  // For dynamic services
  active: boolean("active").default(true),
  imageUrl: text("image_url"),
  // Service image for online store
  featured: boolean("featured").default(false),
  // Featured services
  displayOrder: integer("display_order").default(0),
  // For sorting in online store
  onlineAvailable: boolean("online_available").default(true)
  // Can customers order online
});
var insertServiceSchema = createInsertSchema(services).omit({
  id: true
});
var orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").default("Walk-in Customer"),
  customerId: integer("customer_id").references(() => customers.id),
  total: real("total").notNull(),
  discount: real("discount").default(0),
  status: text("status").notNull().default("pending"),
  // 'pending', 'in_progress', 'ready', 'completed'
  paymentMethod: text("payment_method"),
  // 'cash', 'gcash', 'card'
  paymentStatus: text("payment_status").default("unpaid"),
  // 'paid', 'unpaid'
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
var insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true
});
var orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  amount: real("amount").notNull(),
  specifications: jsonb("specifications")
  // Store service-specific details
});
var insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true
});
var inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  // 'paper', 'ink', 'material', etc.
  unit: text("unit").notNull(),
  // 'sheets', 'bottles', 'pieces', etc.
  currentStock: integer("current_stock").notNull(),
  lowStockThreshold: integer("low_stock_threshold").notNull(),
  lastRestocked: timestamp("last_restocked")
});
var insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastRestocked: true
});
var customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  amount: real("amount").notNull(),
  category: text("category").notNull(),
  // 'supplies', 'equipment', 'utilities', 'misc'
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
var insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true
});
var ordersRelations = relations(orders, ({ one }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id]
  }),
  user: one(users, {
    fields: [orders.createdBy],
    references: [users.id]
  })
}));

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, sql, desc, gt, lt, and, like } from "drizzle-orm";
var DatabaseStorage = class {
  // Customer Management
  async getOrdersByCustomerId(customerId) {
    const result = await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
    return result;
  }
  // Customer Management
  async getCustomer(id) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || void 0;
  }
  async getCustomerByName(name) {
    return await db.select().from(customers).where(like(customers.name, `%${name}%`));
  }
  async getCustomers() {
    return await db.select().from(customers);
  }
  async createCustomer(customer) {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }
  async deleteOrder(orderId) {
    try {
      console.log("Deleting order ID:", orderId);
      await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
      const result = await db.delete(orders).where(eq(orders.id, orderId));
      console.log("Deleted order result:", result);
      return !!result?.rowCount && result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting order:", error);
      throw new Error("Failed to delete order");
    }
  }
  async updateCustomer(id, customerData) {
    const [updatedCustomer] = await db.update(customers).set(customerData).where(eq(customers.id, id)).returning();
    return updatedCustomer || void 0;
  }
  async deleteCustomer(id) {
    const result = await db.delete(customers).where(eq(customers.id, id)).returning({ id: customers.id });
    return result.length > 0;
  }
  // Service Management with Delete functionality
  async deleteService(id) {
    const result = await db.delete(services).where(eq(services.id, id)).returning({ id: services.id });
    return result.length > 0;
  }
  // Inventory Management with Update and Delete
  async updateInventory(id, itemData) {
    const [updatedItem] = await db.update(inventory).set(itemData).where(eq(inventory.id, id)).returning();
    return updatedItem || void 0;
  }
  async deleteInventory(id) {
    const result = await db.delete(inventory).where(eq(inventory.id, id)).returning({ id: inventory.id });
    return result.length > 0;
  }
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getUsers() {
    return await db.select().from(users);
  }
  // Services Management
  async getService(id) {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || void 0;
  }
  async getServices(category, type) {
    let query = db.select().from(services);
    if (category && type) {
      query = query.where(and(eq(services.category, category), eq(services.type, type)));
    } else if (category) {
      query = query.where(eq(services.category, category));
    } else if (type) {
      query = query.where(eq(services.type, type));
    }
    return await query;
  }
  async createService(insertService) {
    const [service] = await db.insert(services).values(insertService).returning();
    return service;
  }
  async updateService(id, serviceUpdate) {
    const [updatedService] = await db.update(services).set(serviceUpdate).where(eq(services.id, id)).returning();
    return updatedService;
  }
  // Order Management
  async getOrder(id) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || void 0;
  }
  async getOrderByNumber(orderNumber) {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order || void 0;
  }
  async getOrders(status) {
    let query = db.select().from(orders).orderBy(desc(orders.createdAt));
    if (status) {
      query = query.where(eq(orders.status, status));
    }
    return await query;
  }
  async createOrder(insertOrder) {
    if (!insertOrder.orderNumber) {
      const date = /* @__PURE__ */ new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}${month}${day}`;
      const todayStart = /* @__PURE__ */ new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = /* @__PURE__ */ new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const todayOrders = await db.select({ count: sql`count(*)` }).from(orders).where(
        and(
          gt(orders.createdAt, todayStart),
          lt(orders.createdAt, todayEnd)
        )
      );
      const count = todayOrders[0]?.count || 0;
      const sequentialNum = String(count + 1).padStart(4, "0");
      insertOrder.orderNumber = `ORD-${dateString}-${sequentialNum}`;
    }
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }
  async updateOrderStatus(id, status) {
    const [updatedOrder] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return updatedOrder;
  }
  async updateOrderPayment(id, paymentMethod, paymentStatus) {
    const [updatedOrder] = await db.update(orders).set({ paymentMethod, paymentStatus }).where(eq(orders.id, id)).returning();
    return updatedOrder;
  }
  // Order Items Management
  async getOrderItems(orderId) {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }
  async createOrderItem(insertOrderItem) {
    const [orderItem] = await db.insert(orderItems).values(insertOrderItem).returning();
    return orderItem;
  }
  // Inventory Management
  async getInventory(id) {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item || void 0;
  }
  async getAllInventory() {
    return await db.select().from(inventory);
  }
  async createInventory(insertInventory) {
    const [item] = await db.insert(inventory).values(insertInventory).returning();
    return item;
  }
  async updateInventoryStock(id, quantity) {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    if (!item) return void 0;
    const [updatedItem] = await db.update(inventory).set({
      currentStock: quantity,
      lastRestocked: /* @__PURE__ */ new Date()
    }).where(eq(inventory.id, id)).returning();
    return updatedItem;
  }
  async getLowStockItems() {
    return await db.select().from(inventory).where(
      sql`${inventory.currentStock} <= ${inventory.lowStockThreshold}`
    );
  }
  // Expense Management
  async getExpense(id) {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || void 0;
  }
  async getExpenses(category) {
    let query = db.select().from(expenses).orderBy(desc(expenses.createdAt));
    if (category) {
      query = query.where(eq(expenses.category, category));
    }
    return await query;
  }
  async createExpense(insertExpense) {
    const [expense] = await db.insert(expenses).values(insertExpense).returning();
    return expense;
  }
  // Dashboard Data
  async getDailySales() {
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - 30);
    const result = await db.select({
      date: sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
      total: sql`SUM(${orders.total})`
    }).from(orders).where(
      and(
        gt(orders.createdAt, startDate),
        eq(orders.paymentStatus, "paid")
      )
    ).groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`).orderBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`);
    return result;
  }
  async getTodaySalesTotal() {
    const todayStart = /* @__PURE__ */ new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = /* @__PURE__ */ new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const result = await db.select({
      total: sql`COALESCE(SUM(${orders.total}), 0)`
    }).from(orders).where(
      and(
        gt(orders.createdAt, todayStart),
        lt(orders.createdAt, todayEnd),
        eq(orders.paymentStatus, "paid")
      )
    );
    return result[0]?.total || 0;
  }
  async getOrderCountsByStatus() {
    return await db.select({
      status: orders.status,
      count: sql`COUNT(*)`
    }).from(orders).groupBy(orders.status);
  }
  async getRecentOrders(limit) {
    return await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
  }
  async getRecentExpenses(limit) {
    return await db.select().from(expenses).orderBy(desc(expenses.createdAt)).limit(limit);
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { eq as eq2 } from "drizzle-orm";
var MemoryStoreSession = MemoryStore(session);
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  app2.use(express.json({ limit: "50mb" }));
  app2.use(express.urlencoded({ limit: "50mb", extended: true }));
  app2.use(
    session({
      cookie: { maxAge: 864e5 },
      // 1 day
      store: new MemoryStoreSession({
        checkPeriod: 864e5
        // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: "printsphere-secret"
    })
  );
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  const hasRole = (roles) => {
    return (req, res, next) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = req.user;
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    };
  };
  const handleZodError = (err, res) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({
        message: "Validation error",
        errors: validationError.details
      });
    }
    return res.status(500).json({ message: "Internal server error" });
  };
  app2.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.logIn(user, (err2) => {
        if (err2) {
          return next(err2);
        }
        const { password, ...userWithoutPassword } = user;
        return res.json({ user: userWithoutPassword });
      });
    })(req, res, next);
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = req.user;
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });
  app2.get(
    "/api/users",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        const users2 = await storage.getUsers();
        const usersWithoutPasswords = users2.map((user) => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
        res.json({ users: usersWithoutPasswords });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch users" });
      }
    }
  );
  app2.get("/api/services", async (req, res) => {
    try {
      const onlyOnline = req.query.online === "true";
      const allServices = await db.select().from(services).where(
        onlyOnline ? eq2(services.onlineAvailable, true) : void 0
      );
      res.json({ services: allServices });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });
  app2.post(
    "/api/users",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        const userData = insertUserSchema.parse(req.body);
        const user = await storage.createUser(userData);
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({ user: userWithoutPassword });
      } catch (err) {
        handleZodError(err, res);
      }
    }
  );
  app2.get("/api/services", isAuthenticated, async (req, res) => {
    try {
      const { category, type } = req.query;
      const services2 = await storage.getServices(
        typeof category === "string" ? category : void 0,
        typeof type === "string" ? type : void 0
      );
      res.json({ services: services2 });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });
  app2.get("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json({ service });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });
  app2.delete(
    "/api/orders/:id",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteOrder(id);
        if (!deleted) {
          return res.status(404).json({ message: "Order not found" });
        }
        res.json({ message: "Order deleted successfully" });
      } catch (err) {
        console.error("Route error:", err);
        res.status(500).json({ message: "Failed to delete order" });
      }
    }
  );
  app2.post(
    "/api/services",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        const serviceData = insertServiceSchema.parse(req.body);
        const service = await storage.createService(serviceData);
        res.status(201).json({ service });
      } catch (err) {
        handleZodError(err, res);
      }
    }
  );
  app2.patch(
    "/api/services/:id",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const serviceData = req.body;
        const service = await storage.updateService(id, serviceData);
        if (!service) {
          return res.status(404).json({ message: "Service not found" });
        }
        res.json({ service });
      } catch (err) {
        res.status(500).json({ message: "Failed to update service" });
      }
    }
  );
  app2.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customers2 = await storage.getCustomers();
      res.json({ customers: customers2 });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });
  app2.get("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const customer = await storage.getCustomer(parseInt(req.params.id));
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json({ customer });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });
  app2.get("/api/customers/:id/orders", isAuthenticated, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const orders2 = await storage.getOrdersByCustomerId(customerId);
      res.json({ orders: orders2 });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer orders" });
    }
  });
  app2.post("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json({ customer });
    } catch (error) {
      handleZodError(error, res);
    }
  });
  app2.patch("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(customerId, customerData);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json({ customer });
    } catch (error) {
      handleZodError(error, res);
    }
  });
  app2.delete("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const success = await storage.deleteCustomer(customerId);
      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });
  app2.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.query;
      const orders2 = await storage.getOrders(
        typeof status === "string" ? status : void 0
      );
      res.json({ orders: orders2 });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  app2.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const orderItems2 = await storage.getOrderItems(order.id);
      res.json({ order, items: orderItems2 });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });
  app2.get("/api/orders/:id/items", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const items = await storage.getOrderItems(order.id);
      res.json({ items });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });
  app2.post(
    "/api/orders",
    isAuthenticated,
    hasRole(["admin", "cashier"]),
    async (req, res) => {
      try {
        const user = req.user;
        const { items, ...orderData } = req.body;
        orderData.createdBy = user.id;
        const validatedOrderData = insertOrderSchema.parse(orderData);
        const order = await storage.createOrder(validatedOrderData);
        const orderItems2 = [];
        if (Array.isArray(items) && items.length > 0) {
          for (const item of items) {
            item.orderId = order.id;
            const validatedItemData = insertOrderItemSchema.parse(item);
            const orderItem = await storage.createOrderItem(validatedItemData);
            orderItems2.push(orderItem);
          }
        }
        res.status(201).json({ order, items: orderItems2 });
      } catch (err) {
        handleZodError(err, res);
      }
    }
  );
  app2.patch(
    "/api/orders/:id/status",
    isAuthenticated,
    hasRole(["admin", "cashier", "staff"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { status } = req.body;
        if (!["pending", "in_progress", "ready", "completed"].includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }
        const order = await storage.updateOrderStatus(id, status);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
        res.json({ order });
      } catch (err) {
        res.status(500).json({ message: "Failed to update order status" });
      }
    }
  );
  app2.patch(
    "/api/orders/:id/payment",
    isAuthenticated,
    hasRole(["admin", "cashier"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { paymentMethod, paymentStatus } = req.body;
        if (!["cash", "gcash", "card"].includes(paymentMethod)) {
          return res.status(400).json({ message: "Invalid payment method" });
        }
        if (!["paid", "unpaid"].includes(paymentStatus)) {
          return res.status(400).json({ message: "Invalid payment status" });
        }
        const order = await storage.updateOrderPayment(id, paymentMethod, paymentStatus);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
        res.json({ order });
      } catch (err) {
        res.status(500).json({ message: "Failed to update payment information" });
      }
    }
  );
  app2.get(
    "/api/inventory",
    isAuthenticated,
    hasRole(["admin", "staff"]),
    async (req, res) => {
      try {
        const inventory2 = await storage.getAllInventory();
        res.json({ inventory: inventory2 });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch inventory" });
      }
    }
  );
  app2.get(
    "/api/inventory/low-stock",
    isAuthenticated,
    hasRole(["admin", "staff"]),
    async (req, res) => {
      try {
        const lowStockItems = await storage.getLowStockItems();
        res.json({ inventory: lowStockItems });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch low stock items" });
      }
    }
  );
  app2.post(
    "/api/inventory",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        const inventoryData = insertInventorySchema.parse(req.body);
        const item = await storage.createInventory(inventoryData);
        res.status(201).json({ item });
      } catch (err) {
        handleZodError(err, res);
      }
    }
  );
  app2.patch(
    "/api/inventory/:id/stock",
    isAuthenticated,
    hasRole(["admin", "staff"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { quantity } = req.body;
        if (typeof quantity !== "number") {
          return res.status(400).json({ message: "Quantity must be a number" });
        }
        const item = await storage.updateInventoryStock(id, quantity);
        if (!item) {
          return res.status(404).json({ message: "Inventory item not found" });
        }
        res.json({ item });
      } catch (err) {
        res.status(500).json({ message: "Failed to update inventory stock" });
      }
    }
  );
  app2.get(
    "/api/expenses",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        const { category } = req.query;
        const expenses2 = await storage.getExpenses(
          typeof category === "string" ? category : void 0
        );
        res.json({ expenses: expenses2 });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch expenses" });
      }
    }
  );
  app2.post(
    "/api/expenses",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        const user = req.user;
        const expenseData = {
          ...req.body,
          createdBy: user.id
        };
        const validatedExpenseData = insertExpenseSchema.parse(expenseData);
        const expense = await storage.createExpense(validatedExpenseData);
        res.status(201).json({ expense });
      } catch (err) {
        handleZodError(err, res);
      }
    }
  );
  app2.get(
    "/api/dashboard/sales",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        const salesData = await storage.getDailySales();
        res.json({ sales: salesData });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch sales data" });
      }
    }
  );
  app2.get(
    "/api/dashboard/today-sales",
    isAuthenticated,
    hasRole(["admin", "cashier"]),
    async (req, res) => {
      try {
        const total = await storage.getTodaySalesTotal();
        res.json({ total });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch today's sales" });
      }
    }
  );
  app2.get(
    "/api/dashboard/order-counts",
    isAuthenticated,
    hasRole(["admin", "cashier", "staff"]),
    async (req, res) => {
      try {
        const counts = await storage.getOrderCountsByStatus();
        res.json({ counts });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch order counts" });
      }
    }
  );
  app2.get(
    "/api/dashboard/recent-orders",
    isAuthenticated,
    hasRole(["admin", "cashier", "staff"]),
    async (req, res) => {
      try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 5;
        const orders2 = await storage.getRecentOrders(limit);
        res.json({ orders: orders2 });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch recent orders" });
      }
    }
  );
  app2.get(
    "/api/dashboard/recent-expenses",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 5;
        const expenses2 = await storage.getRecentExpenses(limit);
        res.json({ expenses: expenses2 });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch recent expenses" });
      }
    }
  );
  app2.get(
    "/api/customers",
    isAuthenticated,
    hasRole(["admin", "cashier"]),
    async (req, res) => {
      try {
        const customers2 = await storage.getCustomers();
        res.json({ customers: customers2 });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch customers" });
      }
    }
  );
  app2.get(
    "/api/customers/search",
    isAuthenticated,
    hasRole(["admin", "cashier"]),
    async (req, res) => {
      try {
        const { name } = req.query;
        if (typeof name !== "string") {
          return res.status(400).json({ message: "Name query parameter required" });
        }
        const customers2 = await storage.getCustomerByName(name);
        res.json({ customers: customers2 });
      } catch (err) {
        res.status(500).json({ message: "Failed to search customers" });
      }
    }
  );
  app2.get(
    "/api/customers/:id",
    isAuthenticated,
    hasRole(["admin", "cashier"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const customer = await storage.getCustomer(id);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
        res.json({ customer });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch customer" });
      }
    }
  );
  app2.post(
    "/api/customers",
    isAuthenticated,
    hasRole(["admin", "cashier"]),
    async (req, res) => {
      try {
        const customerData = insertCustomerSchema.parse(req.body);
        const customer = await storage.createCustomer(customerData);
        res.status(201).json({ customer });
      } catch (err) {
        handleZodError(err, res);
      }
    }
  );
  app2.patch(
    "/api/customers/:id",
    isAuthenticated,
    hasRole(["admin", "cashier"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const customerData = insertCustomerSchema.partial().parse(req.body);
        const customer = await storage.updateCustomer(id, customerData);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
        res.json({ customer });
      } catch (err) {
        handleZodError(err, res);
      }
    }
  );
  app2.delete("/api/customers/:id", isAuthenticated, hasRole(["admin", "cashier"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomer(id);
      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json({ message: "Customer deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  base: "/PrintSphere2.0/",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "client/index.html"),
        notFound: path.resolve(__dirname, "client/index.html")
        // serve same file as 404
      }
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// client/src/lib/pricing.ts
var defaultPricingRules = {
  document: {
    // Base rates for each page type (in PHP Peso)
    colorPageRate: 2,
    // Base rate for colored page (₱14.00)
    blackPageRate: 1,
    // Base rate for black page (₱7.00)
    // Paper type adds an additional cost per page
    paperTypes: {
      Standard: 0,
      // No additional cost
      Glossy: 1,
      // ₱1 extra per page
      Matte: 1.5,
      // ₱1.50 extra per page
      "High Quality": 2
      // ₱2 extra per page
    },
    // These are kept for backwards compatibility
    paperSizes: {
      A4: 1,
      Letter: 1.05,
      Long: 1.2,
      A5: 0.7
    },
    colorModes: {
      "Black & White": 1,
      Color: 2,
      "Auto Detect": 1.5
    },
    basePrice: 8
    // Legacy base price per page
  },
  tarpaulin: {
    basePrice: 25,
    // Base price per sq.ft
    eyelets: 10,
    // Price per eyelet
    rope: 50,
    // Price for rope
    stand: 200
    // Price for stand
  },
  lamination: {
    sizes: {
      "ID Size": 1,
      "Big ID": 1.5,
      A4: 2.5,
      Long: 2,
      A5: 1.8
    },
    basePrice: 25
    // Base price per piece
  }
};

// server/seed.ts
async function seedDatabase() {
  console.log("Starting database seed...");
  try {
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log("Database already seeded. Skipping...");
      return;
    }
    console.log("Seeding users...");
    await db.insert(users).values([
      {
        username: "admin",
        password: "admin123",
        name: "Administrator",
        role: "admin"
      },
      {
        username: "cashier",
        password: "cashier123",
        name: "Cashier User",
        role: "cashier"
      },
      {
        username: "staff",
        password: "staff123",
        name: "Staff Member",
        role: "staff"
      }
    ]);
    console.log("Seeding services...");
    await db.insert(services).values([
      {
        name: "A4 Document Printing",
        description: "Standard A4 document printing service",
        category: "dynamic",
        type: "document",
        basePrice: 8,
        pricingRules: defaultPricingRules.document,
        active: true
      },
      {
        name: "Tarpaulin Printing",
        description: "Custom tarpaulin printing with various options",
        category: "dynamic",
        type: "tarpaulin",
        basePrice: 25,
        pricingRules: defaultPricingRules.tarpaulin,
        active: true
      },
      {
        name: "ID Lamination",
        description: "Lamination service for IDs and cards",
        category: "dynamic",
        type: "lamination",
        basePrice: 25,
        pricingRules: defaultPricingRules.lamination,
        active: true
      },
      {
        name: "Photocopying Service",
        description: "Quick photocopying service",
        category: "standard",
        type: "standard",
        basePrice: 2,
        active: true
      },
      {
        name: "Business Card Printing",
        description: "Professional business card printing",
        category: "standard",
        type: "standard",
        basePrice: 150,
        active: true
      }
    ]);
    console.log("Seeding inventory...");
    await db.insert(inventory).values([
      {
        name: "A4 Paper",
        description: "Standard A4 printing paper, 80gsm",
        category: "paper",
        unit: "ream",
        currentStock: 50,
        lowStockThreshold: 10
      },
      {
        name: "A4 Glossy Paper",
        description: "Glossy A4 photo paper, 180gsm",
        category: "paper",
        unit: "ream",
        currentStock: 15,
        lowStockThreshold: 5
      },
      {
        name: "Tarpaulin Roll",
        description: "13oz white tarpaulin material",
        category: "printing",
        unit: "roll",
        currentStock: 3,
        lowStockThreshold: 1
      },
      {
        name: "Lamination Film",
        description: "Clear lamination film for IDs",
        category: "printing",
        unit: "roll",
        currentStock: 8,
        lowStockThreshold: 2
      },
      {
        name: "PVC Cards",
        description: "Blank PVC cards for ID printing",
        category: "printing",
        unit: "box",
        currentStock: 2,
        lowStockThreshold: 3
      }
    ]);
    console.log("Database successfully seeded!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
seedDatabase();

// server/index.ts
var app = express3();
app.use(express3.json({ limit: "50mb" }));
app.use(express3.urlencoded({ extended: false, limit: "50mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();

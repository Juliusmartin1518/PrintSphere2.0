import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { 
  insertUserSchema, insertServiceSchema, insertOrderSchema, 
  insertOrderItemSchema, insertInventorySchema, insertExpenseSchema,
  insertCustomerSchema,
  services
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";

// Create session store
const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Increase the request size limit for file uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  // Set up session middleware
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 1 day
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: "printsphere-secret",
    })
  );
  
  // Initialize passport for authentication
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure passport to use local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        
        // In a real app, we'd compare hashed passwords
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password." });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );
  
  // Serialize and deserialize user for session management
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
  // Utility middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // Utility middleware to check user role
  const hasRole = (roles: string[]) => {
    return (req: Request, res: Response, next: Function) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      next();
    };
  };
  
  // Error handling middleware for Zod validation errors
  const handleZodError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationError.details
      });
    }
    return res.status(500).json({ message: "Internal server error" });
  };
  
  // Authentication Routes
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        
        // Don't include password in the response
        const { password, ...userWithoutPassword } = user;
        return res.json({ user: userWithoutPassword });
      });
    })(req, res, next);
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as any;
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });
  
  // User Management Routes
  app.get(
    "/api/users",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        const users = await storage.getUsers();
        // Don't include passwords in the response
        const usersWithoutPasswords = users.map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
        
        res.json({ users: usersWithoutPasswords });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch users" });
      }
    }
  );
  app.get("/api/services", async (req, res) => {
  try {
    const onlyOnline = req.query.online === "true";

    const allServices = await db.select().from(services).where(
      onlyOnline ? eq(services.onlineAvailable, true) : undefined
    );

    res.json({ services: allServices });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch services" });
  }
});

  app.post(
    "/api/users",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        const userData = insertUserSchema.parse(req.body);
        const user = await storage.createUser(userData);
        
        // Don't include password in the response
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({ user: userWithoutPassword });
      } catch (err) {
        handleZodError(err, res);
      }
    }
  );
  
  // Service Management Routes
  app.get("/api/services", isAuthenticated, async (req, res) => {
    try {
      const { category, type } = req.query;
      const services = await storage.getServices(
        typeof category === "string" ? category : undefined,
        typeof type === "string" ? type : undefined
      );
      
      res.json({ services });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });
  
  app.get("/api/services/:id", isAuthenticated, async (req, res) => {
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
  
app.delete(
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



  app.post(
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
  
  app.patch(
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
  
  // Customer Management Routes
  app.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json({ customers });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });
  
  app.get("/api/customers/:id", isAuthenticated, async (req, res) => {
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
  
  app.get("/api/customers/:id/orders", isAuthenticated, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const orders = await storage.getOrdersByCustomerId(customerId);
      res.json({ orders });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer orders" });
    }
  });
  
  app.post("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json({ customer });
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.patch("/api/customers/:id", isAuthenticated, async (req, res) => {
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
  
  app.delete("/api/customers/:id", isAuthenticated, async (req, res) => {
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
  
  // Order Management Routes
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.query;
      const orders = await storage.getOrders(
        typeof status === "string" ? status : undefined
      );
      
      res.json({ orders });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  
  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const orderItems = await storage.getOrderItems(order.id);
      
      res.json({ order, items: orderItems });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });
  
  // Separate endpoint to get order items by order ID
  app.get("/api/orders/:id/items", isAuthenticated, async (req, res) => {
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
  
  app.post(
    "/api/orders",
    isAuthenticated,
    hasRole(["admin", "cashier"]),
    async (req, res) => {
      try {
        // Get the current user from the session
        const user = req.user as any;
        
        const { items, ...orderData } = req.body;
        
        // Set the created by field to the current user's ID
        orderData.createdBy = user.id;
        
        // Validate order data
        const validatedOrderData = insertOrderSchema.parse(orderData);
        
        // Create the order
        const order = await storage.createOrder(validatedOrderData);
        
        // Create order items if provided
        const orderItems = [];
        if (Array.isArray(items) && items.length > 0) {
          for (const item of items) {
            // Set the order ID
            item.orderId = order.id;
            
            // Validate item data
            const validatedItemData = insertOrderItemSchema.parse(item);
            
            // Create the order item
            const orderItem = await storage.createOrderItem(validatedItemData);
            orderItems.push(orderItem);
          }
        }
        
        res.status(201).json({ order, items: orderItems });
      } catch (err) {
        handleZodError(err, res);
      }
    }
  );
  
  app.patch(
    "/api/orders/:id/status",
    isAuthenticated,
    hasRole(["admin", "cashier", "staff"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { status } = req.body;
        
        // Validate status
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
  
  app.patch(
    "/api/orders/:id/payment",
    isAuthenticated,
    hasRole(["admin", "cashier"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { paymentMethod, paymentStatus } = req.body;
        
        // Validate payment method
        if (!["cash", "gcash", "card"].includes(paymentMethod)) {
          return res.status(400).json({ message: "Invalid payment method" });
        }
        
        // Validate payment status
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
  
  // Inventory Management Routes
  app.get(
    "/api/inventory",
    isAuthenticated,
    hasRole(["admin", "staff"]),
    async (req, res) => {
      try {
        const inventory = await storage.getAllInventory();
        res.json({ inventory });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch inventory" });
      }
    }
  );
  
  app.get(
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
  
  app.post(
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
  
  app.patch(
    "/api/inventory/:id/stock",
    isAuthenticated,
    hasRole(["admin", "staff"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { quantity } = req.body;
        
        // Validate quantity
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
  
  // Expense Management Routes
  app.get(
    "/api/expenses",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        const { category } = req.query;
        const expenses = await storage.getExpenses(
          typeof category === "string" ? category : undefined
        );
        
        res.json({ expenses });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch expenses" });
      }
    }
  );
  
  app.post(
    "/api/expenses",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        // Get the current user from the session
        const user = req.user as any;
        
        // Set the created by field to the current user's ID
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
  
  // Dashboard Data Routes
  app.get(
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
  
  app.get(
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
  
  app.get(
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
  
  app.get(
    "/api/dashboard/recent-orders",
    isAuthenticated,
    hasRole(["admin", "cashier", "staff"]),
    async (req, res) => {
      try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
        const orders = await storage.getRecentOrders(limit);
        res.json({ orders });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch recent orders" });
      }
    }
  );
  
  app.get(
    "/api/dashboard/recent-expenses",
    isAuthenticated,
    hasRole(["admin"]),
    async (req, res) => {
      try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
        const expenses = await storage.getRecentExpenses(limit);
        res.json({ expenses });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch recent expenses" });
      }
    }
  );
  
  // Customer Management Routes
  app.get(
    "/api/customers", 
    isAuthenticated, 
    hasRole(["admin", "cashier"]), 
    async (req, res) => {
      try {
        const customers = await storage.getCustomers();
        res.json({ customers });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch customers" });
      }
    }
  );
  
  app.get(
    "/api/customers/search", 
    isAuthenticated, 
    hasRole(["admin", "cashier"]), 
    async (req, res) => {
      try {
        const { name } = req.query;
        if (typeof name !== 'string') {
          return res.status(400).json({ message: 'Name query parameter required' });
        }
        const customers = await storage.getCustomerByName(name);
        res.json({ customers });
      } catch (err) {
        res.status(500).json({ message: "Failed to search customers" });
      }
    }
  );
  
  app.get(
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
  
  app.post(
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
  
  app.patch(
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
  
  app.delete("/api/customers/:id", isAuthenticated, hasRole(["admin", "cashier"]), async (req, res) => {
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

import { 
  users, User, InsertUser, 
  services, Service, InsertService,
  orders, Order, InsertOrder, 
  orderItems, OrderItem, InsertOrderItem,
  inventory, Inventory, InsertInventory,
  expenses, Expense, InsertExpense,
  customers, Customer, InsertCustomer
} from "@shared/schema";

export interface IStorage {
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  
  // Services Management
  getService(id: number): Promise<Service | undefined>;
  getServices(category?: string, type?: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  
  // Order Management
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getOrders(status?: string): Promise<Order[]>;
  getOrdersByCustomerId(customerId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  deleteOrder(orderId: number): Promise<boolean>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updateOrderPayment(id: number, paymentMethod: string, paymentStatus: string): Promise<Order | undefined>;
  
  // Order Items Management
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  
  // Inventory Management
  getInventory(id: number): Promise<Inventory | undefined>;
  getAllInventory(): Promise<Inventory[]>;
  createInventory(item: InsertInventory): Promise<Inventory>;
  updateInventory(id: number, item: Partial<InsertInventory>): Promise<Inventory | undefined>;
  updateInventoryStock(id: number, quantity: number): Promise<Inventory | undefined>;
  deleteInventory(id: number): Promise<boolean>;
  getLowStockItems(): Promise<Inventory[]>;
  
  // Customer Management
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByName(name: string): Promise<Customer[]>;
  getCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Expense Management
  getExpense(id: number): Promise<Expense | undefined>;
  getExpenses(category?: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  
  // Dashboard Data
  getDailySales(): Promise<{ date: string; total: number }[]>;
  getTodaySalesTotal(): Promise<number>;
  getOrderCountsByStatus(): Promise<{ status: string; count: number }[]>;
  getRecentOrders(limit: number): Promise<Order[]>;
  getRecentExpenses(limit: number): Promise<Expense[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private services: Map<number, Service>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private inventoryItems: Map<number, Inventory>;
  private expenseItems: Map<number, Expense>;
  private customers: Map<number, Customer>;
  
  private userCurrentId: number;
  private serviceCurrentId: number;
  private orderCurrentId: number;
  private orderItemCurrentId: number;
  private inventoryCurrentId: number;
  private expenseCurrentId: number;
  private customerCurrentId: number;
  
  private orderNumbers: Set<string>;
  
  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.inventoryItems = new Map();
    this.expenseItems = new Map();
    this.customers = new Map();
    
    this.userCurrentId = 1;
    this.serviceCurrentId = 1;
    this.orderCurrentId = 1;
    this.orderItemCurrentId = 1;
    this.inventoryCurrentId = 1;
    this.expenseCurrentId = 1;
    this.customerCurrentId = 1;
    
    this.orderNumbers = new Set();
    
    // Seed some initial data
    this.seedInitialData();
  }
  
  private seedInitialData() {
    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app this would be hashed
      name: "Administrator",
      role: "admin"
    });
    
    // Create cashier user
    this.createUser({
      username: "cashier",
      password: "cashier123",
      name: "Cashier User",
      role: "cashier"
    });
    
    // Create staff user
    this.createUser({
      username: "staff",
      password: "staff123",
      name: "Staff Member",
      role: "staff"
    });
    
    // Create some services
    this.createService({
      name: "A4 Document Printing",
      description: "Standard A4 document printing service",
      category: "dynamic",
      type: "document",
      basePrice: 8,
      pricingRules: {
        paperSizes: {
          "A4": 1.0,
          "Letter": 1.05,
          "Legal": 1.2,
          "A5": 0.7
        },
        paperTypes: {
          "Standard": 1.0,
          "Glossy": 1.5,
          "Matte": 1.3,
          "High Quality": 1.8
        },
        colorModes: {
          "Black & White": 1.0,
          "Color": 3.0
        }
      },
      active: true
    });
    
    this.createService({
      name: "Tarpaulin Printing",
      description: "Custom tarpaulin printing service",
      category: "dynamic",
      type: "tarpaulin",
      basePrice: 25, // per sq.ft
      pricingRules: {
        eyelets: 10, // per eyelet
        rope: 50,
        stand: 200
      },
      active: true
    });
    
    this.createService({
      name: "Lamination",
      description: "Document lamination service",
      category: "dynamic",
      type: "lamination",
      basePrice: 25,
      pricingRules: {
        sizes: {
          "ID Size": 1.0,
          "Big ID": 1.5,
          "A4": 2.5,
          "Long": 2.0,
          "A5": 1.8
        }
      },
      active: true
    });
    
    this.createService({
      name: "PVC ID Printing",
      description: "PVC ID card printing",
      category: "standard",
      type: "standard",
      basePrice: 125,
      active: true
    });
    
    this.createService({
      name: "Mug Printing",
      description: "Custom mug printing",
      category: "standard",
      type: "standard",
      basePrice: 180,
      active: true
    });
    
    // Create some inventory items
    this.createInventory({
      name: "A4 Paper",
      description: "Standard white A4 paper",
      category: "paper",
      unit: "sheets",
      currentStock: 1000,
      lowStockThreshold: 200
    });
    
    this.createInventory({
      name: "A4 Glossy Paper",
      description: "Glossy A4 paper for high-quality prints",
      category: "paper",
      unit: "sheets",
      currentStock: 25,
      lowStockThreshold: 100
    });
    
    this.createInventory({
      name: "PVC Cards",
      description: "Blank PVC cards for ID printing",
      category: "material",
      unit: "pieces",
      currentStock: 38,
      lowStockThreshold: 50
    });
    
    this.createInventory({
      name: "Black Ink",
      description: "Black ink for printers",
      category: "ink",
      unit: "bottles",
      currentStock: 1,
      lowStockThreshold: 3
    });
    
    this.createInventory({
      name: "Color Ink Set",
      description: "CMYK ink set for color printing",
      category: "ink",
      unit: "sets",
      currentStock: 2,
      lowStockThreshold: 2
    });
    
    // Create some sample orders
    const order1 = this.createOrder({
      orderNumber: "ORD-2023-0041",
      customerName: "ABC Company",
      total: 750,
      status: "in_progress",
      paymentMethod: "gcash",
      paymentStatus: "paid",
      createdBy: 1
    });
    
    this.createOrderItem({
      orderId: order1.id,
      serviceId: 2,
      quantity: 1,
      unitPrice: 750,
      amount: 750,
      specifications: {
        dimensions: "3x6ft",
        eyelets: 8
      }
    });
    
    const order2 = this.createOrder({
      orderNumber: "ORD-2023-0040",
      customerName: "Walk-in Customer",
      total: 250,
      status: "ready",
      paymentMethod: "cash",
      paymentStatus: "paid",
      createdBy: 2
    });
    
    this.createOrderItem({
      orderId: order2.id,
      serviceId: 3,
      quantity: 10,
      unitPrice: 25,
      amount: 250,
      specifications: {
        size: "ID Size"
      }
    });
    
    const order3 = this.createOrder({
      orderNumber: "ORD-2023-0039",
      customerName: "Walk-in Customer",
      total: 625,
      status: "pending",
      paymentMethod: "cash",
      paymentStatus: "paid",
      createdBy: 2
    });
    
    this.createOrderItem({
      orderId: order3.id,
      serviceId: 4,
      quantity: 5,
      unitPrice: 125,
      amount: 625,
      specifications: {}
    });
    
    // Create some expenses
    this.createExpense({
      title: "Paper Stock Purchase",
      amount: 4500,
      category: "supplies",
      notes: "Bulk purchase of A4 paper stock",
      createdBy: 1
    });
    
    this.createExpense({
      title: "Printer Maintenance",
      amount: 2300,
      category: "equipment",
      notes: "Monthly printer maintenance service",
      createdBy: 1
    });
    
    this.createExpense({
      title: "Ink Cartridge Set",
      amount: 5800,
      category: "supplies",
      notes: "CMYK ink cartridges for large format printer",
      createdBy: 1
    });
  }
  
  // User Management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Services Management
  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }
  
  async getServices(category?: string, type?: string): Promise<Service[]> {
    let services = Array.from(this.services.values());
    
    if (category) {
      services = services.filter(service => service.category === category);
    }
    
    if (type) {
      services = services.filter(service => service.type === type);
    }
    
    return services;
  }
  
  async createService(insertService: InsertService): Promise<Service> {
    const id = this.serviceCurrentId++;
    const service: Service = { ...insertService, id };
    this.services.set(id, service);
    return service;
  }
  
  async updateService(id: number, serviceUpdate: Partial<InsertService>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;
    
    const updatedService = { ...service, ...serviceUpdate };
    this.services.set(id, updatedService);
    return updatedService;
  }
  
  // Order Management
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(
      (order) => order.orderNumber === orderNumber,
    );
  }
  
  async getOrders(status?: string): Promise<Order[]> {
    let orders = Array.from(this.orders.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (status) {
      orders = orders.filter(order => order.status === status);
    }
    
    return orders;
  }
  
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderCurrentId++;
    const now = new Date();
    
    // Generate a unique order number if not provided
    if (!insertOrder.orderNumber || this.orderNumbers.has(insertOrder.orderNumber)) {
      // Get current date in YYMMDD format
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}${month}${day}`;
      
      // Count orders to get a sequential number
      const todayOrders = Array.from(this.orders.values())
        .filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.toDateString() === date.toDateString();
        }).length;
      
      // Generate order number with format: ORD-YYMMDD-XXXX where XXXX is sequential
      const sequentialNum = String(todayOrders + 1).padStart(4, '0');
      insertOrder.orderNumber = `ORD-${dateString}-${sequentialNum}`;
      
      // Additional check for uniqueness (fallback)
      if (this.orderNumbers.has(insertOrder.orderNumber)) {
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        insertOrder.orderNumber = `ORD-${dateString}-${sequentialNum}-${randomSuffix}`;
      }
    }
    
    this.orderNumbers.add(insertOrder.orderNumber);
    
    const order: Order = { ...insertOrder, id, createdAt: now };
    this.orders.set(id, order);
    return order;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async updateOrderPayment(id: number, paymentMethod: string, paymentStatus: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, paymentMethod, paymentStatus };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  // Order Items Management
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId);
  }
  
  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemCurrentId++;
    const orderItem: OrderItem = { ...insertOrderItem, id };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }
  
  // Inventory Management
  async getInventory(id: number): Promise<Inventory | undefined> {
    return this.inventoryItems.get(id);
  }
  
  async getAllInventory(): Promise<Inventory[]> {
    return Array.from(this.inventoryItems.values());
  }
  
  async createInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const id = this.inventoryCurrentId++;
    const inventory: Inventory = { ...insertInventory, id, lastRestocked: new Date() };
    this.inventoryItems.set(id, inventory);
    return inventory;
  }
  
  async updateInventoryStock(id: number, quantity: number): Promise<Inventory | undefined> {
    const item = this.inventoryItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { 
      ...item, 
      currentStock: item.currentStock + quantity,
      lastRestocked: quantity > 0 ? new Date() : item.lastRestocked
    };
    
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async getLowStockItems(): Promise<Inventory[]> {
    return Array.from(this.inventoryItems.values())
      .filter(item => item.currentStock <= item.lowStockThreshold);
  }
  
  // Expense Management
  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenseItems.get(id);
  }
  
  async getExpenses(category?: string): Promise<Expense[]> {
    let expenses = Array.from(this.expenseItems.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (category) {
      expenses = expenses.filter(expense => expense.category === category);
    }
    
    return expenses;
  }
  
  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.expenseCurrentId++;
    const now = new Date();
    const expense: Expense = { ...insertExpense, id, createdAt: now };
    this.expenseItems.set(id, expense);
    return expense;
  }
  
  // Dashboard Data
  async getDailySales(): Promise<{ date: string; total: number }[]> {
    const orders = Array.from(this.orders.values());
    const salesByDate = new Map<string, number>();
    
    // Generate sales data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      salesByDate.set(dateString, 0);
    }
    
    // Populate with actual sales data
    orders.forEach(order => {
      if (order.paymentStatus === 'paid') {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        
        if (salesByDate.has(orderDate)) {
          salesByDate.set(orderDate, (salesByDate.get(orderDate) || 0) + order.total);
        }
      }
    });
    
    return Array.from(salesByDate.entries()).map(([date, total]) => ({ date, total }));
  }
  
  async getTodaySalesTotal(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const orders = Array.from(this.orders.values());
    
    return orders
      .filter(order => 
        order.paymentStatus === 'paid' && 
        new Date(order.createdAt).toISOString().split('T')[0] === today
      )
      .reduce((total, order) => total + order.total, 0);
  }
  
  async getOrderCountsByStatus(): Promise<{ status: string; count: number }[]> {
    const orders = Array.from(this.orders.values());
    const counts = new Map<string, number>();
    
    // Initialize all statuses with 0 count
    ['pending', 'in_progress', 'ready', 'completed'].forEach(status => {
      counts.set(status, 0);
    });
    
    // Count orders by status
    orders.forEach(order => {
      counts.set(order.status, (counts.get(order.status) || 0) + 1);
    });
    
    return Array.from(counts.entries()).map(([status, count]) => ({ status, count }));
  }
  
  async getRecentOrders(limit: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  async getRecentExpenses(limit: number): Promise<Expense[]> {
    return Array.from(this.expenseItems.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  // Customer Management Methods
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  
  async getCustomerByName(name: string): Promise<Customer[]> {
    const lcName = name.toLowerCase();
    return Array.from(this.customers.values()).filter(customer => 
      customer.name.toLowerCase().includes(lcName)
    );
  }
  
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }
  
  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.customerCurrentId++;
    const now = new Date();
    const customer: Customer = { 
      ...insertCustomer, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.customers.set(id, customer);
    return customer;
  }
  
  async updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) {
      return undefined;
    }
    
    const updatedCustomer: Customer = {
      ...customer,
      ...customerData,
      updatedAt: new Date()
    };
    
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  
  async deleteCustomer(id: number): Promise<boolean> {
    if (!this.customers.has(id)) {
      return false;
    }
    this.customers.delete(id);
    return true;
  }
  
  async getOrdersByCustomerId(customerId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.customerId === customerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

import { db } from './db';
import { eq, sql, desc, gt, lt, and, or, like } from 'drizzle-orm';

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // Customer Management
  async getOrdersByCustomerId(customerId: number): Promise<Order[]> {
    const result = await db.select().from(orders).where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));
    return result;
  }
  // Customer Management
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }
  
  async getCustomerByName(name: string): Promise<Customer[]> {
    return await db.select().from(customers).where(like(customers.name, `%${name}%`));
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }

async deleteOrder(orderId: number): Promise<boolean> {
  try {
    console.log("Deleting order ID:", orderId);

    // 1. Delete all order items first (must come before order deletion)
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));

    // 2. Delete the main order
    const result = await db.delete(orders).where(eq(orders.id, orderId));

    // 3. Debug output (see what was deleted)
    console.log("Deleted order result:", result);

    // 4. Return true if the order was deleted (rowCount > 0)
    return !!result?.rowCount && result.rowCount > 0;
    
  } catch (error) {
    console.error("Error deleting order:", error);
    throw new Error("Failed to delete order");
    
  }
  
}


  
  async updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(customerData)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer || undefined;
  }
  
  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db
      .delete(customers)
      .where(eq(customers.id, id))
      .returning({ id: customers.id });
    return result.length > 0;
  }
  
  // Service Management with Delete functionality
  async deleteService(id: number): Promise<boolean> {
    const result = await db
      .delete(services)
      .where(eq(services.id, id))
      .returning({ id: services.id });
    return result.length > 0;
  }
  
  // Inventory Management with Update and Delete
  async updateInventory(id: number, itemData: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const [updatedItem] = await db
      .update(inventory)
      .set(itemData)
      .where(eq(inventory.id, id))
      .returning();
    return updatedItem || undefined;
  }
  
  async deleteInventory(id: number): Promise<boolean> {
    const result = await db
      .delete(inventory)
      .where(eq(inventory.id, id))
      .returning({ id: inventory.id });
    return result.length > 0;
  }
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Services Management
  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }
  
  async getServices(category?: string, type?: string): Promise<Service[]> {
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
  
  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(insertService)
      .returning();
    return service;
  }
  
  async updateService(id: number, serviceUpdate: Partial<InsertService>): Promise<Service | undefined> {
    const [updatedService] = await db
      .update(services)
      .set(serviceUpdate)
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  // Order Management
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }
  
  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order || undefined;
  }
  
  async getOrders(status?: string): Promise<Order[]> {
    let query = db.select().from(orders).orderBy(desc(orders.createdAt));
    
    if (status) {
      query = query.where(eq(orders.status, status));
    }
    
    return await query;
  }
  
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    // Generate order number if not provided
    if (!insertOrder.orderNumber) {
      // Get current date in YYMMDD format
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}${month}${day}`;
      
      // Count orders for today to get sequential number
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
      const todayOrders = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(
          and(
            gt(orders.createdAt, todayStart),
            lt(orders.createdAt, todayEnd)
          )
        );
      
      const count = todayOrders[0]?.count || 0;
      const sequentialNum = String(count + 1).padStart(4, '0');
      
      insertOrder.orderNumber = `ORD-${dateString}-${sequentialNum}`;
    }
    
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }
  
  async updateOrderPayment(id: number, paymentMethod: string, paymentStatus: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ paymentMethod, paymentStatus })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Order Items Management
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }
  
  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db
      .insert(orderItems)
      .values(insertOrderItem)
      .returning();
    return orderItem;
  }

  // Inventory Management
  async getInventory(id: number): Promise<Inventory | undefined> {
    const [item] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, id));
    return item || undefined;
  }
  
  async getAllInventory(): Promise<Inventory[]> {
    return await db.select().from(inventory);
  }
  
  async createInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const [item] = await db
      .insert(inventory)
      .values(insertInventory)
      .returning();
    return item;
  }
  
  async updateInventoryStock(id: number, quantity: number): Promise<Inventory | undefined> {
    const [item] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, id));
      
    if (!item) return undefined;
    
    const [updatedItem] = await db
      .update(inventory)
      .set({ 
        currentStock: quantity,
        lastRestocked: new Date()
      })
      .where(eq(inventory.id, id))
      .returning();
    
    return updatedItem;
  }
  
  async getLowStockItems(): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(
        sql`${inventory.currentStock} <= ${inventory.lowStockThreshold}`
      );
  }

  // Expense Management
  async getExpense(id: number): Promise<Expense | undefined> {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id));
    return expense || undefined;
  }
  
  async getExpenses(category?: string): Promise<Expense[]> {
    let query = db.select().from(expenses).orderBy(desc(expenses.createdAt));
    
    if (category) {
      query = query.where(eq(expenses.category, category));
    }
    
    return await query;
  }
  
  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }

  // Dashboard Data
  async getDailySales(): Promise<{ date: string; total: number }[]> {
    // Get sales for the last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const result = await db
      .select({
        date: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
        total: sql<number>`SUM(${orders.total})`
      })
      .from(orders)
      .where(
        and(
          gt(orders.createdAt, startDate),
          eq(orders.paymentStatus, 'paid')
        )
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`);
    
    return result;
  }
  
  async getTodaySalesTotal(): Promise<number> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${orders.total}), 0)`
      })
      .from(orders)
      .where(
        and(
          gt(orders.createdAt, todayStart),
          lt(orders.createdAt, todayEnd),
          eq(orders.paymentStatus, 'paid')
        )
      );
    
    return result[0]?.total || 0;
  }
  
  async getOrderCountsByStatus(): Promise<{ status: string; count: number }[]> {
    return await db
      .select({
        status: orders.status,
        count: sql<number>`COUNT(*)`
      })
      .from(orders)
      .groupBy(orders.status);
  }
  
  async getRecentOrders(limit: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }
  
  async getRecentExpenses(limit: number): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .orderBy(desc(expenses.createdAt))
      .limit(limit);
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();

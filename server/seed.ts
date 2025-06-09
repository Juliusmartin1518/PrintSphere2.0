import { db } from './db';
import { users, services, inventory } from '@shared/schema';
import { defaultPricingRules } from '@/lib/pricing';

/**
 * Seed initial data into the database
 */
async function seedDatabase() {
  console.log("Starting database seed...");
  
  try {
    // Check if users already exist to prevent duplicate seeding
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length > 0) {
      console.log("Database already seeded. Skipping...");
      return;
    }
    
    // Seed users
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
    
    // Seed services
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
    
    // Seed inventory
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

// Run the seed function
seedDatabase();
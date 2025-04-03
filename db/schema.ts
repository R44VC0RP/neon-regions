import { pgTable, text, timestamp, uuid, numeric, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Common fields that most tables will use
export const commonFields = {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
};

// Example User table
export const users = pgTable("users", {
  ...commonFields,
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
});

// Example Product table
export const products = pgTable("products", {
  ...commonFields,
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
});

// Example Order table
export const orders = pgTable("orders", {
  ...commonFields,
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  status: text("status").notNull().default("pending"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
});

// Example OrderItem table
export const orderItems = pgTable("order_items", {
  ...commonFields,
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
}); 
'use server';

import { getDbConnections } from "@/db";
import { users, products, orders, orderItems } from "@/db/schema";
import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";
import { sql } from "drizzle-orm";

const BATCH_SIZE = 1000; // Increased batch size for better performance
const TOTAL_RECORDS = 20000;
const PARALLEL_BATCHES = 5; // Number of parallel batch inserts

async function generateUsers(count: number, startIndex: number) {
  return Array.from({ length: count }, (_, index) => {
    const uniqueId = startIndex + index;
    return {
      id: uuidv4(),
      email: `user.${uniqueId}.${faker.internet.email()}`,
      name: faker.person.fullName(),
      avatarUrl: faker.image.avatar(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
}

async function generateProducts(count: number, startIndex: number) {
  return Array.from({ length: count }, () => ({
    id: uuidv4(),
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: faker.commerce.price({ min: 10, max: 1000 }),
    stock: faker.number.int({ min: 0, max: 1000 }),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

async function generateOrders(count: number, startIndex: number, userIds: string[]) {
  return Array.from({ length: count }, () => ({
    id: uuidv4(),
    userId: userIds[Math.floor(Math.random() * userIds.length)],
    status: faker.helpers.arrayElement(['pending', 'processing', 'completed', 'cancelled']),
    total: faker.commerce.price({ min: 10, max: 1000 }),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

async function generateOrderItems(count: number, startIndex: number, orderIds: string[], productIds: string[]) {
  return Array.from({ length: count }, () => ({
    id: uuidv4(),
    orderId: orderIds[Math.floor(Math.random() * orderIds.length)],
    productId: productIds[Math.floor(Math.random() * productIds.length)],
    quantity: faker.number.int({ min: 1, max: 5 }),
    price: faker.commerce.price({ min: 5, max: 500 }),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

async function insertInParallelBatches<T>(
  db: any,
  table: any,
  totalRecords: number,
  generateFn: (count: number, startIndex: number, ...args: any[]) => Promise<T[]>,
  generateArgs: any[] = [],
  tableName: string
) {
  const batchCount = Math.ceil(totalRecords / BATCH_SIZE);
  const batches = Array.from({ length: batchCount }, (_, i) => i);
  const results: T[] = [];

  // Process batches in parallel chunks
  for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
    const currentChunk = Math.floor(i / PARALLEL_BATCHES) + 1;
    const totalChunks = Math.ceil(batchCount / PARALLEL_BATCHES);
    console.log(`📦 Processing ${tableName} chunk ${currentChunk}/${totalChunks} (${Math.min(PARALLEL_BATCHES, batchCount - i)} parallel batches)`);

    const batchPromises = batches.slice(i, i + PARALLEL_BATCHES).map(async (batchIndex) => {
      const startIndex = batchIndex * BATCH_SIZE;
      const count = Math.min(BATCH_SIZE, totalRecords - startIndex);
      const items = await generateFn(count, startIndex, ...generateArgs);
      await db.insert(table).values(items);
      return items;
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.flat());
    
    const progress = Math.round((i + PARALLEL_BATCHES) / batchCount * 100);
    console.log(`✨ ${tableName} progress: ${progress}% complete`);
  }

  return results;
}

export async function seedRegion(regionCode: string) {
  const { dbRegionA, dbRegionB, dbRegionC } = getDbConnections();
  const db = {
    'us-east-2': dbRegionA,
    'us-west-1': dbRegionB,
    'ap-southeast-1': dbRegionC
  }[regionCode];

  if (!db) {
    throw new Error(`Invalid region code: ${regionCode}`);
  }

  console.log(`\n🚀 Starting to seed region: ${regionCode}`);
  console.log(`📊 Target: ${TOTAL_RECORDS.toLocaleString()} records per table`);
  console.log(`⚡ Batch size: ${BATCH_SIZE.toLocaleString()} records`);
  console.log(`🔄 Parallel batches: ${PARALLEL_BATCHES}\n`);

  try {
    console.log('👤 Phase 1/4: Generating Users');
    const startUsers = Date.now();
    const insertedUsers = await insertInParallelBatches(
      db, 
      users, 
      TOTAL_RECORDS, 
      generateUsers,
      [],
      'Users'
    );
    const userIds = insertedUsers.map(u => u.id);
    console.log(`✅ Users completed in ${((Date.now() - startUsers) / 1000).toFixed(1)}s\n`);

    console.log('🛍️  Phase 2/4: Generating Products');
    const startProducts = Date.now();
    const insertedProducts = await insertInParallelBatches(
      db,
      products,
      TOTAL_RECORDS,
      generateProducts,
      [],
      'Products'
    );
    const productIds = insertedProducts.map(p => p.id);
    console.log(`✅ Products completed in ${((Date.now() - startProducts) / 1000).toFixed(1)}s\n`);

    console.log('📦 Phase 3/4: Generating Orders');
    const startOrders = Date.now();
    const insertedOrders = await insertInParallelBatches(
      db,
      orders,
      TOTAL_RECORDS,
      generateOrders,
      [userIds],
      'Orders'
    );
    const orderIds = insertedOrders.map(o => o.id);
    console.log(`✅ Orders completed in ${((Date.now() - startOrders) / 1000).toFixed(1)}s\n`);

    console.log('🔖 Phase 4/4: Generating Order Items');
    const startOrderItems = Date.now();
    await insertInParallelBatches(
      db,
      orderItems,
      TOTAL_RECORDS,
      generateOrderItems,
      [orderIds, productIds],
      'Order Items'
    );
    console.log(`✅ Order Items completed in ${((Date.now() - startOrderItems) / 1000).toFixed(1)}s\n`);

    const totalTime = ((Date.now() - startUsers) / 1000).toFixed(1);
    console.log(`🎉 Region ${regionCode} seeding completed in ${totalTime}s`);
    console.log(`📝 Total records: ${(TOTAL_RECORDS * 4).toLocaleString()}\n`);

    return { success: true };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

export async function getRegionRecordCount(regionCode: string) {
  const { dbRegionA, dbRegionB, dbRegionC } = getDbConnections();
  const db = {
    'us-east-2': dbRegionA,
    'us-west-1': dbRegionB,
    'ap-southeast-1': dbRegionC
  }[regionCode];

  if (!db) {
    throw new Error(`Invalid region code: ${regionCode}`);
  }

  const result = await db.select({ count: sql`count(*)` }).from(users);
  return Number(result[0].count);
} 
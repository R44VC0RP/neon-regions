import { NextRequest, NextResponse } from 'next/server';
import { getDbConnections } from '@/db';
import { users, products, orders, orderItems } from '@/db/schema';
import { and, eq, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const functionStart = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const region = searchParams.get('region') || 'us-east-2'; // default to US East

  // Get the appropriate database connection based on region
  const { dbRegionA, dbRegionB, dbRegionC } = getDbConnections();
  const db = {
    'us-east-2': dbRegionA,
    'us-west-1': dbRegionB,
    'ap-southeast-1': dbRegionC
  }[region];

  if (!db) {
    return NextResponse.json(
      { error: `Invalid region. Must be one of: us-east-2, us-west-1, ap-southeast-1` },
      { status: 400 }
    );
  }

  try {
    const dbStart = Date.now();
    
    // Complex query example: Get order statistics with related data
    const statsStart = Date.now();
    const orderStats = await db
      .select({
        totalOrders: sql<number>`count(distinct ${orders.id})`,
        totalRevenue: sql<number>`sum(${orders.total})`,
        avgOrderValue: sql<number>`avg(${orders.total})`,
        totalProducts: sql<number>`count(distinct ${orderItems.productId})`,
        totalCustomers: sql<number>`count(distinct ${orders.userId})`
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId));
    const statsTime = Date.now() - statsStart;

    // Get top selling products
    const productsStart = Date.now();
    const topProducts = await db
      .select({
        productId: products.id,
        productName: products.name,
        totalSold: sql<number>`sum(${orderItems.quantity})`,
        revenue: sql<number>`sum(${orderItems.quantity} * ${orderItems.price})`
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .groupBy(products.id, products.name)
      .orderBy(sql`sum(${orderItems.quantity}) desc`)
      .limit(10);
    const productsTime = Date.now() - productsStart;

    // Get recent orders with customer details
    const ordersStart = Date.now();
    const recentOrders = await db
      .select({
        orderId: orders.id,
        orderDate: orders.createdAt,
        total: orders.total,
        status: orders.status,
        customerName: users.name,
        customerEmail: users.email,
        itemCount: sql<number>`count(${orderItems.id})`
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .groupBy(orders.id, users.id)
      .orderBy(sql`${orders.createdAt} desc`)
      .limit(20);
    const ordersTime = Date.now() - ordersStart;

    const dbTime = Date.now() - dbStart;
    const functionTime = Date.now() - functionStart;

    return NextResponse.json({
      region,
      stats: orderStats[0],
      topProducts,
      recentOrders,
      timing: {
        total: functionTime,
        db: dbTime,
        queries: {
          stats: statsTime,
          products: productsTime,
          orders: ordersTime
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch database statistics', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}


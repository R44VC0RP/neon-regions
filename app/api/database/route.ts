import { NextRequest, NextResponse } from 'next/server';
import { getDbConnections } from '@/db';
import { users, products, orders, orderItems } from '@/db/schema';
import { and, eq, sql, desc, gte, between } from 'drizzle-orm';

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
    
    // Enhanced order statistics with time-based metrics and advanced calculations
    const statsStart = Date.now();
    const orderStats = await db
      .select({
        // Basic metrics
        totalOrders: sql<number>`count(distinct ${orders.id})`,
        totalRevenue: sql<number>`sum(${orders.total})`,
        avgOrderValue: sql<number>`avg(${orders.total})`,
        totalProducts: sql<number>`count(distinct ${orderItems.productId})`,
        totalCustomers: sql<number>`count(distinct ${orders.userId})`,
        
        // Advanced metrics
        revenuePerCustomer: sql<number>`sum(${orders.total})::float / count(distinct ${orders.userId})`,
        avgItemsPerOrder: sql<number>`count(${orderItems.id})::float / count(distinct ${orders.id})`,
        
        // Time-based metrics
        ordersLast24h: sql<number>`count(distinct case when ${orders.createdAt} >= now() - interval '24 hours' then ${orders.id} end)`,
        revenueLast24h: sql<number>`sum(case when ${orders.createdAt} >= now() - interval '24 hours' then ${orders.total} else 0 end)`,
        
        // Status distribution
        pendingOrders: sql<number>`count(case when ${orders.status} = 'pending' then 1 end)`,
        completedOrders: sql<number>`count(case when ${orders.status} = 'completed' then 1 end)`,
        
        // Product metrics
        avgProductPrice: sql<number>`avg(${products.price})`,
        totalInventoryValue: sql<number>`sum(${products.price} * ${products.stock})`
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id));
    const statsTime = Date.now() - statsStart;

    // Enhanced top products analysis
    const productsStart = Date.now();
    const topProducts = await db
      .select({
        productId: products.id,
        productName: products.name,
        totalSold: sql<number>`sum(${orderItems.quantity})`,
        revenue: sql<number>`sum(${orderItems.quantity} * ${orderItems.price})`,
        averageOrderSize: sql<number>`avg(${orderItems.quantity})`,
        totalOrders: sql<number>`count(distinct ${orders.id})`,
        inStockValue: sql<number>`${products.price} * ${products.stock}`,
        averageOrderValue: sql<number>`avg(${orderItems.quantity} * ${orderItems.price})`,
        lastOrderDate: sql<string>`max(${orders.createdAt})`,
        stockStatus: sql<string>`
          CASE 
            WHEN ${products.stock} = 0 THEN 'Out of Stock'
            WHEN ${products.stock} < 10 THEN 'Low Stock'
            WHEN ${products.stock} < 50 THEN 'Medium Stock'
            ELSE 'Well Stocked'
          END
        `
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .groupBy(products.id, products.name, products.price, products.stock)
      .orderBy(sql`sum(${orderItems.quantity} * ${orderItems.price}) desc`)
      .limit(10);
    const productsTime = Date.now() - productsStart;

    // Enhanced recent orders with detailed analysis
    const ordersStart = Date.now();
    const recentOrders = await db
      .select({
        orderId: orders.id,
        orderDate: orders.createdAt,
        total: orders.total,
        status: orders.status,
        customerName: users.name,
        customerEmail: users.email,
        itemCount: sql<number>`count(${orderItems.id})`,
        uniqueProducts: sql<number>`count(distinct ${orderItems.productId})`,
        avgProductPrice: sql<number>`avg(${orderItems.price})`,
        highestProductPrice: sql<number>`max(${orderItems.price})`,
        lowestProductPrice: sql<number>`min(${orderItems.price})`,
        totalQuantity: sql<number>`sum(${orderItems.quantity})`,
        customerOrderCount: sql<number>`(
          select count(*) from ${orders} o2 
          where o2.user_id = ${orders.userId}
        )`,
        customerTotalSpent: sql<number>`(
          select sum(total) from ${orders} o2 
          where o2.user_id = ${orders.userId}
        )`
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .groupBy(orders.id, users.id)
      .orderBy(desc(orders.createdAt))
      .limit(20);
    const ordersTime = Date.now() - ordersStart;

    // Calculate hourly order trends
    const trendsStart = Date.now();
    const hourlyTrends = await db
      .select({
        hour: sql<string>`date_trunc('hour', ${orders.createdAt})`,
        orderCount: sql<number>`count(distinct ${orders.id})`,
        revenue: sql<number>`sum(${orders.total})`,
        avgOrderValue: sql<number>`avg(${orders.total})`,
        uniqueCustomers: sql<number>`count(distinct ${orders.userId})`
      })
      .from(orders)
      .where(gte(orders.createdAt, sql`now() - interval '24 hours'`))
      .groupBy(sql`date_trunc('hour', ${orders.createdAt})`)
      .orderBy(sql`date_trunc('hour', ${orders.createdAt})`);
    const trendsTime = Date.now() - trendsStart;

    const dbTime = Date.now() - dbStart;
    const functionTime = Date.now() - functionStart;

    return NextResponse.json({
      region,
      stats: orderStats[0],
      topProducts,
      recentOrders,
      hourlyTrends,
      timing: {
        total: functionTime,
        db: dbTime,
        queries: {
          stats: statsTime,
          products: productsTime,
          orders: ordersTime,
          trends: trendsTime
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


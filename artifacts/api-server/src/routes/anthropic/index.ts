import { Router } from "express";
import { db } from "@workspace/db";
import {
  conversations as conversationsTable,
  messages as messagesTable,
  salesTable,
  saleItemsTable,
  productsTable,
  expensesTable,
  customersTable,
} from "@workspace/db";
import { eq, desc, gte, sql } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

// Use own API key directly (not Replit integration)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── Build rich business context for the AI ───────────────────────────────────
async function buildBusinessContext(): Promise<string> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // All-time totals
  const [allTime] = await db.select({
    totalRevenue: sql<number>`COALESCE(SUM(${salesTable.totalAmount}),0)::numeric`,
    totalProfit: sql<number>`COALESCE(SUM(${salesTable.profit}),0)::numeric`,
    totalSales: sql<number>`COUNT(*)::int`,
  }).from(salesTable);

  // This month
  const [thisMonth] = await db.select({
    revenue: sql<number>`COALESCE(SUM(${salesTable.totalAmount}),0)::numeric`,
    profit: sql<number>`COALESCE(SUM(${salesTable.profit}),0)::numeric`,
    sales: sql<number>`COUNT(*)::int`,
  }).from(salesTable).where(gte(salesTable.createdAt, monthStart));

  // This year
  const [thisYear] = await db.select({
    revenue: sql<number>`COALESCE(SUM(${salesTable.totalAmount}),0)::numeric`,
    profit: sql<number>`COALESCE(SUM(${salesTable.profit}),0)::numeric`,
  }).from(salesTable).where(gte(salesTable.createdAt, yearStart));

  // This month expenses
  const [monthExpenses] = await db.select({
    total: sql<number>`COALESCE(SUM(${expensesTable.amount}),0)::numeric`,
  }).from(expensesTable).where(
    gte(expensesTable.date, monthStart.toISOString().split("T")[0])
  );

  // Inventory
  const [inventory] = await db.select({
    totalProducts: sql<number>`COUNT(*)::int`,
    inventoryValue: sql<number>`COALESCE(SUM(${productsTable.costPrice} * ${productsTable.stockQuantity}),0)::numeric`,
    lowStockCount: sql<number>`COUNT(CASE WHEN ${productsTable.stockQuantity} <= ${productsTable.lowStockThreshold} THEN 1 END)::int`,
  }).from(productsTable);

  // Customers
  const [custCount] = await db.select({
    total: sql<number>`COUNT(*)::int`,
  }).from(customersTable);

  // Top 5 products by revenue (all time)
  const topProducts = await db.select({
    name: productsTable.name,
    brand: productsTable.brand,
    unitsSold: sql<number>`COALESCE(SUM(${saleItemsTable.quantity}),0)::int`,
    revenue: sql<number>`COALESCE(SUM(${saleItemsTable.lineTotal}),0)::numeric`,
    profit: sql<number>`COALESCE(SUM(${saleItemsTable.lineProfit}),0)::numeric`,
  })
    .from(saleItemsTable)
    .leftJoin(productsTable, eq(saleItemsTable.productId, productsTable.id))
    .groupBy(productsTable.id, productsTable.name, productsTable.brand)
    .orderBy(desc(sql`SUM(${saleItemsTable.lineTotal})`))
    .limit(5);

  // Expense breakdown this month
  const expensesByCategory = await db.select({
    category: expensesTable.category,
    total: sql<number>`COALESCE(SUM(${expensesTable.amount}),0)::numeric`,
  }).from(expensesTable)
    .where(gte(expensesTable.date, monthStart.toISOString().split("T")[0]))
    .groupBy(expensesTable.category)
    .orderBy(desc(sql`SUM(${expensesTable.amount})`));

  // Low stock products
  const lowStockItems = await db.select({
    name: productsTable.name,
    stock: productsTable.stockQuantity,
    threshold: productsTable.lowStockThreshold,
    sellingPrice: productsTable.sellingPrice,
  }).from(productsTable)
    .where(sql`${productsTable.stockQuantity} <= ${productsTable.lowStockThreshold}`)
    .limit(10);

  // Recent 5 sales
  const recentSales = await db.select({
    totalAmount: salesTable.totalAmount,
    profit: salesTable.profit,
    paymentMethod: salesTable.paymentMethod,
    createdAt: salesTable.createdAt,
  }).from(salesTable).orderBy(desc(salesTable.createdAt)).limit(5);

  const K = (n: number | null) => `K ${Number(n ?? 0).toFixed(2)}`;

  return `
=== MOBITRACK BUSINESS INTELLIGENCE REPORT ===
Generated: ${now.toLocaleDateString("en-ZM", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
Business: MobiTrack — Phone & Accessory Shop, Zambia
Currency: Zambian Kwacha (ZMW, symbol K)

--- ALL-TIME PERFORMANCE ---
Total Revenue: ${K(allTime.totalRevenue)}
Total Profit: ${K(allTime.totalProfit)}
Total Sales Transactions: ${allTime.totalSales}

--- THIS MONTH (${now.toLocaleString("default", { month: "long", year: "numeric" })}) ---
Revenue: ${K(thisMonth.revenue)}
Profit: ${K(thisMonth.profit)}
Sales Transactions: ${thisMonth.sales}
Expenses: ${K(monthExpenses.total)}
Net Profit (after expenses): ${K(Number(thisMonth.profit) - Number(monthExpenses.total))}

--- THIS YEAR (${now.getFullYear()}) ---
Revenue: ${K(thisYear.revenue)}
Profit: ${K(thisYear.profit)}

--- INVENTORY ---
Total Products: ${inventory.totalProducts}
Inventory Value (cost): ${K(inventory.inventoryValue)}
Low Stock Items: ${inventory.lowStockCount}

--- CUSTOMERS ---
Total Customers Registered: ${custCount.total}

--- TOP SELLING PRODUCTS (All Time) ---
${topProducts.map((p, i) => `${i + 1}. ${p.name} (${p.brand}) — ${p.unitsSold} units sold, Revenue: ${K(p.revenue)}, Profit: ${K(p.profit)}`).join("\n") || "No sales data yet."}

--- THIS MONTH'S EXPENSES BY CATEGORY ---
${expensesByCategory.map(e => `• ${e.category}: ${K(e.total)}`).join("\n") || "No expenses recorded this month."}

--- LOW STOCK ALERTS ---
${lowStockItems.map(p => `⚠ ${p.name} — ${p.stock} left (threshold: ${p.threshold}), selling at ${K(p.sellingPrice)}`).join("\n") || "All stock levels are healthy."}

--- RECENT TRANSACTIONS ---
${recentSales.map(s => `• ${new Date(s.createdAt).toLocaleDateString()} — ${K(s.totalAmount)} (profit: ${K(s.profit)}, via ${s.paymentMethod})`).join("\n") || "No recent sales."}
`.trim();
}

// ─── List conversations ───────────────────────────────────────────────────────
router.get("/conversations", async (_req, res) => {
  const conversations = await db
    .select()
    .from(conversationsTable)
    .orderBy(desc(conversationsTable.createdAt));
  res.json(conversations);
});

// ─── Create conversation ──────────────────────────────────────────────────────
router.post("/conversations", async (req, res) => {
  const { title } = req.body as { title: string };
  const [conv] = await db
    .insert(conversationsTable)
    .values({ title: title || "New Chat" })
    .returning();
  res.status(201).json(conv);
});

// ─── Get conversation with messages ──────────────────────────────────────────
router.get("/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id));
  if (!conv) return res.status(404).json({ error: "Not found" });

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.createdAt);

  res.json({ ...conv, messages });
});

// ─── Delete conversation ──────────────────────────────────────────────────────
router.delete("/conversations/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(messagesTable).where(eq(messagesTable.conversationId, id));
  const deleted = await db
    .delete(conversationsTable)
    .where(eq(conversationsTable.id, id))
    .returning();
  if (!deleted.length) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

// ─── List messages ────────────────────────────────────────────────────────────
router.get("/conversations/:id/messages", async (req, res) => {
  const id = parseInt(req.params.id);
  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.createdAt);
  res.json(messages);
});

// ─── Send message + stream AI response ───────────────────────────────────────
router.post("/conversations/:id/messages", async (req, res) => {
  const convId = parseInt(req.params.id);
  const { content } = req.body as { content: string };

  if (!content?.trim()) {
    return res.status(400).json({ error: "content is required" });
  }

  // Save user message
  await db.insert(messagesTable).values({
    conversationId: convId,
    role: "user",
    content: content.trim(),
  });

  // Fetch all previous messages for context
  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, convId))
    .orderBy(messagesTable.createdAt);

  // Build business context
  const businessContext = await buildBusinessContext();

  // Build chat messages for Claude
  const chatMessages = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  let fullResponse = "";
  let cancelled = false;

  // Cancel Anthropic stream if client disconnects
  req.on("close", () => {
    cancelled = true;
  });

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: `You are Mia, the dedicated AI Business Advisor for MobiTrack — a phone and mobile accessories shop based in Zambia. You are embedded inside the MobiTrack business management system.

Your role is to be the owner's trusted business partner. You have real-time access to the shop's complete business data (sales, inventory, customers, expenses, profit/loss). Use this data to give specific, data-driven answers and recommendations — never generic advice.

CURRENT BUSINESS INTELLIGENCE:
${businessContext}

CAPABILITIES:
- Analyze sales performance, trends, and patterns using the real data above
- Calculate margins, profit percentages, growth rates on request
- Identify best and worst performing products
- Flag risks: low stock, expense spikes, slow sales periods
- Give tailored strategies for growing revenue, reducing costs, improving cash flow
- Answer questions like "What's my profit margin this month?", "Which phone sells best?", "Am I spending too much on rent?", "How do I increase sales?"
- Suggest restock priorities based on sales velocity and stock levels
- Provide pricing strategies and competitor positioning advice for the Zambian market

PERSONALITY & STYLE:
- Professional but warm — like a smart friend who knows business
- Always cite real numbers from the data when answering
- Be specific: say "Your Galaxy A15 made K 500 profit this month" not "some phones do well"
- Use Zambian Kwacha (K) for all currency amounts
- Keep answers clear and actionable — no fluff
- If asked to chart or visualize data, describe the chart clearly in text (the UI will render charts separately)
- When you spot a concern in the data, proactively flag it even if not directly asked

You can answer ANY business question. You are the smartest business mind in the room.`,
      messages: chatMessages,
    });

    for await (const event of stream) {
      if (cancelled) break;
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullResponse += event.delta.text;
        res.write(
          `data: ${JSON.stringify({ content: event.delta.text })}\n\n`
        );
      }
    }

    // Save assistant message
    await db.insert(messagesTable).values({
      conversationId: convId,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: unknown) {
    console.error("Anthropic stream error:", err);
    res.write(
      `data: ${JSON.stringify({ error: "AI error — please try again." })}\n\n`
    );
    res.end();
  }
});

export default router;

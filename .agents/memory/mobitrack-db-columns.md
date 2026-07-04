---
name: MobiTrack DB column names
description: Actual Drizzle column names for products and sale_items tables — tripped up once with wrong names
---

## Products table (`productsTable`)
- `stockQuantity` (NOT `stock`) — integer, stock_quantity
- `lowStockThreshold` — integer, low_stock_threshold
- `costPrice` — numeric
- `sellingPrice` — numeric

## Sale items table (`saleItemsTable`)
- `lineTotal` (NOT `revenue`) — numeric, line_total
- `lineProfit` (NOT `profit`) — numeric, line_profit
- `quantity` — integer

## Conversations / Messages tables
- Exported as `conversations` and `messages` (NOT `conversationsTable`/`messagesTable`)
- Import alias pattern: `import { conversations as conversationsTable, messages as messagesTable } from "@workspace/db"`

**Why:** esbuild does not catch these mismatches at build time (only tsc does), so bad column names silently compile but crash at runtime.

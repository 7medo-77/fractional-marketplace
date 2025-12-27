# Agent Context Guide

## Project: Fractional Marketplace

## Quick Links to Documentation
- [Architecture](./architecture.md)
- [Requirements](./PRD.md)
- [API Specification](./api-spec.md)
- [Data Schema](./schema.md)

## Current Task: [ALWAYS UPDATE THIS SECTION]
Create a mock data generator for our fractional marketplace. Here are the SPECIFIC requirements:

## CONTEXT:
- Each asset has its own separate order book
- We only generate LIMIT orders for the order book (market orders execute immediately)
- Update every 500ms

## REQUIREMENTS:

1. **Input Parameters**:
   - `assetId: string`
   - `currentPrice: number` (e.g., 5000 for $5,000/share)
   - `existingOrders: { bids: Order[], asks: Order[] }` (to modify, not replace)

2. **Bid Generation (BUY limit orders)**:
   - Price range: currentPrice × (0.85 to 0.95) [5-15% below current]
   - Quantity: 1-50 shares (random integer)
   - Order type: Always "limit"
   - Action: Randomly add new bids OR remove existing bids (70% add, 30% remove)

3. **Ask Generation (SELL limit orders)**:
   - Price range: currentPrice × (1.05 to 1.15) [5-15% above current]
   - Quantity: 1-50 shares (random integer)
   - Order type: Always "limit"
   - Action: Randomly add new asks OR remove existing asks (70% add, 30% remove)

4. **Order Book Structure**:
   - Bids sorted HIGHEST to LOWEST price
   - Asks sorted LOWEST to HIGHEST price
   - Each price level aggregates all orders at that price

5. **Calculate Totals CORRECTLY**:
   Use this EXACT formula for each price level:
   TotalCost = ∑(Price_i × Quantity_i) for i=0 to n

  At each price level: Total = Price × (Sum of all quantities at that price)

6. **Output Format**:
```typescript
{
assetId: string,
bids: Array<{
 price: number,      // e.g., 4750.50
 quantity: number,   // total shares at this price
 total: number       // price × quantity (formatted to 2 decimals)
}>,
asks: Array<{
 price: number,
 quantity: number,
 total: number
}>,
timestamp: string
}
```

## Key Constraints
- Update order book every 500ms with mock data
- Support limit and market orders
- Use in-memory storage for mock
- TypeScript strict mode

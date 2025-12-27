# Agent Context Guide

## Project: Fractional Marketplace

## Quick Links to Documentation
- [Architecture](./architecture.md)
- [Requirements](./PRD.md)
- [API Specification](./api-spec.md)
- [Data Schema](./schema.md)

## Current Task:
Update the fractional marketplace schema and implement the mock data generator with price drift:

## REQUIREMENTS:


## TASK 1: Update Schema
1. Add `currentPrice: number` to OrderBook interface
2. Consider adding `spread: number` (bestAsk - bestBid) for convenience
3. add the following attributes and include calculations for them (in MarketDataService) to OrderBook :
    ``` typescript
    currentPrice: number;          // Market price (last traded)
    spread: number;                // Optional: difference between best bid/ask
    bestBid?: number;              // Optional: highest bid price
    bestAsk?: number;              // Optional: lowest ask price
    ```

## TASK 2: Implement Price Drift in Mock Generator
- Price is initially set from the Asset's currentPrice (upon initialization)
- Apply a small Price drift Δp is proportional to I in the following equation:
  I =  Qbid − Qask / Qbid + Qask
- The mock generator funtion inside MarketDataService should also update the current price of the Asset using updateAssetPrice function (which also stores the price history).
- Price drift also means that new bids/asks will reference the currentPrice attribute
- since the front end will use the orderbook data to construct a depth chart per asset, Make sure the client does not do any heavy computation. All heavy computation necessary to construct both an order book and a depth chart should be done on the backend

### TASK 3: Update WebSocket Message Format
```json

{
  "event": "orderbook_update",
  "data": {
    "assetId": "asset_001",
    "currentPrice": 4850.75,  // REQUIRED for depth chart
    "spread": 50.25,          // Optional: bestAsk - bestBid
    "bids": [...],
    "asks": [...],
    "timestamp": "..."
  }
}
```
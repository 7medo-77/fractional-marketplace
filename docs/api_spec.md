# API Specification

## REST API (Express)

### Base URL: `/api/v1`

## Get asset details
#### GET `/api/assets/:id`

Response:
```json
{
  "id": "asset_001",
  "name": "1965 Ferrari 275 GTB",
  "description": "Vintage sports car",
  "totalShares": 1000,
  "availableShares": 450,
  "currentPrice": 4850,
  "priceChange24h": 2.5
}
```

#### POST /api/orders/limit
Place limit order

Request:
```json

{
  "assetId": "asset_001",
  "type": "buy",
  "quantity": 10,
  "price": 500,
  "userId": "user_001"
}
```

#### POST /api/orders/market
Place market order

Request:
```json

{
  "assetId": "asset_001",
  "type": "buy",
  "quantity": 10,
  "userId": "user_001"
}
```

#### GET /api/orders/book/:assetId
Get current order book (optional, mainly via Socket.io)
WebSocket API
### Connection: ```ws://localhost:3001/ws```

Events:
  - orderbook_update: Sent every 500ms with new order book

  - trade_executed: When an order is matched

  - order_confirmed: User order confirmation

### Order Book Update Format:
```json

{
  "event": "orderbook_update",
  "data": {
    "assetId": "asset_001",
    "bids": [
      {"price": 495, "quantity": 15, "total": 7425},
      {"price": 490, "quantity": 20, "total": 9800}
    ],
    "asks": [
      {"price": 500, "quantity": 10, "total": 5000},
      {"price": 505, "quantity": 8, "total": 4040}
    ],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```
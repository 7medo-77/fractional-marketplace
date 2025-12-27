import { Router, Request, Response } from 'express';
import AssetStore from '../store/AssetStore';
import OrderService from '../services/OrderService';
import OrderBookStore from '../store/OrderBookStore';

const router = Router();

// GET /api/v1/assets/:id
router.get('/assets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const asset = AssetStore.getAsset(id);

  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  // Calculate 24h price change
  const priceChange24h =
    asset.priceHistory.length > 1
      ? ((asset.currentPrice - asset.priceHistory[0].price) /
          asset.priceHistory[0].price) *
        100
      : 0;

  res.json({
    ...asset,
    priceChange24h: Number(priceChange24h.toFixed(2)),
  });
});

// GET /api/v1/assets (landing page list)
router.get('/assets', (_req: Request, res: Response) => {
  const assets = AssetStore.getAllAssets();
  res.json(assets);
});

// POST /api/v1/orders/limit
router.post('/orders/limit', async (req: Request, res: Response) => {
  const { assetId, type, quantity, price, userId } = req.body;

  if (!assetId || !type || !quantity || !price || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const order = await OrderService.placeLimitOrder({
      assetId,
      type,
      quantity,
      price,
      userId,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST /api/v1/orders/market
router.post('/orders/market', async (req: Request, res: Response) => {
  const { assetId, type, quantity, userId } = req.body;

  if (!assetId || !type || !quantity || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await OrderService.placeMarketOrder({
      assetId,
      type,
      quantity,
      userId,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// GET /api/v1/orders/book/:assetId
router.get('/orders/book/:assetId', (req: Request, res: Response) => {
  const { assetId } = req.params;
  const orderBook = OrderBookStore.getOrderBook(assetId);

  res.json(orderBook);
});

export default router;
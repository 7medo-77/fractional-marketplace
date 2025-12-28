import * as Comlink from 'comlink';

export type OrderBookEntry = {
  price: number;
  quantity: number;
};

export interface DepthChartPoint {
  price: number;
  bidDepth: number;
  askDepth: number;
}

/**
 * Worker-local copy of prepareDepthChartData.
 * (Kept here to avoid bundler/path alias issues in worker context.)
 */
function prepareDepthChartData(
  bids: OrderBookEntry[],
  asks: OrderBookEntry[],
  currentPrice: number
): DepthChartPoint[] {
  const sortedBids = [...bids].sort((a, b) => b.price - a.price);
  const sortedAsks = [...asks].sort((a, b) => a.price - b.price);

  let bidCumulative = 0;
  const bidData: DepthChartPoint[] = sortedBids
    .map((bid) => {
      bidCumulative += bid.quantity;
      return { price: bid.price, bidDepth: bidCumulative, askDepth: 0 };
    })
    .reverse().slice(0, 50);

  let askCumulative = 0;
  const askData: DepthChartPoint[] = sortedAsks.map((ask) => {
    askCumulative += ask.quantity;
    return { price: ask.price, bidDepth: 0, askDepth: askCumulative };
  }).slice(0, 50);

  const midpoint: DepthChartPoint = { price: currentPrice, bidDepth: 0, askDepth: 0 };

  return [...bidData, midpoint, ...askData];
}

const api = {
  prepareDepthChartData,
};

export type DepthChartWorkerApi = typeof api;

Comlink.expose(api);
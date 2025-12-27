import { Trade } from '../models/Trade';

class TradeStore {
  private trades: Trade[] = [];

  addTrade(trade: Trade) {
    this.trades.push(trade);
  }

  getTradesByAsset(assetId: string): Trade[] {
    return this.trades.filter((trade) => trade.assetId === assetId);
  }

  getAllTrades(): Trade[] {
    return this.trades;
  }

  getRecentTrades(limit: number = 50): Trade[] {
    return this.trades.slice(-limit);
  }
}

export default new TradeStore();
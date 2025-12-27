export interface Trade {
  id: string;
  assetId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  price: number;
  executedAt: string;
}
/**
 * Types for Asset Card component
 */

import type { Asset } from '@/types';

export interface AssetCardProps {
  asset: Asset;
  onClick?: () => void;
}
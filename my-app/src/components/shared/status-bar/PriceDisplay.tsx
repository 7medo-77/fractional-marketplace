/**
 * Price Display Component
 * Displays price with proper formatting and real-time updates
 *
 * Following clean code principles:
 * - Single Responsibility: Only displays price information
 * - Type Safety: Fully typed props
 */

'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceDisplayProps {
  currentPrice: number;
  previousPrice?: number;
  showChange?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PriceDisplay({
  currentPrice,
  previousPrice,
  showChange = true,
  size = 'md',
  className = '',
}: PriceDisplayProps) {
  const priceChange = previousPrice ? currentPrice - previousPrice : 0;
  const priceChangePercent = previousPrice
    ? (priceChange / previousPrice) * 100
    : 0;
  const isPriceUp = priceChange > 0;
  const isPriceDown = priceChange < 0;

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const changeColorClass = isPriceUp
    ? 'text-green-600 dark:text-green-400'
    : isPriceDown
    ? 'text-red-600 dark:text-red-400'
    : 'text-muted-foreground';

  return (
    <div className={`flex items-baseline gap-3 ${className}`}>
      {/* Price */}
      <span className={`font-bold ${sizeClasses[size]}`}>
        {formatCurrency(currentPrice)}
      </span>

      {/* Change Indicator */}
      {showChange && priceChange !== 0 && (
        <div className={`flex items-center gap-1 text-sm font-medium ${changeColorClass}`}>
          {isPriceUp ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span>
            {isPriceUp ? '+' : ''}
            {priceChangePercent.toFixed(2)}%
          </span>
          <span className="text-xs text-muted-foreground">
            ({isPriceUp ? '+' : ''}
            {formatCurrency(priceChange)})
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Format number as currency
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
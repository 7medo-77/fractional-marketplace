/**
 * DEPRECATED:
 * Asset detail state is now consolidated into socketStore.tsx (single Zustand store).
 * Keep this file to avoid changing imports across the app.
 */

'use client';

export { useSocketStore as useAssetDetailStore } from '@/stores/socketStore';
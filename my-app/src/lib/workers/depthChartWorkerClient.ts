'use client';

import * as Comlink from 'comlink';
import type { DepthChartWorkerApi } from '@/workers/depthChart.worker';

let worker: Worker | null = null;
let remote: Comlink.Remote<DepthChartWorkerApi> | null = null;

export function getDepthChartWorker(): Comlink.Remote<DepthChartWorkerApi> {
  if (typeof window === 'undefined') {
    throw new Error('Depth chart worker can only be used in the browser');
  }

  if (!remote) {
    worker = new Worker(new URL('../../workers/depthChart.worker.ts', import.meta.url), {
      type: 'module',
      name: 'depth-chart-worker',
    });

    remote = Comlink.wrap<DepthChartWorkerApi>(worker);
  }

  return remote;
}

export function terminateDepthChartWorker() {
  if (worker) worker.terminate();
  worker = null;
  remote = null;
}
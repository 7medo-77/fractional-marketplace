/**
 * Error boundary for Asset Detail Page
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

interface AssetDetailErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AssetDetailError({
  error,
  reset,
}: AssetDetailErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Asset Detail Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            We couldn&apos;t load the asset details. This might be a temporary issue.
          </p>

          {error.message && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Error: {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={reset} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button asChild variant="outline">
              <Link href="/assets">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Assets
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

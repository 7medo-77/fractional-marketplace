import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, ShieldCheck, TrendingUp, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black ">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">

        <div className="flex flex-col items-center justify-center space-y-12 py-12">
          {/* Hero Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Trade Fractional Assets
            </h1>
            <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
              Buy and sell fractional ownership of high-value assets like vintage
              cars and real estate
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild >
                <Link href="/assets" className="px-4">
                  Browse Assets{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" >
                <Link href="/history" className="px-4">View Portfolio</Link>
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid w-full max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <TrendingUp className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Real-Time Trading</CardTitle>
                <CardDescription>
                  Live order books updating every 500ms for instant market
                  insights
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <ShieldCheck className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Secure Transactions</CardTitle>
                <CardDescription>
                  Trade with confidence using our secure matching engine
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Instant Execution</CardTitle>
                <CardDescription>
                  Market orders execute immediately at the best available price
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Stats */}
          <div className="w-full max-w-5xl rounded-lg border bg-card p-8">
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-3xl font-bold">$2.5M+</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Total Volume
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">500+</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Active Traders
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">15</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Available Assets
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

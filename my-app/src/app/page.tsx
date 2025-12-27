import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, ShieldCheck, TrendingUp, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>

        <div className="flex flex-col items-center justify-center space-y-12 py-12">
          {/* Hero Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Trade Fractional Assets
            </h1>
            <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
              Buy and sell fractional ownership of high-value assets like vintage
              cars and real estate
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/assets">
                  Browse Assets{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/portfolio">View Portfolio</Link>
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

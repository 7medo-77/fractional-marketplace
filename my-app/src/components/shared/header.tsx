'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

export function Header() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-lg font-bold">F</span>
          </div>
          <span className="hidden text-xl font-bold sm:inline-block">
            Fractional Marketplace
          </span>
          <span className="text-xl font-bold sm:hidden">FM</span>
        </Link>

        {/* Navigation */}
        <nav className=" items-center space-x-6 md:flex">
          <Link
            href="/assets"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Assets
          </Link>
          {/* <Link
            href="/portfolio"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Portfolio
          </Link> */}
          <Link
            href="/history"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Trading History
          </Link>
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Current Time */}
          <div className="hidden text-sm text-muted-foreground lg:block">
            {currentTime}
          </div>

          {/* User Menu */}
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <User className="h-5 w-5" />
            <span className="sr-only">User menu</span>
          </Button>

        </div>
      </div>
    </header>
  );
}
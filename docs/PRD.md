# Project: Fractional Asset Marketplace
## 1. Executive Summary

A secondary market platform allowing users to trade fractional ownership (shares) of high-value assets like vintage cars and real estate. The goal is a high-performance, real-time trading experience.

## 2. Core Features
- F1: Asset Detail View

    Display high-level asset info (Name, Total Valuation, Category).

    Live Price Ticker: A real-time display of the "Last Traded Price."

- F2: Real-time Order Book

    Visuals: A vertical list of Bids (green) and Asks (red).

    Updates: Must update every 500ms via WebSocket.

    Data Points: Each entry shows Price per 1% share and Quantity available.

- F3: Trade Interface

    Limit Orders: User specifies Price and Quantity. Order enters the book if not filled.

    Market Orders: User specifies Quantity only. Executed immediately against the best available price in the book.

    Validation: Basic frontend validation to prevent negative numbers or empty fields.

## 3. User Stories

    As a trader, I want to see the order book move in real-time so I can time my entry.

    As a trader, I want to buy a 10% share of a Ferrari at the current market price instantly (market order).

    As a trader, I want to place a "Buy" order at a lower price and wait for someone to sell to me (limit order).

## 4. Success Metrics for 36-Hour Build

    Zero lag between backend mock generation and frontend UI updates.

    Market orders correctly calculate the total cost across multiple price levels.
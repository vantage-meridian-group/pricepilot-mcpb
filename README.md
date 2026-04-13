# PricePilot — CPG Pricing Intelligence for Claude Desktop

Free competitive pricing benchmarks for consumer packaged goods brands.
Compare your products against Amazon category averages, track pricing
trends, and understand your market position — all through conversation
with Claude.

## Features

| Tool | What it does |
|------|-------------|
| **Get Price Position** | Check where your product price sits vs Amazon competitors. Returns percentile rank, Price Index, and Value/Parity/Premium classification. |
| **Get Category Trend** | See whether Amazon prices in your category are rising, stable, or falling over the last 30 days. |
| **Get Category Overview** | Get the full pricing landscape — budget/midmarket/premium tiers, median price, product count, and trend. |
| **Compare Products** | Compare multiple products side-by-side against category benchmarks. |
| **List Categories** | See all available categories: Grocery, Health & Beauty, Household, Pet Supplies. |
| **Server Status** | Check data freshness and server health. |

## Installation

Drag `pricepilot.mcpb` into Claude Desktop — that's it. No terminal, no
API keys, no configuration files.

Or download the latest release from
[GitHub Releases](https://github.com/vantage-meridian-group/pricepilot-mcpb/releases).

## Configuration

No configuration required. PricePilot is free and open-access — no API
key needed. The extension connects to PricePilot's hosted service
automatically.

## Examples

### Check Price Position

**User prompt:** "How is my protein powder priced at $24.99 compared to
the Health & Beauty category?"

**Expected behavior:**
- Extension calls `get_price_position` with price and category
- Returns percentile rank (e.g., 72nd percentile), Price Index, and
  market position (Value/Parity/Premium)
- Shows whether your product is above, below, or at the category average

### View Category Trends

**User prompt:** "Are grocery prices going up or down right now?"

**Expected behavior:**
- Extension calls `get_category_trend` for Grocery
- Returns 30-day trend direction (Rising/Stable/Falling)
- Confidence level based on number of tracked products

### Compare Products

**User prompt:** "Compare my three products: Oat Milk at $5.99, Almond
Butter at $12.49, and Granola at $7.99 in the Grocery category"

**Expected behavior:**
- Extension calls `compare_products` with all three products
- Returns side-by-side percentile ranks and market positions
- Identifies most and least competitive products vs category median

## Privacy Policy

See [Privacy Policy](https://app.pricepilot.vantagemeridiangroup.com/privacy).

PricePilot processes only the pricing queries you send — product prices
and category names. No personal data, conversation content, or browsing
history is collected or stored.

## Support

- [GitHub Issues](https://github.com/vantage-meridian-group/pricepilot-mcpb/issues)
- Email: scott@vantagemeridiangroup.com
- Website: [app.pricepilot.vantagemeridiangroup.com](https://app.pricepilot.vantagemeridiangroup.com)

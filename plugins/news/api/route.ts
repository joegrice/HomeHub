import { NextResponse } from "next/server"
import Parser from "rss-parser"
import type { NewsItem } from "../types"

const parser = new Parser()

/** `GET /api/news` — returns up to 5 BBC News headlines from the RSS feed. Server cache: 5 min. */
export async function GET() {
  try {
    const feed = await parser.parseURL("https://feeds.bbci.co.uk/news/rss.xml")

    const items: NewsItem[] = feed.items.slice(0, 5).map((item) => ({
      title: item.title ?? "(No title)",
      link: item.link ?? "#",
      pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      source: "BBC News",
    }))

    return NextResponse.json(items, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate" },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch news" },
      { status: 500 }
    )
  }
}

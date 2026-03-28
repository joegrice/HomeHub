import { NextResponse } from "next/server"
import type { NewsItem } from "../types"

const RSS_URL = "https://feeds.bbci.co.uk/news/rss.xml"

/** Extract first match of a tag's text content (strips CDATA wrappers). */
function extractTag(block: string, tag: string): string | undefined {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  if (!m) return undefined
  return m[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim()
}

/** `GET /api/news` — returns up to 5 BBC News headlines from the RSS feed. Server cache: 5 min. */
export async function GET() {
  try {
    const res = await fetch(RSS_URL, { next: { revalidate: 300 } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()

    const blocks = xml.match(/<item[\s\S]*?<\/item>/g) ?? []

    const items: NewsItem[] = blocks.map((block) => {
      const pubDate = extractTag(block, "pubDate")
      return {
        title: extractTag(block, "title") ?? "(No title)",
        link: extractTag(block, "guid") ?? extractTag(block, "link") ?? "#",
        pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source: "BBC News",
      }
    })

    items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    items.splice(5)

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

/** A single news headline returned by `GET /api/news`. */
export interface NewsItem {
  /** Headline text. */
  title: string
  /** URL of the full article. */
  link: string
  /** Publication date as an ISO 8601 string. */
  pubDate: string
  /** Name of the news source (currently always `"BBC News"`). */
  source: string
}

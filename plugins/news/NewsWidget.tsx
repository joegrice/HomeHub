"use client"

import { motion } from "framer-motion"
import { RefreshCw, AlertCircle, ChevronRight, Newspaper } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import WidgetCard, { CardHeader } from "@/components/WidgetCard"
import { usePlugin } from "@/lib/hooks/usePlugin"
import { relativeTime } from "@/lib/utils"
import type { NewsItem } from "./types"
import config from "./config"

const MOCK: NewsItem[] = [
  { title: "Spring Budget 2026: Chancellor unveils major infrastructure package", link: "#", pubDate: new Date(Date.now() - 1000 * 60 * 45).toISOString(), source: "BBC News" },
  { title: "NHS waiting lists hit record low as new hospitals open", link: "#", pubDate: new Date(Date.now() - 1000 * 60 * 90).toISOString(), source: "BBC News" },
  { title: "UK economy grows 0.4% in latest quarterly figures", link: "#", pubDate: new Date(Date.now() - 1000 * 60 * 150).toISOString(), source: "BBC News" },
  { title: "Scientists develop breakthrough treatment for Alzheimer's disease", link: "#", pubDate: new Date(Date.now() - 1000 * 60 * 210).toISOString(), source: "BBC News" },
  { title: "England secure dramatic Test victory in final over", link: "#", pubDate: new Date(Date.now() - 1000 * 60 * 300).toISOString(), source: "BBC News" },
]

export default function NewsWidget() {
  const { data, loading, error, lastUpdated, refresh } = usePlugin<NewsItem[]>(
    "/api/news",
    config.refreshMs
  )

  const items = data ?? MOCK
  const usingMock = !data

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="h-full"
    >
      <WidgetCard>
        <CardHeader label="BBC News">
          <div className="flex items-center gap-2">
            {loading && <RefreshCw className="h-3 w-3 text-[#6b7280] animate-spin" />}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[#6b7280] hover:text-white"
              onClick={refresh}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        {error && (
          <Alert className="mb-4 border-[#ef4444]/20 bg-[#ef4444]/5">
            <AlertCircle className="h-4 w-4 text-[#ef4444]" />
            <AlertDescription className="text-[#ef4444] text-sm">
              {error} <button onClick={refresh} className="underline ml-1">Retry</button>
            </AlertDescription>
          </Alert>
        )}

        {loading && !data ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full bg-[#1e1e2e]" />)}
          </div>
        ) : (
          <div className="divide-y divide-[#1e1e2e]">
            {items.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 py-3 group hover:bg-[#1a1a28] -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white leading-snug line-clamp-2 group-hover:text-[#3b82f6] transition-colors">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[9px] border-[#1e1e2e] text-[#6b7280] px-1.5 py-0">
                      {item.source}
                    </Badge>
                    <span className="text-[10px] text-[#6b7280]">{relativeTime(item.pubDate)}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#1e1e2e] group-hover:text-[#3b82f6] flex-shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-[#1e1e2e] flex items-center gap-2 text-[10px] text-[#6b7280]">
          <Newspaper className="h-3 w-3" />
          {usingMock ? (
            <span>Mock data</span>
          ) : lastUpdated ? (
            <span>Updated {relativeTime(lastUpdated)}</span>
          ) : null}
        </div>
      </WidgetCard>
    </motion.div>
  )
}

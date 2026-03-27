import Header from "@/components/Header"
import TrainWidget from "@/plugins/trains/TrainWidget"
import TubeWidget from "@/plugins/tube/TubeWidget"
import WeatherWidget from "@/plugins/weather/WeatherWidget"
import CalendarWidget from "@/plugins/calendar/CalendarWidget"
import NewsWidget from "@/plugins/news/NewsWidget"

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header />
      <main className="mx-auto max-w-screen-2xl px-4 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Trains: 4 cols */}
          <div className="lg:col-span-4">
            <TrainWidget />
          </div>
          {/* Tube: 4 cols */}
          <div className="lg:col-span-4">
            <TubeWidget />
          </div>
          {/* News: 4 cols */}
          <div className="lg:col-span-4">
            <NewsWidget />
          </div>
          {/* Weather: 6 cols */}
          <div className="md:col-span-2 lg:col-span-6">
            <WeatherWidget />
          </div>
          {/* Calendar: 6 cols */}
          <div className="md:col-span-2 lg:col-span-6">
            <CalendarWidget />
          </div>
        </div>
      </main>
    </div>
  )
}

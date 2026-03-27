export interface WeatherHour {
  time: string                    // ISO string
  screenTemperature: number       // °C
  feelsLikeTemperature: number    // °C
  precipitationRate: number       // mm/hr
  probOfPrecipitation: number     // %
  windSpeed10m: number            // mph
  windDirectionFrom10m: number    // degrees
  screenRelativeHumidity: number  // %
  weatherCode: number             // WMO code
}

export interface WeatherResponse {
  locationName: string
  hours: WeatherHour[]
}

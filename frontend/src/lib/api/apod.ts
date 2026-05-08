export interface Apod {
  title: string
  explanation: string
  url: string
  hdurl?: string
  media_type: 'image' | 'video'
  date: string
  copyright?: string
}

export async function fetchApod(): Promise<Apod> {
  const apiKey = import.meta.env.VITE_NASA_API_KEY
  const res = await fetch(
    `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`
  )
  if (!res.ok) throw new Error(`APOD fetch failed: ${res.status}`)
  return res.json()
}

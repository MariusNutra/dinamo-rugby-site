import { NextRequest, NextResponse } from 'next/server'
import { getResultsData } from '@/lib/results'

export async function GET(request: NextRequest) {
  const data = getResultsData()

  if (!data) {
    return NextResponse.json(
      { error: 'Rezultatele nu sunt disponibile momentan.' },
      { status: 404 }
    )
  }

  const { searchParams } = request.nextUrl
  const category = searchParams.get('category')
  const team = searchParams.get('team')

  // Filter by category if specified
  if (category) {
    const catData = data.categories[category.toUpperCase()]
    if (!catData) {
      return NextResponse.json(
        { error: `Categoria ${category} nu a fost gasita.` },
        { status: 404 }
      )
    }

    // Filter by team if specified
    if (team) {
      const pattern = new RegExp(team, 'i')
      const filtered = { ...catData }
      filtered.regions = {}

      for (const [region, regionData] of Object.entries(catData.regions)) {
        const filteredResults = regionData.results.map((etapa) => ({
          ...etapa,
          matches: etapa.matches.filter(
            (m) => pattern.test(m.homeTeam) || pattern.test(m.awayTeam)
          ),
        })).filter((e) => e.matches.length > 0)

        if (filteredResults.length > 0 || regionData.standings.length > 0) {
          filtered.regions[region] = {
            results: filteredResults,
            standings: regionData.standings,
          }
        }
      }

      return NextResponse.json({ lastUpdated: data.lastUpdated, category, data: filtered })
    }

    return NextResponse.json({ lastUpdated: data.lastUpdated, category, data: catData })
  }

  return NextResponse.json(data)
}

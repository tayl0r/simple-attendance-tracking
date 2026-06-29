export interface ParsedGame {
  week: number | null
  date: string   // 'YYYY-MM-DD'
  time: string   // e.g. '7:30 PM'
  homeTeam: string
  awayTeam: string
  location: string
}

function parseDate(dateStr: string): string {
  const [month, day] = dateStr.split('/').map(Number)
  let year = new Date().getFullYear()
  const candidate = new Date(year, month - 1, day)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  if (candidate < sixMonthsAgo) year++
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function parseScheduleImport(text: string): ParsedGame[] {
  const lines = text.split('\n')
  let currentWeek: number | null = null
  const seen = new Set<string>()
  const games: ParsedGame[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    if (/^week \d+/i.test(line)) {
      const match = line.match(/\d+/)
      currentWeek = match ? parseInt(match[0], 10) : null
      continue
    }

    // Split on 2+ consecutive spaces or tabs
    const tokens = line.split(/\s{2,}|\t/).map(t => t.trim()).filter(Boolean)
    if (tokens.length < 5) continue

    // tokens: ["Mon 7/6", "7:30 PM", "Home Team", "Away Team", "Location"]
    const dayDate = tokens[0]
    const time = tokens[1]
    const homeTeam = tokens[2]
    const awayTeam = tokens[3]
    const location = tokens.slice(4).join(' ')

    const datePart = dayDate.split(' ')[1]
    if (!datePart) continue
    const date = parseDate(datePart)

    const key = `${date}|${time}|${homeTeam}|${awayTeam}|${location}`
    if (seen.has(key)) continue
    seen.add(key)

    games.push({ week: currentWeek, date, time, homeTeam, awayTeam, location })
  }

  return games
}

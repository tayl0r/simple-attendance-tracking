export function parsePlayerImport(
  text: string
): { firstName: string; lastName: string }[] {
  if (typeof text !== 'string') return []
  const lines = text.split('\n')

  // Format A: "First Last ..." all on one header line
  let dataStartIdx = lines.findIndex(l => l.includes('First') && l.includes('Last'))
  if (dataStartIdx !== -1) {
    dataStartIdx += 1
  } else {
    // Format B: headers on separate lines ("First\nLast\nBirth Date\nPlayer State ID")
    const firstIdx = lines.findIndex(l => /^First$/i.test(l.trim()))
    if (firstIdx === -1) return []

    // Skip past all header/label lines
    const HEADER_PATTERN = /^(Last|Birth Date|Player State ID|Jersey No\.?|\d+)$/i
    let i = firstIdx + 1
    while (i < lines.length) {
      const t = lines[i].trim()
      if (!t || HEADER_PATTERN.test(t)) { i++; continue }
      break
    }
    dataStartIdx = i
  }

  return lines
    .slice(dataStartIdx)
    .filter(l => l.trim().length > 0)
    .map(l => {
      const tokens = l.trim().split(/\s+/)
      return { firstName: tokens[0], lastName: tokens[1] }
    })
    .filter(p => p.firstName && p.lastName)
}

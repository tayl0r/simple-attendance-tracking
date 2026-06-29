export function parsePlayerImport(
  text: string
): { firstName: string; lastName: string }[] {
  const lines = text.split('\n')
  const headerIdx = lines.findIndex(
    l => l.includes('First') && l.includes('Last')
  )
  if (headerIdx === -1) return []

  return lines
    .slice(headerIdx + 1)
    .filter(l => l.trim().length > 0)
    .map(l => {
      const tokens = l.trim().split(/\s+/)
      return { firstName: tokens[0], lastName: tokens[1] }
    })
    .filter(p => p.firstName && p.lastName)
}

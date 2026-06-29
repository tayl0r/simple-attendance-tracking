import { describe, it, expect } from 'vitest'
import { parseScheduleImport } from './schedule'

const SAMPLE = [
  'Week 2',
  'Mon 7/6    7:30 PM    CBSC She-Nanigans    OUSC Oly United    William Bush #1',
  'Wed 7/8    7:30 PM    OUSC Oly United    TeYSC Ladybugs    PP #4',
  'Week 3',
  'Mon 7/13    6:00 PM    OUSC Olympia FC    OUSC Oly United    RV Field #5A',
].join('\n')

const SAMPLE_WITH_DUPE = [
  'Week 2',
  'Mon 7/6    7:30 PM    CBSC She-Nanigans    OUSC Oly United    William Bush #1',
  '',
  'Week 2',
  'Mon 7/6    7:30 PM    CBSC She-Nanigans    OUSC Oly United    William Bush #1',
].join('\n')

describe('parseScheduleImport', () => {
  it('parses week numbers from Week N lines', () => {
    const result = parseScheduleImport(SAMPLE)
    expect(result[0].week).toBe(2)
    expect(result[2].week).toBe(3)
  })

  it('parses game fields correctly', () => {
    const result = parseScheduleImport(SAMPLE)
    expect(result[0]).toMatchObject({
      week: 2,
      time: '7:30 PM',
      homeTeam: 'CBSC She-Nanigans',
      awayTeam: 'OUSC Oly United',
      location: 'William Bush #1',
    })
  })

  it('parses date as YYYY-MM-DD', () => {
    const result = parseScheduleImport(SAMPLE)
    expect(result[0].date).toMatch(/^\d{4}-07-06$/)
  })

  it('de-dupes identical rows', () => {
    const result = parseScheduleImport(SAMPLE_WITH_DUPE)
    expect(result).toHaveLength(1)
  })

  it('trims whitespace from all fields', () => {
    const result = parseScheduleImport(SAMPLE)
    expect(result[0].homeTeam).toBe('CBSC She-Nanigans')
    expect(result[0].location).toBe('William Bush #1')
  })

  it('returns empty array for empty input', () => {
    expect(parseScheduleImport('')).toEqual([])
  })
})

import { describe, it, expect } from 'vitest'
import { parsePlayerImport } from './players'

const SAMPLE = [
  'Jersey No.',
  '23',
  '5',
  '',
  'First\tLast\tBirth Date\tPlayer State ID',
  'Aleena Lopez 3/23/2012 LOPEZALE20120323326169',
  'Zoe Steil 5/5/2012 STEILZOE20120505563190',
  'Evelyn Davis-bloom 3/23/2012 DAVISEVE20120323336746',
].join('\n')

describe('parsePlayerImport', () => {
  it('parses first and last name from player rows', () => {
    const result = parsePlayerImport(SAMPLE)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ firstName: 'Aleena', lastName: 'Lopez' })
    expect(result[1]).toEqual({ firstName: 'Zoe', lastName: 'Steil' })
    expect(result[2]).toEqual({ firstName: 'Evelyn', lastName: 'Davis-bloom' })
  })

  it('ignores jersey numbers section', () => {
    const result = parsePlayerImport(SAMPLE)
    expect(result.some(p => p.firstName === '23')).toBe(false)
  })

  it('returns empty array when no header found', () => {
    expect(parsePlayerImport('no header\nsome data')).toEqual([])
  })

  it('handles header with spaces instead of tabs', () => {
    const text = 'First Last Birth Date Player State ID\nJohn Doe 1/1/2000 ABC123'
    const result = parsePlayerImport(text)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ firstName: 'John', lastName: 'Doe' })
  })

  it('skips blank lines after header', () => {
    const text = 'First\tLast\tBirth Date\n\nAleena Lopez 3/23/2012 XYZ\n\nZoe Steil 5/5/2012 ABC'
    expect(parsePlayerImport(text)).toHaveLength(2)
  })
})

import { randomBytes } from 'crypto'

export function nanoid(size = 12): string {
  return randomBytes(Math.ceil((size * 3) / 4))
    .toString('base64url')
    .slice(0, size)
}

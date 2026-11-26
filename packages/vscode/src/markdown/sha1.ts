const K0 = 0x5a827999
const K1 = 0x6ed9eba1
const K2 = 0x8f1bbcdc
const K3 = 0xca62c1d6

const encoder = new TextEncoder()

function rotl(value: number, bits: number): number {
  return ((value << bits) | (value >>> (32 - bits))) >>> 0
}

/**
 * Pure-JS FIPS 180-4 SHA-1 returning a lowercase 40-character hex digest.
 * Avoids `node:crypto` so the extension bundle stays compatible with browser extension hosts.
 */
export function sha1Hex(input: string): string {
  const bytes = encoder.encode(input)
  const bitLen = bytes.length * 8
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64
  const padded = new Uint8Array(paddedLen)
  padded.set(bytes)
  padded[bytes.length] = 0x80

  const view = new DataView(padded.buffer)
  const bitLenHigh = Math.floor(bitLen / 0x1_0000_0000)
  const bitLenLow = bitLen >>> 0
  view.setUint32(paddedLen - 8, bitLenHigh, false)
  view.setUint32(paddedLen - 4, bitLenLow, false)

  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476
  let h4 = 0xc3d2e1f0

  const w = new Uint32Array(80)

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false)
    }
    for (let i = 16; i < 80; i++) {
      w[i] = rotl(w[i - 3]! ^ w[i - 8]! ^ w[i - 14]! ^ w[i - 16]!, 1)
    }

    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4

    for (let i = 0; i < 80; i++) {
      let f: number
      let k: number
      switch (true) {
        case i < 20:
          f = (b & c) | (~b & d)
          k = K0
          break
        case i < 40:
          f = b ^ c ^ d
          k = K1
          break
        case i < 60:
          f = (b & c) | (b & d) | (c & d)
          k = K2
          break
        default:
          f = b ^ c ^ d
          k = K3
          break
      }

      const temp = (rotl(a, 5) + f + e + k + w[i]!) >>> 0
      e = d
      d = c
      c = rotl(b, 30)
      b = a
      a = temp
    }

    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
  }

  return [h0, h1, h2, h3, h4]
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('')
}

function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null'
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => (item === undefined ? 'null' : canonicalStringify(item))).join(',')}]`
  }
  const record = value as Record<string, unknown>
  const entries = Object.keys(record)
    .sort()
    .flatMap((key) => {
      const prop = record[key]
      if (prop === undefined) {
        return []
      }
      return [`${JSON.stringify(key)}:${canonicalStringify(prop)}`]
    })
  return `{${entries.join(',')}}`
}

/**
 * Computes a deterministic short SHA-1 hex digest of a JSON-serializable value,
 * ignoring object key order differences.
 */
export function stableHash(value: unknown, length = 16): string {
  return sha1Hex(canonicalStringify(value)).slice(0, length)
}

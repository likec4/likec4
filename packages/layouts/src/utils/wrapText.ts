
export function splitToLines(input: string, width = 80) {
  const lines = [] as string[]
  for (const inputLine of input.split('\n')) {
    let line = ''
    for (const word of inputLine.split(' ')) {
      if ((line + word).length <= width) {
        line += (line ? ' ' : '') + word
      } else {
        lines.push(line)
        line = word
      }
    }
    if (line) {
      lines.push(line)
    }
  }
  return lines
}

export function wrapText(input: string, width = 80) {
  return splitToLines(input, width).join('\n')
}

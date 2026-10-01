const TITLE = /^\*\*([^*\n]+)\*\*(?:\r?\n\r?\n|$)/

export function clean(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const text = value.replace(/[*\r\n]+/g, " ").replace(/\s+/g, " ").trim()
  return text.length > 0 ? text : undefined
}

export function strip(text: string): string {
  return text.replace("[REDACTED]", "").trim()
}

export function titleOf(text: string): string | undefined {
  const match = strip(text).match(TITLE)
  return match?.[1]?.trim()
}

export function decorate(text: string, message: string): string {
  const body = strip(text)
  const match = body.match(TITLE)
  const rest = match ? body.slice(match[0].length) : body
  return `**${message}**\n\n${rest}`
}

export function normalizeMessages(raw: unknown): string[] {
  const values = Array.isArray(raw) ? raw : [raw]
  const seen = new Set<string>()
  const messages: string[] = []
  for (const value of values) {
    const text = clean(value)
    if (!text || seen.has(text)) continue
    seen.add(text)
    messages.push(text)
  }
  return messages
}

export function messagesFrom(
  options: Record<string, unknown> | undefined,
  fallback?: unknown,
): string[] {
  const raw =
    Array.isArray(options?.texts) && options.texts.length > 0
      ? options.texts
      : [options?.text ?? fallback]
  return normalizeMessages(raw)
}

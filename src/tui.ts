import type { Part } from "@opencode-ai/sdk/v2"
import type { TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { decorate, messagesFrom, titleOf } from "./decorate.js"
import { DEFAULT_MESSAGES } from "./messages.js"

type ReasoningPart = Extract<Part, { type: "reasoning" }>

const KV_KEY = "thinking_message"
const MAX_ATTEMPTS = 3

const plugin = {
  id: "thinking-message",
  tui: async (api: TuiPluginApi, options: Record<string, unknown> | undefined) => {
    if (options?.enabled === false) return
    const configured = messagesFrom(options, api.kv.get(KV_KEY))
    const messages = configured.length > 0 ? configured : DEFAULT_MESSAGES
    const keepAfterEnd = options?.keepAfterEnd === true
    const inflight = new Set<string>()
    const patched = new Set<string>()
    const restored = new Set<string>()
    const selected = new Map<string, string>()
    let rotation = 0
    let disposed = false

    void api.client
      .app.log({
        service: "thinking-message",
        level: "debug",
        message: "tui plugin active",
        extra: { count: messages.length, keepAfterEnd },
      })
      .catch(() => {})

    const messageFor = (id: string): string => {
      const existing = selected.get(id)
      if (existing !== undefined) return existing
      const message = messages[rotation++ % messages.length]!
      selected.set(id, message)
      return message
    }

    const send = async (part: ReasoningPart, text: string): Promise<boolean> => {
      try {
        const result = (await api.client.part.update({
          sessionID: part.sessionID,
          messageID: part.messageID,
          partID: part.id,
          part: { ...part, text },
        })) as { error?: unknown }
        return !result?.error
      } catch {
        return false
      }
    }

    const decoratePart = async (part: ReasoningPart): Promise<void> => {
      if (disposed || inflight.has(part.id)) return
      if (typeof part.text !== "string") return
      const message = messageFor(part.id)
      if (titleOf(part.text) === message) return
      inflight.add(part.id)
      try {
        for (let attempt = 0; attempt < MAX_ATTEMPTS && !disposed; attempt++) {
          if (await send(part, decorate(part.text, message))) {
            patched.add(part.id)
            return
          }
          await new Promise((resolve) => setTimeout(resolve, 60 * (attempt + 1)))
        }
      } finally {
        inflight.delete(part.id)
      }
    }

    const restorePart = async (part: ReasoningPart): Promise<void> => {
      if (disposed || inflight.has(part.id) || restored.has(part.id)) return
      restored.add(part.id)
      inflight.add(part.id)
      try {
        if (await send(part, part.text)) {
          patched.delete(part.id)
          restored.delete(part.id)
          selected.delete(part.id)
        } else {
          restored.delete(part.id)
        }
      } finally {
        inflight.delete(part.id)
      }
    }

    const offPart = api.event.on("message.part.updated", (event) => {
      const part = event.properties.part
      if (part.type !== "reasoning") return
      if (part.time.end === undefined || keepAfterEnd) {
        void decoratePart(part)
        return
      }
      const message = selected.get(part.id)
      if (patched.has(part.id) && message !== undefined && titleOf(part.text) !== message) {
        void restorePart(part)
      }
    })

    api.lifecycle.onDispose(() => {
      disposed = true
      offPart()
    })
  },
} satisfies TuiPluginModule

export default plugin

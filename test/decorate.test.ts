import assert from "node:assert/strict"
import { test } from "node:test"
import { clean, decorate, messagesFrom, normalizeMessages, strip, titleOf } from "../src/decorate.js"
import { DEFAULT_MESSAGES } from "../src/messages.js"

test("clean collapses whitespace and strips markdown characters", () => {
  assert.equal(clean("  **a**\n\nb  "), "a b")
  assert.equal(clean("[REDACTED]  hello"), "[REDACTED] hello")
  assert.equal(clean(""), undefined)
  assert.equal(clean("   "), undefined)
  assert.equal(clean(42), undefined)
  assert.equal(clean(undefined), undefined)
})

test("strip removes redaction markers and trims", () => {
  assert.equal(strip("  hello [REDACTED] world  "), "hello  world")
})

test("titleOf reads an existing bold title", () => {
  assert.equal(titleOf("**waiting on the ROB**\n\nbody"), "waiting on the ROB")
  assert.equal(titleOf("**waiting on the ROB**"), "waiting on the ROB")
  assert.equal(titleOf("body only"), undefined)
  assert.equal(titleOf("**\n\nbody"), undefined)
})

test("decorate replaces or prepends the title", () => {
  assert.equal(decorate("**old**\n\nbody", "new"), "**new**\n\nbody")
  assert.equal(decorate("body", "new"), "**new**\n\nbody")
  assert.equal(decorate("", "new"), "**new**\n\n")
})

test("normalizeMessages filters invalid values and dedupes", () => {
  assert.deepEqual(normalizeMessages(["a", "a", " a ", 1, "", undefined]), ["a"])
  assert.deepEqual(normalizeMessages("solo"), ["solo"])
  assert.deepEqual(normalizeMessages(undefined), [])
})

test("messagesFrom prefers texts, then text, then fallback", () => {
  assert.deepEqual(messagesFrom({ texts: ["a", "b"] }, "fallback"), ["a", "b"])
  assert.deepEqual(messagesFrom({ texts: [], text: "b" }, "fallback"), ["b"])
  assert.deepEqual(messagesFrom({ text: "b" }, "fallback"), ["b"])
  assert.deepEqual(messagesFrom(undefined, "fallback"), ["fallback"])
  assert.deepEqual(messagesFrom(undefined, undefined), [])
})

test("DEFAULT_MESSAGES is a non-empty list of unique messages", () => {
  assert.ok(DEFAULT_MESSAGES.length > 0)
  for (const message of DEFAULT_MESSAGES) {
    assert.equal(typeof message, "string")
    assert.ok(message.length > 0)
  }
  assert.equal(new Set(DEFAULT_MESSAGES).size, DEFAULT_MESSAGES.length)
})

// The Agent's Uh-Oh — make.fun entry
// Writes exactly one word an agent says when it has no idea what to do.
// Deterministic: the same bytes on every run.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const ENTRY = "Whoopsies";

const OUTPUT_PATH = process.env.OUTPUT_PATH ?? "/output/entry.txt";
const MAX_CHARS = 99;

function main(): void {
  if (/[\x00-\x1F\x7F]/.test(ENTRY)) {
    throw new Error("entry must not contain control characters");
  }
  const chars = Array.from(ENTRY);
  if (chars.length < 1 || chars.length > MAX_CHARS) {
    throw new Error(`entry is ${chars.length} characters, must be 1-${MAX_CHARS}`);
  }
  if (ENTRY.trim() !== ENTRY || ENTRY.trim().length === 0) {
    throw new Error("entry must not be empty or padded with whitespace");
  }
  if (/\s/.test(ENTRY)) {
    throw new Error("entry must be exactly one word, with no spaces");
  }
  const roundTrip = new TextDecoder("utf-8", { fatal: true }).decode(
    new TextEncoder().encode(ENTRY),
  );
  if (roundTrip !== ENTRY) {
    throw new Error("entry is not stable UTF-8 text");
  }
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, ENTRY, "utf8");
  const back = readFileSync(OUTPUT_PATH, "utf8");
  if (back !== ENTRY) {
    throw new Error("read-back mismatch: file does not equal entry");
  }
  const raw = readFileSync(OUTPUT_PATH);
  if (raw.length !== Buffer.byteLength(ENTRY, "utf8")) {
    throw new Error("byte-length mismatch: file bytes do not equal entry bytes");
  }
  const fileSha = createHash("sha256").update(raw).digest("hex");
  const entrySha = createHash("sha256").update(ENTRY, "utf8").digest("hex");
  if (fileSha !== entrySha) {
    throw new Error("sha256 mismatch: file bytes do not hash to entry");
  }
  console.log(`Wrote ${OUTPUT_PATH} (${chars.length} chars):`);
  console.log(back);
}

main();

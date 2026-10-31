// Deterministic runners. Every tool below does real work locally in the Worker:
// no model key, no network, no rate limit.

type Values = Record<string, string>;

const DISCLAIMER = "Educational research aid only. Not financial advice. Verify every claim against primary sources.";

function str(v: Values, key: string, fallback = ""): string {
  const x = (v?.[key] ?? "").toString();
  return x.trim() ? x : fallback;
}

// ── Prompt Forge ────────────────────────────────────────────────────────────
function promptforge(v: Values): string {
  const raw = str(v, "raw", "describe what you want the agent to do");
  const idea = raw.replace(/\s+/g, " ").replace(/[.]+$/, "");
  const lower = raw.toLowerCase();
  const role = /(code|review|bug|deploy|api|typescript|python|sql|database)/.test(lower)
    ? "a senior software engineer with a review-first mindset"
    : /(research|analyz|synthes|report|investigat)/.test(lower)
      ? "a research analyst who separates evidence from inference"
      : /(write|copy|edit|content|blog|email|post)/.test(lower)
        ? "an editor with a sharp eye for structure and useless words"
        : /(design|ux|ui|onboard|landing)/.test(lower)
          ? "a product designer who argues from user evidence"
          : "an expert operator who has shipped this exact kind of work before";

  const ambiguities = [
    "Who is the audience, and what do they already know?",
    "What does success look like in concrete, checkable terms?",
    "What must the answer never do (refusals, banned claims, scope limits)?",
  ];

  return `You are ${role}.

## Objective
${idea.charAt(0).toUpperCase() + idea.slice(1)}.

## Context
- Audience: <say who reads the output and their level>
- Input you will receive: <paste format or example>
- Success looks like: <one concrete outcome the reader can act on>

## Constraints
- Ground every claim in the provided material. If something is missing, say "unknown" instead of inventing it.
- Do not pad. Prefer specifics, numbers and named examples over adjectives.
- If the request is ambiguous, ask at most two clarifying questions first.

## Output contract
1. One-line summary of the result.
2. The main body in short sections with descriptive headings.
3. A "What I assumed" section listing every assumption you made.
4. A "What would change this answer" section with the two most decision-relevant unknowns.

## Self-check before responding
- Did I answer the actual objective rather than a nearby one?
- Can every factual claim be traced to the input or flagged as assumption?
- Is there anything here that a reader would have to re-read twice?

## Resolve before your first draft
${ambiguities.map((a) => `- ${a}`).join("\n")}`;
}

// ── Degen Due Diligence ─────────────────────────────────────────────────────
function duechecklist(v: Values): string {
  const subject = str(v, "subject", "the target project");
  const notes = str(v, "notes", "");
  const known = notes ? "**Your notes:** " + notes : "**Your notes:** none provided — the checklist below contains the questions you need to answer.";

  return `# Due Diligence — ${subject}

> ${DISCLAIMER}

${known}

## 1. Contract & authority
- [ ] Mint and freeze authority: revoked or held? Who holds them?
- [ ] Upgrade authority: renounced, multisig, or single wallet?
- [ ] Any transfer fees, hooks or tax logic in the token program? Read it, don't trust a screenshot.
- [ ] Audit links — verify the auditor exists and the report matches this program ID.

**Why it matters:** authority and hidden transfer logic are the two ways a token can change behavior after you buy.

## 2. Liquidity
- [ ] Where is liquidity, and how deep is it relative to your position size?
- [ ] Is the pool locked? For how long, and by which locker contract?
- [ ] What happens to price if 10% of supply is sold? Estimate the slippage.
- [ ] Any recent LP removals that predate the community narrative?

## 3. Holder distribution
- [ ] Top 10 wallets excluding known pools/treasuries — what percentage?
- [ ] Are top wallets funded from the same source?
- [ ] Insider allocations, vesting cliffs, or unseen vesting wallets.
- [ ] How many holders, and is growth organic or campaign-driven?

## 4. Social authenticity
- [ ] Account age, posting history, and whether engagement matches follower count.
- [ ] Do team members have a verifiable history outside this project?
- [ ] Is the narrative original or a renamed version of a 2024 playbook?
- [ ] Any paid-promotion disclosures? Which accounts are clearly compensated?

## 5. Tokenomics
- [ ] FDV versus circulating supply: what is the real dilution?
- [ ] Emissions schedule over the next 90 days.
- [ ] Who earns fees, and are those fees sustainable without new buyers?

## 6. Red flags that end the review
- Anonymous team + unlocked upgrade authority + thin liquidity.
- Guaranteed-return language, referral pyramids, or urgency pressure.
- A "partnership" that cannot be confirmed from the partner's own channels.

## Verdict template
- **What I verified:** …
- **What I could not verify:** …
- **Biggest single risk:** …
- **Smallest position that makes this worth watching:** …
- **Decision:** skip / watch / small test position / pass

## Questions to ask before any position
1. What would have to be true for this to work?
2. What is the earliest observable signal that it is *not* working?
3. Who is on the other side of my trade, and why are they selling?`;
}

// ── JSON → Schema ───────────────────────────────────────────────────────────
function inferSchema(value: any): any {
  if (value === null) return { type: "null" };
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: "array", items: {} };
    const schemas = value.map(inferSchema);
    const merged = schemas.reduce((acc, s) => mergeSchemas(acc, s));
    return { type: "array", items: merged };
  }
  switch (typeof value) {
    case "string": {
      const s: any = { type: "string" };
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) s.format = "date";
      else if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) s.format = "email";
      else if (/^https?:\/\//.test(value)) s.format = "uri";
      else if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(value)) s.format = "date-time";
      return s;
    }
    case "number":
      return Number.isInteger(value) ? { type: "integer" } : { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "object": {
      const properties: Record<string, any> = {};
      const required: string[] = [];
      for (const [k, val] of Object.entries(value)) {
        properties[k] = inferSchema(val);
        required.push(k);
      }
      const schema: any = { type: "object", properties };
      if (required.length) schema.required = required;
      return schema;
    }
    default:
      return {};
  }
}

function mergeSchemas(a: any, b: any): any {
  if (!a) return b;
  if (!b) return a;
  if (a.type !== b.type) return { anyOf: [a, b] };
  if (a.type === "object" && b.type === "object") {
    const properties: Record<string, any> = { ...a.properties };
    for (const [k, v] of Object.entries(b.properties || {})) {
      properties[k] = properties[k] ? mergeSchemas(properties[k], v) : v;
    }
    const required = (a.required || []).filter((k: string) => (b.required || []).includes(k));
    const schema: any = { type: "object", properties };
    if (required.length) schema.required = required;
    return schema;
  }
  if (a.type === "array" && b.type === "array") {
    return { type: "array", items: mergeSchemas(a.items || {}, b.items || {}) };
  }
  const out = { ...a };
  if (b.format && !out.format) out.format = b.format;
  return out;
}

function json2schema(v: Values): string {
  const raw = str(v, "json");
  if (!raw) throw new Error("Paste a JSON sample first.");
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (e: any) {
    throw new Error("That is not valid JSON: " + e.message);
  }
  const root = inferSchema(parsed);
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "GeneratedSchema",
    ...root,
  };
  return `// Inferred from ${Array.isArray(parsed) ? "an array sample" : "an object sample"}\n${JSON.stringify(schema, null, 2)}`;
}

// ── Prompt Cost Oracle ──────────────────────────────────────────────────────
function costcalc(v: Values): string {
  const prompt = str(v, "prompt");
  if (!prompt) throw new Error("Paste a prompt to estimate.");
  const calls = Math.max(1, Math.min(2_000_000, parseInt(str(v, "calls", "1000"), 10) || 1000));
  const inputTokens = Math.ceil(prompt.length / 4);
  const outputTokens = 350; // conservative default completion

  const models = [
    { name: "gpt-4o-mini", inPrice: 0.15, outPrice: 0.6 },
    { name: "gpt-4.1-mini", inPrice: 0.4, outPrice: 1.6 },
    { name: "gpt-4o", inPrice: 2.5, outPrice: 10 },
    { name: "claude-sonnet", inPrice: 3, outPrice: 15 },
  ];

  const rows = models.map((m) => {
    const perCall = (inputTokens * m.inPrice + outputTokens * m.outPrice) / 1_000_000;
    const monthly = perCall * calls;
    return `| ${m.name.padEnd(14)} | $${perCall.toFixed(6)} | $${monthly.toFixed(2)} |`;
  });

  const cheapest = models[0];
  return `# Cost estimate

- Prompt size: **${prompt.length} characters ≈ ${inputTokens} input tokens** (characters ÷ 4, rounded up)
- Assumed response: **~${outputTokens} output tokens** per call
- Monthly volume: **${calls.toLocaleString()} calls**

| Model          | Cost / call | Cost / month |
| -------------- | ----------- | ------------ |
${rows.join("\n")}

## Read this before budgeting
- The estimate is a planning aid, not an invoice. Tokenizers differ between providers and models.
- Output is usually the bigger cost driver — a longer response changes the table more than a longer prompt.
- The cheapest model is not automatically the right one: run a 20-case quality check first.
- Prices move. Confirm on the provider's pricing page before you commit.

**Cheapest in this snapshot:** ${cheapest.name} at about $${(((inputTokens * cheapest.inPrice + outputTokens * cheapest.outPrice) / 1_000_000) * calls).toFixed(2)}/month at this volume.`;
}

// ── Template Foundry ────────────────────────────────────────────────────────
function template(v: Values): string {
  const tpl = str(v, "template");
  if (!tpl) throw new Error("Paste a template with {{slots}}.");
  const varLines = str(v, "vars").split(/\r?\n/);
  const vars: Record<string, string> = {};
  const duplicates: string[] = [];
  for (const line of varLines) {
    const i = line.indexOf("=");
    if (i < 1) continue;
    const key = line.slice(0, i).trim();
    const val = line.slice(i + 1).trim();
    if (key in vars) duplicates.push(key);
    vars[key] = val;
  }
  const used = new Set<string>();
  const missing = new Set<string>();
  const result = tpl.replace(/\{\{\s*([\w.-]+)\s*\}\}|\{\s*([\w.-]+)\s*\}/g, (_m, a, b) => {
    const key = a || b;
    used.add(key);
    if (key in vars) return vars[key];
    missing.add(key);
    return `{{${key}}}`;
  });
  const unused = Object.keys(vars).filter((k) => !used.has(k));

  const report = [
    "## Filled template",
    "",
    result,
    "",
    "## Report",
    `- Filled: ${[...used].filter((k) => k in vars).length}`,
    `- Missing: ${missing.size ? [...missing].join(", ") : "none"}`,
    `- Unused variables: ${unused.length ? unused.join(", ") : "none"}`,
    `- Duplicate keys: ${duplicates.length ? [...new Set(duplicates)].join(", ") : "none"}`,
  ].join("\n");

  return report;
}

// ── Markdown Grid ───────────────────────────────────────────────────────────
function parseDelimited(text: string, delim: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else cell += ch;
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delim) {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  row.push(cell.trim());
  if (row.some((c) => c.length)) rows.push(row);
  return rows.filter((r) => r.some((c) => c.length));
}

function mdtable(v: Values): string {
  const raw = str(v, "csv");
  if (!raw) throw new Error("Paste CSV or tab-separated rows.");
  const firstLine = raw.split(/\r?\n/)[0] || "";
  const delim = firstLine.includes("\t") ? "\t" : ",";
  const rows = parseDelimited(raw, delim);
  if (!rows.length) throw new Error("No rows found in that paste.");

  const width = Math.max(...rows.map((r) => r.length));
  const padded = rows.map((r) => {
    const copy = r.slice();
    while (copy.length < width) copy.push("");
    return copy.map((c) => c.replace(/\|/g, "\\|").replace(/\r?\n/g, " "));
  });
  const header = padded[0];
  const body = padded.slice(1);
  const widths = header.map((_, i) => Math.max(3, ...padded.map((r) => r[i].length)));
  const line = (cells: string[]) => `| ${cells.map((c, i) => c.padEnd(widths[i])).join(" | ")} |`;
  const sep = `| ${widths.map((w) => "-".repeat(w)).join(" | ")} |`;

  return `${line(header)}\n${sep}\n${body.length ? body.map(line).join("\n") : ""}

<!-- ${body.length} rows × ${width} columns, delimiter: ${delim === "\t" ? "tab" : "comma"} -->`;
}

// ── Regex Lab ───────────────────────────────────────────────────────────────
function regexlab(v: Values): string {
  const pattern = str(v, "pattern");
  const text = str(v, "text");
  if (!pattern) throw new Error("Enter a regex pattern.");
  let re: RegExp;
  try {
    re = new RegExp(pattern, "gd");
  } catch (e: any) {
    throw new Error("Invalid pattern: " + e.message);
  }
  const lines = text.split(/\r?\n/);
  let total = 0;
  const out: string[] = [];
  for (const line of lines) {
    re.lastIndex = 0;
    const parts: string[] = [];
    const groups: string[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    let empty = false;
    let guard = 0;
    while ((m = re.exec(line)) !== null) {
      if (++guard > 500) break;
      total++;
      if (m[0].length === 0) empty = true;
      parts.push(line.slice(last, m.index), "«" + m[0] + "»");
      last = m.index + m[0].length;
      if (m.length > 1) groups.push(`[${m.index}] groups: ${m.slice(1).map((g) => JSON.stringify(g)).join(", ")}`);
      if (m[0].length === 0) re.lastIndex++;
    }
    parts.push(line.slice(last));
    out.push(m ? "✓ " + parts.join("") : "· " + line);
    for (const g of groups) out.push("    " + g);
    if (empty) out.push("    ⚠ pattern can match an empty string — use + or make the group optional");
  }
  const warnings: string[] = [];
  if (/\([^)]*[+*]\)[+*]/.test(pattern)) warnings.push("⚠ Possible catastrophic backtracking: nested quantifiers.");
  if (!pattern.startsWith("^") && !pattern.endsWith("$") && !pattern.includes("\\b")) warnings.push("ℹ Unanchored pattern: it will match anywhere in the string.");
  return `# Regex Lab

Pattern: \`/${pattern}/g\`
Matches: **${total}**

${out.join("\n")}
${warnings.length ? "\n## Notes\n" + warnings.join("\n") : ""}`;
}

// ── Text X-Ray ──────────────────────────────────────────────────────────────
function textstats(v: Values): string {
  const text = str(v, "text");
  if (!text) throw new Error("Paste some text to analyze.");
  const words = text.match(/[A-Za-z0-9'’-]+/g) || [];
  const sentences = text.split(/[.!?]+(?:\s|$)/).map((s) => s.trim()).filter(Boolean);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
  const syllables = words.reduce((n, w) => n + Math.max(1, (w.toLowerCase().match(/[aeiouy]+/g) || []).length), 0);
  const wps = words.length / Math.max(1, sentences.length);
  const spw = syllables / Math.max(1, words.length);
  const flesch = Math.max(0, Math.min(100, 206.835 - 1.015 * wps - 84.6 * spw));
  const ease = flesch >= 70 ? "easy" : flesch >= 50 ? "moderate" : "difficult";
  const readingTime = Math.max(1, Math.round(words.length / 200));

  const stop = new Set("the a an and or but if then that this these those of to in on for with as at by from is are was were be been being it its you your we our they their he she i not no do does did so can could should would will just about into over after before more most other than too very".split(" "));
  const freq = new Map<string, number>();
  for (const w of words) {
    const k = w.toLowerCase();
    if (k.length < 4 || stop.has(k)) continue;
    freq.set(k, (freq.get(k) || 0) + 1);
  }
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const longSentences = sentences.filter((s) => (s.match(/[A-Za-z0-9'’-]+/g) || []).length > 30);

  return `# Text X-Ray

| Metric | Value |
| --- | --- |
| Words | ${words.length} |
| Characters | ${text.length} |
| Sentences | ${sentences.length} |
| Paragraphs | ${paragraphs.length} |
| Avg. words / sentence | ${wps.toFixed(1)} |
| Reading time | ~${readingTime} min (200 wpm) |
| Reading ease | ${flesch.toFixed(0)}/100 — ${ease} |

## Most repeated meaningful words
${top.length ? top.map(([w, n]) => `- **${w}** ×${n}`).join("\n") : "- Not enough repeated words to report."}

## Sentences over 30 words
${longSentences.length ? longSentences.map((s, i) => `${i + 1}. ${s}`).join("\n") : "- None. Every sentence is under 30 words."}

Long sentences are the most common readability tax. Split them at the first natural clause boundary, not at an arbitrary word count.`;
}

// ── Hook Lab ────────────────────────────────────────────────────────────────
function hooks(v: Values): string {
  const rawTopic = str(v, "topic", "shipping an AI product").replace(/\s+/g, " ").replace(/[.!?]+$/, "");
  const topic = rawTopic.charAt(0).toLowerCase() + rawTopic.slice(1);
  const audience = str(v, "audience", "builders");
  const tone = str(v, "tone", "direct");
  const subject = topic.replace(/^(why|how|what|when|the)\s+/i, "");

  const patterns: Array<{ name: string; note: string; line: string }> = [
    { name: "Contrarian", note: "Name the consensus, then refuse it.", line: `Everyone says ${topic} is a solved problem. They are measuring the wrong thing.` },
    { name: "Cost of inaction", note: "Put a price on waiting.", line: `Every week ${topic} stays on your backlog, you pay for it twice.` },
    { name: "Specific number", note: "A number buys credibility your adjectives cannot.", line: `Three things decide whether ${topic} works. None of them are the model.` },
    { name: "Confession", note: "Admit the mistake before giving the lesson.", line: `I shipped ${topic} to production and broke it twice. Here is what I would do differently.` },
    { name: "Before / after", note: "Show the change in one breath.", line: `Six months ago ${topic} took our team a full day. Now it takes an afternoon.` },
    { name: "Myth → mechanism", note: "Kill the myth with the actual mechanism.", line: `The advice about ${topic} is not wrong. It is just answering a question you do not have.` },
    { name: "Direct question", note: "Ask the question the audience is avoiding.", line: `If ${topic} is so obvious, why is nobody measuring whether it works?` },
    { name: "Named enemy", note: "One opponent, not a vague trend.", line: `Your ${topic} problem is not the tool. It is the demo everyone fell in love with.` },
    { name: "Time box", note: "Make the result feel reachable.", line: `Give ${topic} one focused afternoon and you will know if it deserves a second.` },
    { name: "Analogy", note: "Borrow a mechanism the audience already trusts.", line: `Treat ${topic} like hiring: the interview is not the job.` },
    { name: "Audience callout", note: "Say who this is for, and who it is not.", line: `If you are ${audience}, ${topic} is not a tooling problem. It is a definition problem.` },
    { name: "Teardown", note: "Open the thing up in public.", line: `Here is the exact ${topic} setup we run, including the part that still needs a human.` },
  ];

  const score = (line: string) => {
    let n = 55;
    if (/\d/.test(line)) n += 9;
    if (/\b(never|not|nobody|nothing|instead|before|after|stop|only|still)\b/i.test(line)) n += 6;
    const len = line.length;
    if (len >= 60 && len <= 150) n += 7;
    if (/\byou\b|\byour\b/i.test(line)) n += 5;
    if (/[:—]|\?/.test(line)) n += 4;
    if (/\b(three|six|one)\b/i.test(line)) n += 3;
    return Math.min(94, n);
  };

  const scored = patterns
    .map((p) => ({ ...p, score: score(p.line) }))
    .sort((a, b) => b.score - a.score);

  const board = scored
    .map((p, i) => `${String(i + 1).padStart(2, "0")}  ${p.score}  ${p.name.toUpperCase()}\n    “${p.line}”`)
    .join("\n\n");

  const weak = scored.filter((p) => p.score < 68);
  const top = scored.slice(0, 3).map((p) => p.name.toLowerCase()).join(", ");

  return `# Hook Lab — 12 openings\n\nTOPIC     ${rawTopic}\nAUDIENCE  ${audience}\nTONE      ${tone}\n\n## The board\n\n${board}\n\n## Read the scores honestly\n\nScores are heuristic: specificity (numbers, named things), tension (contrast words), length and second person. They rank the lines, they do not prove one will convert.\n\n- Strongest patterns here: ${top}.\n- ${weak.length ? `Needs a rewrite before you use it: ${weak.map((w) => w.name).join(", ")}.` : "No weak lines on this topic — pick one and test it."}\n- Test two, not twelve. A hook is a hypothesis, not a personality.\n\n## Where to use what\n\n- Short-form video: contrarian, confession, specific number.\n- Newsletter subject lines: cost of inaction, direct question.\n- Landing page headline: before / after, teardown.\n- Cold email opener: named enemy, time box.\n\nOne rule: never ship a hook the body cannot pay off.`;
}

export function runDeterministic(runtime: string, values: Values): string {
  switch (runtime) {
    case "det:promptforge": return promptforge(values);
    case "det:duechecklist": return duechecklist(values);
    case "det:json2schema": return json2schema(values);
    case "det:costcalc": return costcalc(values);
    case "det:template": return template(values);
    case "det:mdtable": return mdtable(values);
    case "det:regexlab": return regexlab(values);
    case "det:textstats": return textstats(values);
    case "det:hooks": return hooks(values);
    default: throw new Error("Unknown runtime: " + runtime);
  }
}

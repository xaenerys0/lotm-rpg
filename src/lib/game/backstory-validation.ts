export interface BackstoryViolation {
  claim: string;
  reason: string;
}

export interface BackstoryValidationResult {
  valid: boolean;
  violations: BackstoryViolation[];
}

/**
 * In LOTM, certain titles imply the holder has reached a specific sequence
 * or higher (lower number = more powerful). Matching at word boundaries so
 * "angelic" and "saintly" are not caught.
 *
 * requiredSeq: the maximum sequence number (most powerful) one must be to
 * legitimately hold that title. A startSequence > requiredSeq is a violation.
 */
const TIER_CLAIMS: ReadonlyArray<{
  pattern: RegExp;
  requiredSeq: number;
  label: string;
}> = [
  {
    pattern: /\babove\s+the\s+sequence\b/gi,
    requiredSeq: -1,
    label: "Above the Sequence",
  },
  { pattern: /\btrue\s+gods?\b/gi, requiredSeq: 0, label: "True God" },
  { pattern: /\bking\s+of\s+angels?\b/gi, requiredSeq: 1, label: "King of Angels" },
  { pattern: /\bdemigods?\b/gi, requiredSeq: 2, label: "Demigod" },
  // Negative lookbehind prevents "angels" in "king of angels" from double-matching.
  { pattern: /(?<!of\s)\bangels?\b/gi, requiredSeq: 2, label: "Angel" },
  { pattern: /\bsaints?\b/gi, requiredSeq: 4, label: "Saint" },
];

/**
 * Scans a player's backstory for claims that exceed their chosen starting
 * sequence — either explicit "Sequence N" / "Seq N" numbers, or tier/role
 * titles that imply a power level they have not reached.
 *
 * Lower sequence numbers are MORE powerful in LOTM; claiming "Angel" while
 * starting at Sequence 8 is a violation, as Angels are Sequence 2 or lower.
 *
 * Pure — no IO, no side effects. Same shape as the rules engine validators.
 */
export function validateBackstorySequence(
  background: string,
  startSequence: number,
): BackstoryValidationResult {
  const violations: BackstoryViolation[] = [];

  // Explicit numeric claims: "Sequence 6", "Seq-6", "Seq 6"
  const numericRe = /(Sequence|Seq)[\s\-]?(\d+)/gi;
  let match: RegExpExecArray | null;
  while ((match = numericRe.exec(background)) !== null) {
    const claimed = parseInt(match[2], 10);
    if (claimed < startSequence) {
      violations.push({
        claim: match[0],
        reason: `Your backstory claims "${match[0]}" — your starting sequence is ${startSequence}. Lower sequence numbers are more powerful; this claim is above your starting power level. Remove it or raise your starting sequence.`,
      });
    }
  }

  // Tier/role title claims: Saint, Angel, Demigod, True God, etc.
  // Patterns are pre-compiled with `gi`; reset lastIndex before each scan so
  // the module-level RegExp objects are safe to reuse across calls.
  for (const { pattern, requiredSeq, label } of TIER_CLAIMS) {
    pattern.lastIndex = 0;
    while ((match = pattern.exec(background)) !== null) {
      if (startSequence > requiredSeq) {
        violations.push({
          claim: match[0],
          reason: `Your backstory claims "${match[0]}" — ${label} requires Sequence ${requiredSeq} or lower, but your starting sequence is ${startSequence}. Remove this claim or raise your starting sequence to match.`,
        });
      }
    }
  }

  return { valid: violations.length === 0, violations };
}

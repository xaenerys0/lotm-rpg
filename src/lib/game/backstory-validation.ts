export interface BackstoryViolation {
  claim: string;
  reason: string;
}

export interface BackstoryValidationResult {
  valid: boolean;
  violations: BackstoryViolation[];
}

/**
 * Scans a player's backstory for explicit sequence claims that exceed their
 * chosen starting sequence. Lower sequence numbers are MORE powerful in LOTM;
 * a claim of "Sequence 6" by a player who starts at Sequence 8 is invalid.
 *
 * Pure — no IO, no side effects. Same shape as the rules engine validators.
 */
export function validateBackstorySequence(
  background: string,
  startSequence: number,
): BackstoryValidationResult {
  const violations: BackstoryViolation[] = [];
  const re = /(Sequence|Seq)[\s\-]?(\d+)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(background)) !== null) {
    const claimed = parseInt(match[2], 10);
    if (claimed < startSequence) {
      violations.push({
        claim: match[0],
        reason: `Your backstory claims "${match[0]}" — your starting sequence is ${startSequence}. Lower sequence numbers are more powerful; this claim is above your starting power level. Remove it or raise your starting sequence.`,
      });
    }
  }
  return { valid: violations.length === 0, violations };
}

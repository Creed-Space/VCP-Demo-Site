/**
 * VCP Intent Inference — Client-side heuristic intent classification
 * Ports services/vcp/intent_inference.py to TypeScript for the demo.
 */

import type {
  IntentCategory,
  IntentInterpretation,
  InterpretiveFrame,
  PersonalState,
  VCPContext,
} from "./types";

export function inferIntent(
  context: Partial<VCPContext>,
  personalState?: PersonalState,
): InterpretiveFrame {
  const candidates: IntentInterpretation[] = [];
  const personal = personalState ?? context.personal_state;
  const catSignals = extractCategoricalSignals(context);

  // Rule 1: Crisis support — perceived_urgency critical at high intensity
  if (personal?.perceived_urgency?.value === "critical") {
    const intensity = personal.perceived_urgency.intensity ?? 3;
    if (intensity >= 4) {
      candidates.push({
        category: "crisis_support",
        confidence: 0.9,
        reasoning:
          "Critical urgency signal detected — prioritizing crisis support",
        contributing_dimensions: ["perceived_urgency"],
      });
    }
  }

  // Rule 2: Health check — body_signals: pain/unwell
  if (personal?.body_signals) {
    const val = personal.body_signals.value;
    const intensity = personal.body_signals.intensity ?? 3;
    if ((val === "pain" || val === "unwell") && intensity >= 3) {
      candidates.push({
        category: "health_check",
        confidence: 0.75,
        reasoning: "Pain or unwellness signals suggest health-related intent",
        contributing_dimensions: ["body_signals"],
      });
    }
  }

  // Rule 3: Emotional processing — frustrated/tense at high intensity
  if (personal?.emotional_tone) {
    const val = personal.emotional_tone.value;
    const intensity = personal.emotional_tone.intensity ?? 3;
    if ((val === "frustrated" || val === "tense") && intensity >= 4) {
      candidates.push({
        category: "emotional_processing",
        confidence: 0.7,
        reasoning:
          "High emotional intensity suggests processing or support needed",
        contributing_dimensions: ["emotional_tone"],
      });
    }
  }

  // Rule 4: Urgent task — pressured urgency + workplace
  if (personal?.perceived_urgency?.value === "pressured") {
    const conf = catSignals.has("workplace") ? 0.75 : 0.6;
    const dims = ["perceived_urgency"];
    if (catSignals.has("workplace")) dims.push("location");
    candidates.push({
      category: "urgent_task",
      confidence: conf,
      reasoning:
        "Time pressure detected — likely needs efficient task completion",
      contributing_dimensions: dims,
    });
  }

  // Rule 5: Professional inquiry — workplace context
  if (catSignals.has("workplace") || catSignals.has("colleagues")) {
    let conf = 0.7;
    const dims = ["location", "activity"];
    if (personal?.cognitive_state?.value === "focused") {
      conf = 0.85;
      dims.push("cognitive_state");
    }
    candidates.push({
      category: "professional_inquiry",
      confidence: conf,
      reasoning: "Workplace context suggests professional interaction",
      contributing_dimensions: dims,
    });
  }

  // Rule 6: Personal exploration — home + evening + calm/reflective
  if (catSignals.has("home") || catSignals.has("evening")) {
    let conf = 0.55;
    const dims = ["location", "time"];
    if (personal?.emotional_tone?.value === "calm") {
      conf = 0.7;
      dims.push("emotional_tone");
    }
    if (personal?.cognitive_state?.value === "reflective") {
      conf = 0.75;
      dims.push("cognitive_state");
    }
    candidates.push({
      category: "personal_exploration",
      confidence: conf,
      reasoning: "Relaxed personal context suggests exploratory interaction",
      contributing_dimensions: dims,
    });
  }

  // Rule 7: Creative work — uplifted mood
  if (personal?.emotional_tone?.value === "uplifted") {
    candidates.push({
      category: "creative_work",
      confidence: 0.55,
      reasoning: "Positive emotional state may indicate creative intent",
      contributing_dimensions: ["emotional_tone"],
    });
  }

  // Rule 8: Learning — focused with no strong signals
  if (personal?.cognitive_state?.value === "focused") {
    if (!candidates.some((c) => c.confidence >= 0.7)) {
      candidates.push({
        category: "learning",
        confidence: 0.5,
        reasoning:
          "Focused cognitive state with no stronger signals suggests learning",
        contributing_dimensions: ["cognitive_state"],
      });
    }
  }

  // Rule 9: Casual conversation — low urgency, no workplace
  if (
    !personal?.perceived_urgency ||
    personal.perceived_urgency.value === "unhurried"
  ) {
    if (
      !catSignals.has("workplace") &&
      !candidates.some((c) => c.confidence >= 0.6)
    ) {
      candidates.push({
        category: "casual_conversation",
        confidence: 0.4,
        reasoning:
          "No strong contextual signals — defaulting to casual interaction",
        contributing_dimensions: [],
      });
    }
  }

  // Rule 10: Fallback
  if (candidates.length === 0) {
    candidates.push({
      category: "routine_check",
      confidence: 0.3,
      reasoning: "Insufficient context for specific intent classification",
      contributing_dimensions: [],
    });
  }

  // Sort and deduplicate
  candidates.sort((a, b) => b.confidence - a.confidence);
  const seen = new Set<IntentCategory>();
  const unique: IntentInterpretation[] = [];
  for (const c of candidates) {
    if (!seen.has(c.category)) {
      seen.add(c.category);
      unique.push(c);
    }
  }

  return {
    primary: unique[0],
    alternatives: unique.slice(1, 4),
  };
}

function extractCategoricalSignals(context: Partial<VCPContext>): Set<string> {
  const signals = new Set<string>();

  // Extract from public_profile hints
  if (context.public_profile?.role) {
    signals.add("workplace");
    signals.add("colleagues");
  }

  // Common context patterns
  if (context.availability?.best_times) {
    for (const t of context.availability.best_times) {
      const lower = t.toLowerCase();
      if (lower.includes("evening")) signals.add("evening");
      if (lower.includes("morning")) signals.add("morning");
    }
  }

  return signals;
}

/** Human-readable labels for intent categories */
export const INTENT_LABELS: Record<IntentCategory, string> = {
  professional_inquiry: "Professional Inquiry",
  urgent_task: "Urgent Task",
  personal_exploration: "Personal Exploration",
  emotional_processing: "Emotional Processing",
  health_check: "Health Check",
  casual_conversation: "Casual Conversation",
  crisis_support: "Crisis Support",
  creative_work: "Creative Work",
  learning: "Learning",
  routine_check: "Routine Check",
};

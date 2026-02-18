/**
 * Shared personal state dimension definitions for VCP playground tabs.
 * Uses Font Awesome icons (not emoji) per project rules.
 */
import type {
  CognitiveState,
  EmotionalTone,
  EnergyLevel,
  PerceivedUrgency,
  BodySignals,
  PersonalState,
} from "./types";

export interface PersonalStateDim {
  key: keyof PersonalState;
  icon: string;
  label: string;
  options: readonly string[];
}

export const personalStateDims: PersonalStateDim[] = [
  {
    key: "cognitive_state",
    icon: "fa-brain",
    label: "Cognitive State",
    options: [
      "focused",
      "distracted",
      "overloaded",
      "foggy",
      "reflective",
    ] satisfies CognitiveState[],
  },
  {
    key: "emotional_tone",
    icon: "fa-heart-pulse",
    label: "Emotional Tone",
    options: [
      "calm",
      "tense",
      "frustrated",
      "neutral",
      "uplifted",
    ] satisfies EmotionalTone[],
  },
  {
    key: "energy_level",
    icon: "fa-battery-half",
    label: "Energy Level",
    options: [
      "rested",
      "low_energy",
      "fatigued",
      "wired",
      "depleted",
    ] satisfies EnergyLevel[],
  },
  {
    key: "perceived_urgency",
    icon: "fa-bolt",
    label: "Perceived Urgency",
    options: [
      "unhurried",
      "time_aware",
      "pressured",
      "critical",
    ] satisfies PerceivedUrgency[],
  },
  {
    key: "body_signals",
    icon: "fa-stethoscope",
    label: "Body Signals",
    options: [
      "neutral",
      "discomfort",
      "pain",
      "unwell",
      "recovering",
    ] satisfies BodySignals[],
  },
];

export function getIntensityLabel(intensity: number): string {
  if (intensity >= 5) return "Extreme";
  if (intensity >= 4) return "High";
  if (intensity >= 3) return "Moderate";
  if (intensity >= 2) return "Low";
  return "Minimal";
}

export function getIntensityColor(intensity: number): string {
  if (intensity >= 4) return "var(--color-danger)";
  if (intensity >= 3) return "var(--color-warning)";
  return "var(--color-success)";
}

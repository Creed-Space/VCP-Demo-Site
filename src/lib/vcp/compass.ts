/** Compass types mirroring backend services/compass/models.py */

export type Metaethics = 'consequentialist' | 'deontological' | 'virtue_ethics' | 'anti_realist';
export type Epistemology = 'empiricist' | 'rationalist' | 'pragmatist' | 'skeptic';
export type OptimizeFor = 'stability' | 'growth' | 'freedom' | 'connection';
export type RiskTolerance = 'conservative' | 'calculated' | 'aggressive';
export type CommunicationStyle = 'gentle' | 'balanced' | 'direct';
export type ExplanationLevel = 'minimal' | 'brief' | 'detailed';

export interface CompassProfile {
	metaethics: Metaethics | null;
	epistemology: Epistemology | null;
	optimize_for: OptimizeFor | null;
	risk_tolerance: RiskTolerance | null;
	communication_style: CommunicationStyle | null;
	explanations: ExplanationLevel | null;
}

export interface ConstitutionInfo {
	id: string;
	path: string;
	title: string;
	description: string;
}

export const CONSTITUTION_MAP: Record<string, ConstitutionInfo> = {
	// Metaethics
	consequentialist: { id: 'consequentialist', path: 'modules/metaethics/consequentialist.md', title: 'Consequentialism', description: 'Outcome-focused ethics, weigh costs and benefits' },
	deontological: { id: 'deontological', path: 'modules/metaethics/deontological.md', title: 'Deontological Ethics', description: 'Rule-based ethics, principled constraints' },
	virtue_ethics: { id: 'virtue_ethics', path: 'modules/metaethics/virtue_ethics.md', title: 'Virtue Ethics', description: 'Character-driven reasoning, cultivate good traits' },
	anti_realist: { id: 'anti_realist', path: 'modules/metaethics/anti_realist.md', title: 'Moral Anti-Realism', description: 'Context-dependent ethics, minimal intervention on debatable questions' },
	// Epistemology
	empiricist: { id: 'empiricist', path: 'modules/epistemology/empiricist.md', title: 'Empiricist', description: 'Evidence-based reasoning, require observable data' },
	rationalist: { id: 'rationalist', path: 'modules/epistemology/rationalist.md', title: 'Rationalist', description: 'Logical coherence, first-principles reasoning' },
	pragmatist: { id: 'pragmatist', path: 'modules/epistemology/pragmatist.md', title: 'Pragmatist', description: 'Practical truth, evaluate by consequences' },
	skeptic: { id: 'skeptic', path: 'modules/epistemology/skeptic.md', title: 'Skeptic', description: 'High confidence thresholds, question assumptions' },
	// Values
	stability: { id: 'stability', path: 'modules/values/stability_first.md', title: 'Stability First', description: 'Proven approaches, predictability, conservative defaults' },
	growth: { id: 'growth', path: 'modules/values/growth_first.md', title: 'Growth First', description: 'Challenges as opportunities, calculated risk-taking' },
	freedom: { id: 'freedom', path: 'modules/values/freedom_first.md', title: 'Freedom First', description: 'Maximize agency, minimize paternalism' },
	connection: { id: 'connection', path: 'modules/values/connection_first.md', title: 'Connection First', description: 'Relational impact, collaborative solutions' },
};

export function deriveConstitutions(profile: CompassProfile): ConstitutionInfo[] {
	const results: ConstitutionInfo[] = [];
	if (profile.metaethics && CONSTITUTION_MAP[profile.metaethics]) {
		results.push(CONSTITUTION_MAP[profile.metaethics]);
	}
	if (profile.epistemology && CONSTITUTION_MAP[profile.epistemology]) {
		results.push(CONSTITUTION_MAP[profile.epistemology]);
	}
	if (profile.optimize_for && CONSTITUTION_MAP[profile.optimize_for]) {
		results.push(CONSTITUTION_MAP[profile.optimize_for]);
	}
	return results;
}

export function deriveGenerationPrefs(profile: CompassProfile): Record<string, number> {
	const prefs: Record<string, number> = {};
	const styleMap: Record<CommunicationStyle, [number, number]> = {
		gentle: [0.7, 0.3], balanced: [0.5, 0.5], direct: [0.3, 0.8]
	};
	if (profile.communication_style) {
		const [f, d] = styleMap[profile.communication_style];
		prefs.formality = f;
		prefs.directness = d;
	}
	const explMap: Record<ExplanationLevel, [number, number]> = {
		minimal: [0.2, 0.3], brief: [0.5, 0.5], detailed: [0.9, 0.7]
	};
	if (profile.explanations) {
		const [dep, tech] = explMap[profile.explanations];
		prefs.depth = dep;
		prefs.technical_level = tech;
	}
	return prefs;
}

export function deriveDimensionalModifiers(profile: CompassProfile): Record<string, number> {
	if (!profile.risk_tolerance) return {};
	const modMap: Record<RiskTolerance, [number, number]> = {
		conservative: [-0.15, 0.15], calculated: [0, 0], aggressive: [0.15, -0.15]
	};
	const [trust, rigidity] = modMap[profile.risk_tolerance];
	return { trust_default: trust, rule_rigidity: rigidity };
}

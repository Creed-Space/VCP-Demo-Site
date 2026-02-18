<script lang="ts">
	/**
	 * TransparencyTab — Intent inference and decision transparency.
	 * Shows how VCP enables AI systems to explain their reasoning.
	 */
	import { inferIntent, INTENT_LABELS } from '$lib/vcp/intent';
	import type {
		VCPContext,
		PersonalState,
		IntentCategory,
		InterpretiveFrame,
		GenerationPreferences
	} from '$lib/vcp/types';
	import { personalStateDims, getIntensityLabel, getIntensityColor } from '$lib/vcp/personalStateDims';

	let {
		personalState,
		onPersonalStateChange,
		initialPreset,
		onPresetChange
	}: {
		personalState: PersonalState;
		onPersonalStateChange?: (ps: PersonalState) => void;
		initialPreset?: string;
		onPresetChange?: (preset: string) => void;
	} = $props();

	// Sync changes back to parent via callback
	function setPersonalState(ps: PersonalState) {
		personalState = ps;
		onPersonalStateChange?.(ps);
	}

	// ============================================
	// Context Signals (local to this tab)
	// ============================================

	let hasWorkplace = $state(false);
	let hasEvening = $state(false);

	const context = $derived<Partial<VCPContext>>({
		vcp_version: '1.0.0',
		profile_id: 'transparency-demo',
		public_profile: {
			display_name: 'Demo User',
			role: hasWorkplace ? 'analyst' : undefined
		},
		availability: {
			best_times: hasEvening ? ['evening'] : []
		},
		personal_state: personalState
	});

	// ============================================
	// Intent Inference (reactive)
	// ============================================

	const frame = $derived<InterpretiveFrame>(inferIntent(context, personalState));

	// ============================================
	// Generation Preferences (local to this tab)
	// ============================================

	let genPrefs = $state<GenerationPreferences>({
		depth: 3,
		formality: 3,
		directness: 3,
		technical_level: 3
	});

	const genSliders = [
		{ key: 'depth' as const, icon: 'fa-layer-group', label: 'Depth', low: 'Brief', high: 'Thorough' },
		{ key: 'formality' as const, icon: 'fa-user-tie', label: 'Formality', low: 'Casual', high: 'Formal' },
		{ key: 'directness' as const, icon: 'fa-bullseye', label: 'Directness', low: 'Gentle', high: 'Blunt' },
		{ key: 'technical_level' as const, icon: 'fa-code', label: 'Technical Level', low: 'Plain', high: 'Expert' }
	];

	// ============================================
	// Mock Decision Transparency
	// ============================================

	interface MockDecision {
		chosen: string;
		reasoning: string;
		rejected: { label: string; reason: string }[];
	}

	const mockDecision = $derived<MockDecision>(buildMockDecision(frame));

	function buildMockDecision(f: InterpretiveFrame): MockDecision {
		const cat = f.primary.category;

		if (cat === 'crisis_support') {
			return { chosen: 'Activate crisis support protocol with immediate, clear guidance', reasoning: 'Critical urgency detected. Brevity and clarity take priority over depth.', rejected: [{ label: 'Standard conversational response', reason: 'Too slow for crisis context' }, { label: 'Request more information first', reason: 'Urgency precludes extended intake' }, { label: 'Suggest scheduling a later session', reason: 'Contradicts critical urgency signal' }] };
		}
		if (cat === 'health_check') {
			return { chosen: 'Provide health-focused guidance with empathetic framing', reasoning: 'Body signals indicate physical concern. Tone should be supportive, not clinical.', rejected: [{ label: 'Proceed with unrelated task', reason: 'Ignores physical state signals' }, { label: 'Offer medical diagnosis', reason: 'Outside scope — would require professional referral' }, { label: 'Suggest high-energy activity', reason: 'Contradicts body signal readings' }] };
		}
		if (cat === 'emotional_processing') {
			return { chosen: 'Create reflective space with validation before problem-solving', reasoning: 'High emotional intensity detected. Validation should precede solutions.', rejected: [{ label: 'Jump straight to solutions', reason: 'Skips emotional acknowledgment' }, { label: 'Redirect to a different topic', reason: 'Dismisses current emotional state' }, { label: 'Apply high formality', reason: 'Distance when closeness is needed' }] };
		}
		if (cat === 'urgent_task') {
			return { chosen: 'Deliver concise, actionable response focused on efficiency', reasoning: 'Time pressure demands brevity. Skip preamble, lead with answers.', rejected: [{ label: 'Provide extended background context', reason: 'User is time-pressured' }, { label: 'Ask clarifying questions first', reason: 'Urgency favors best-guess action' }, { label: 'Suggest a break first', reason: 'Contradicts urgency signal' }] };
		}
		if (cat === 'professional_inquiry') {
			return { chosen: 'Respond with structured, professional-grade analysis', reasoning: 'Workplace context detected. Maintain professional register.', rejected: [{ label: 'Use overly casual tone', reason: 'Workplace context requires professionalism' }, { label: 'Include personal anecdotes', reason: 'Not appropriate for work context' }, { label: 'Omit source citations', reason: 'Professional use cases need verifiability' }] };
		}
		if (cat === 'creative_work') {
			return { chosen: 'Respond with creative latitude and generative energy', reasoning: 'Uplifted mood suggests openness to creative exploration.', rejected: [{ label: 'Apply strict structure', reason: 'May constrain creative flow' }, { label: 'Focus on criticism', reason: 'Positive mood favors generative over evaluative' }, { label: 'Minimize elaboration', reason: 'Creative contexts benefit from expansive responses' }] };
		}

		return { chosen: 'Provide a balanced, conversational response', reasoning: 'No strong contextual signals. Defaulting to friendly, moderate depth.', rejected: [{ label: 'Use highly formal register', reason: 'No formality signals detected' }, { label: 'Assume urgency', reason: 'No time pressure indicated' }, { label: 'Provide minimal response', reason: 'Default depth should offer useful context' }] };
	}

	// ============================================
	// Presets
	// ============================================

	const VALID_PRESETS = ['neutral', 'morning_work', 'evening_creative', 'crisis'] as const;

	function applyPreset(name: string) {
		hasWorkplace = false;
		hasEvening = false;

		if (name === 'morning_work') {
			hasWorkplace = true;
			setPersonalState({ cognitive_state: { value: 'focused', intensity: 4 }, emotional_tone: { value: 'neutral', intensity: 2 }, energy_level: { value: 'rested', intensity: 3 }, perceived_urgency: { value: 'pressured', intensity: 4 }, body_signals: { value: 'neutral', intensity: 1 } });
			genPrefs = { depth: 2, formality: 4, directness: 5, technical_level: 4 };
		} else if (name === 'evening_creative') {
			hasEvening = true;
			setPersonalState({ cognitive_state: { value: 'reflective', intensity: 3 }, emotional_tone: { value: 'uplifted', intensity: 3 }, energy_level: { value: 'low_energy', intensity: 2 }, perceived_urgency: { value: 'unhurried', intensity: 1 }, body_signals: { value: 'neutral', intensity: 1 } });
			genPrefs = { depth: 4, formality: 1, directness: 2, technical_level: 2 };
		} else if (name === 'crisis') {
			setPersonalState({ cognitive_state: { value: 'overloaded', intensity: 5 }, emotional_tone: { value: 'frustrated', intensity: 5 }, energy_level: { value: 'depleted', intensity: 4 }, perceived_urgency: { value: 'critical', intensity: 5 }, body_signals: { value: 'unwell', intensity: 3 } });
			genPrefs = { depth: 1, formality: 1, directness: 5, technical_level: 1 };
		} else {
			setPersonalState({ cognitive_state: { value: 'focused', intensity: 3 }, emotional_tone: { value: 'calm', intensity: 2 }, energy_level: { value: 'rested', intensity: 3 }, perceived_urgency: { value: 'unhurried', intensity: 2 }, body_signals: { value: 'neutral', intensity: 1 } });
			genPrefs = { depth: 3, formality: 3, directness: 3, technical_level: 3 };
		}

		onPresetChange?.(name);
	}

	// Apply initial preset from URL deep-link
	let initialPresetApplied = false;
	$effect(() => {
		if (initialPreset && !initialPresetApplied && VALID_PRESETS.includes(initialPreset as typeof VALID_PRESETS[number])) {
			initialPresetApplied = true;
			applyPreset(initialPreset);
		}
	});

	// ============================================
	// Helpers
	// ============================================

	function getConfidenceColor(confidence: number): string {
		if (confidence >= 0.75) return 'var(--color-success)';
		if (confidence >= 0.5) return 'var(--color-warning)';
		return 'var(--color-text-muted)';
	}

	function getIntentIcon(cat: IntentCategory): string {
		const icons: Record<IntentCategory, string> = {
			professional_inquiry: 'fa-briefcase', urgent_task: 'fa-fire',
			personal_exploration: 'fa-compass', emotional_processing: 'fa-heart',
			health_check: 'fa-kit-medical', casual_conversation: 'fa-comments',
			crisis_support: 'fa-triangle-exclamation', creative_work: 'fa-palette',
			learning: 'fa-graduation-cap', routine_check: 'fa-circle-check'
		};
		return icons[cat] ?? 'fa-circle-question';
	}

	function updatePersonalDimValue(key: keyof PersonalState, newValue: string) {
		const current = personalState[key] ?? { value: '', intensity: 3 };
		setPersonalState({ ...personalState, [key]: { ...current, value: newValue, declared_at: new Date().toISOString() } });
	}

	function updatePersonalDimIntensity(key: keyof PersonalState, newIntensity: number) {
		const current = personalState[key] ?? { value: '', intensity: 3 };
		setPersonalState({ ...personalState, [key]: { ...current, intensity: newIntensity, declared_at: new Date().toISOString() } });
	}
</script>

<!-- Presets -->
<section class="presets-bar">
	<span class="presets-label">
		<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
		Presets:
	</span>
	<button class="btn btn-ghost btn-sm" onclick={() => applyPreset('neutral')}>
		<i class="fa-solid fa-circle-dot" aria-hidden="true"></i> Neutral
	</button>
	<button class="btn btn-ghost btn-sm" onclick={() => applyPreset('morning_work')}>
		<i class="fa-solid fa-building" aria-hidden="true"></i> Morning Work
	</button>
	<button class="btn btn-ghost btn-sm" onclick={() => applyPreset('evening_creative')}>
		<i class="fa-solid fa-moon" aria-hidden="true"></i> Evening Creative
	</button>
	<button class="btn btn-ghost btn-sm" onclick={() => applyPreset('crisis')}>
		<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Crisis
	</button>
</section>

<div class="transparency-grid">
	<!-- Left Column: Inputs -->
	<div class="input-column">
		<!-- Personal State Panel -->
		<div class="panel">
			<div class="panel-header">
				<h2><i class="fa-solid fa-user" aria-hidden="true"></i> Personal State</h2>
			</div>
			<div class="panel-body">
				<p class="panel-intro">Adjust how the user is feeling right now. Changes update the inferred intent in real-time.</p>
				<div class="dims-list">
					{#each personalStateDims as dim}
						{@const current = personalState[dim.key]}
						{@const currentValue = current?.value ?? dim.options[0]}
						{@const intensity = current?.intensity ?? 3}
						<div class="dim-row" class:dim-high={intensity >= 4} class:dim-medium={intensity === 3}>
							<div class="dim-header">
								<i class="fa-solid {dim.icon}" aria-hidden="true"></i>
								<label class="dim-label" for="t-dim-{dim.key}">{dim.label}</label>
								<span class="dim-intensity-badge" style="color: {getIntensityColor(intensity)}">
									{intensity}/5 {getIntensityLabel(intensity)}
								</span>
							</div>
							<div class="dim-controls">
								<select
									id="t-dim-{dim.key}"
									class="dim-select"
									value={currentValue}
									onchange={(e) => updatePersonalDimValue(dim.key, e.currentTarget.value)}
									aria-label="{dim.label} value"
								>
									{#each dim.options as opt}
										<option value={opt}>{opt.replace(/_/g, ' ')}</option>
									{/each}
								</select>
								<input
									type="range" min="1" max="5" step="1"
									value={intensity}
									oninput={(e) => updatePersonalDimIntensity(dim.key, parseInt(e.currentTarget.value))}
									class="dim-slider"
									aria-label="{dim.label} intensity"
								/>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Context Signals Panel -->
		<div class="panel">
			<div class="panel-header">
				<h2><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Context Signals</h2>
			</div>
			<div class="panel-body">
				<p class="panel-intro">Toggle environmental signals that influence intent classification.</p>
				<div class="signal-toggles">
					<label class="signal-toggle">
						<input type="checkbox" bind:checked={hasWorkplace} />
						<span class="signal-content">
							<span>Workplace</span>
							<span class="signal-hint">Adds role context, triggers professional rules</span>
						</span>
					</label>
					<label class="signal-toggle">
						<input type="checkbox" bind:checked={hasEvening} />
						<span class="signal-content">
							<span>Evening</span>
							<span class="signal-hint">Adds time signal, triggers personal exploration rules</span>
						</span>
					</label>
				</div>
			</div>
		</div>

		<!-- Generation Style Panel -->
		<div class="panel">
			<div class="panel-header">
				<h2><i class="fa-solid fa-sliders" aria-hidden="true"></i> Generation Style</h2>
			</div>
			<div class="panel-body">
				<p class="panel-intro">These preferences shape how the AI generates its response.</p>
				<div class="gen-sliders">
					{#each genSliders as slider}
						{@const value = genPrefs[slider.key] ?? 3}
						<div class="gen-slider-row">
							<div class="gen-slider-header">
								<i class="fa-solid {slider.icon}" aria-hidden="true"></i>
								<span class="gen-slider-label">{slider.label}</span>
								<span class="gen-slider-value">{value}/5</span>
							</div>
							<div class="gen-slider-track">
								<span class="gen-slider-low">{slider.low}</span>
								<div class="dot-slider" role="slider" aria-label="{slider.label}" aria-valuemin={1} aria-valuemax={5} aria-valuenow={value}>
									{#each [1, 2, 3, 4, 5] as dot}
										<button
											class="dot"
											class:active={dot <= value}
											class:current={dot === value}
											onclick={() => { genPrefs = { ...genPrefs, [slider.key]: dot }; }}
											aria-label="{slider.label} level {dot}"
										>
											<span class="dot-inner"></span>
										</button>
									{/each}
								</div>
								<span class="gen-slider-high">{slider.high}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Right Column: Outputs -->
	<div class="output-column">
		<!-- Inferred Intent Panel -->
		<div class="panel intent-panel">
			<div class="panel-header">
				<h2><i class="fa-solid fa-lightbulb" aria-hidden="true"></i> Inferred Intent</h2>
				<span class="live-badge"><i class="fa-solid fa-circle" aria-hidden="true"></i> Live</span>
			</div>
			<div class="panel-body">
				<div class="primary-intent">
					<div class="intent-chip intent-chip-primary">
						<i class="fa-solid {getIntentIcon(frame.primary.category)}" aria-hidden="true"></i>
						<span class="intent-chip-label">{INTENT_LABELS[frame.primary.category]}</span>
						<span class="intent-chip-confidence" style="color: {getConfidenceColor(frame.primary.confidence)}">
							{Math.round(frame.primary.confidence * 100)}%
						</span>
					</div>
					<p class="intent-reasoning">{frame.primary.reasoning}</p>
					{#if frame.primary.contributing_dimensions.length > 0}
						<div class="intent-dims">
							<span class="intent-dims-label">Contributing dimensions:</span>
							{#each frame.primary.contributing_dimensions as dim}
								<span class="dim-tag">{dim.replace(/_/g, ' ')}</span>
							{/each}
						</div>
					{/if}
				</div>

				{#if frame.alternatives.length > 0}
					<div class="alternatives-section">
						<h3 class="alternatives-heading">
							<i class="fa-solid fa-code-branch" aria-hidden="true"></i>
							Alternative Interpretations
						</h3>
						<div class="alternatives-list">
							{#each frame.alternatives as alt}
								<div class="intent-chip intent-chip-alt">
									<i class="fa-solid {getIntentIcon(alt.category)}" aria-hidden="true"></i>
									<span class="intent-chip-label">{INTENT_LABELS[alt.category]}</span>
									<span class="intent-chip-confidence" style="color: {getConfidenceColor(alt.confidence)}">
										{Math.round(alt.confidence * 100)}%
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<div class="confidence-visual">
					<h3 class="confidence-heading">Confidence Distribution</h3>
					<div class="confidence-bars">
						<div class="conf-bar-row">
							<span class="conf-bar-label">{INTENT_LABELS[frame.primary.category]}</span>
							<div class="conf-bar-track">
								<div class="conf-bar-fill conf-bar-primary" style="width: {frame.primary.confidence * 100}%"></div>
							</div>
							<span class="conf-bar-pct">{Math.round(frame.primary.confidence * 100)}%</span>
						</div>
						{#each frame.alternatives as alt}
							<div class="conf-bar-row">
								<span class="conf-bar-label">{INTENT_LABELS[alt.category]}</span>
								<div class="conf-bar-track">
									<div class="conf-bar-fill conf-bar-alt" style="width: {alt.confidence * 100}%"></div>
								</div>
								<span class="conf-bar-pct">{Math.round(alt.confidence * 100)}%</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- Decision Transparency Panel -->
		<div class="panel decision-panel">
			<div class="panel-header">
				<h2><i class="fa-solid fa-scale-balanced" aria-hidden="true"></i> Decision Transparency</h2>
			</div>
			<div class="panel-body">
				<p class="panel-intro">The AI considered multiple response strategies. Here is what it chose and what it rejected.</p>
				<div class="decision-chosen">
					<div class="decision-badge decision-badge-chosen">
						<i class="fa-solid fa-check" aria-hidden="true"></i> Chosen
					</div>
					<p class="decision-text">{mockDecision.chosen}</p>
					<p class="decision-reasoning">
						<i class="fa-solid fa-circle-info" aria-hidden="true"></i>
						{mockDecision.reasoning}
					</p>
				</div>
				<div class="decision-rejected">
					<h3 class="rejected-heading">
						<i class="fa-solid fa-xmark" aria-hidden="true"></i> Rejected Alternatives
					</h3>
					<div class="rejected-list">
						{#each mockDecision.rejected as rej}
							<div class="rejected-item">
								<span class="rejected-label">{rej.label}</span>
								<span class="rejected-reason">
									<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
									{rej.reason}
								</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* Layout */
	.transparency-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg); margin-bottom: var(--space-2xl); }
	.input-column, .output-column { display: flex; flex-direction: column; gap: var(--space-lg); }
	.output-column { position: sticky; top: 80px; max-height: calc(100vh - 100px); overflow-y: auto; align-self: flex-start; }

	/* Presets Bar */
	.presets-bar {
		display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-lg);
		padding: var(--space-sm) var(--space-md); background: var(--color-bg-card);
		border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.1); flex-wrap: wrap;
	}
	.presets-label { font-size: var(--text-sm); color: var(--color-text-muted); display: flex; align-items: center; gap: var(--space-xs); }

	/* Panel Styles */
	.panel { background: var(--color-bg-card); border-radius: var(--radius-lg); border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden; }
	.panel-header {
		display: flex; justify-content: space-between; align-items: center;
		padding: var(--space-md) var(--space-lg); background: rgba(255, 255, 255, 0.03);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	.panel-header h2 { font-size: 1rem; margin: 0; display: flex; align-items: center; gap: var(--space-sm); }
	.panel-header h2 i { color: var(--color-primary); font-size: 0.875rem; }
	.panel-body { padding: var(--space-lg); }
	.panel-intro { font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-md); }

	/* Personal State Dimensions */
	.dims-list { display: flex; flex-direction: column; gap: var(--space-md); }
	.dim-row {
		background: rgba(255, 255, 255, 0.02); padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.05);
		border-left: 3px solid var(--color-success); transition: border-color var(--transition-fast);
	}
	.dim-row.dim-medium { border-left-color: var(--color-warning); }
	.dim-row.dim-high { border-left-color: var(--color-danger); }
	.dim-header { display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-xs); }
	.dim-header i { color: var(--color-primary); width: 1rem; text-align: center; }
	.dim-label { flex: 1; font-size: var(--text-sm); font-weight: 500; }
	.dim-intensity-badge { font-family: var(--font-mono); font-size: var(--text-xs); }
	.dim-controls { display: flex; flex-direction: column; gap: var(--space-xs); }
	.dim-select {
		width: 100%; padding: var(--space-xs) var(--space-sm); background: var(--color-bg);
		border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-sm);
		color: var(--color-text); font-size: var(--text-sm); text-transform: capitalize;
	}
	.dim-slider { width: 100%; accent-color: var(--color-primary); }

	/* Context Signal Toggles */
	.signal-toggles { display: flex; flex-direction: column; gap: var(--space-sm); }
	.signal-toggle {
		display: flex; align-items: flex-start; gap: var(--space-sm); cursor: pointer;
		padding: var(--space-sm) var(--space-md); border-radius: var(--radius-md);
		background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05);
		transition: background var(--transition-fast);
	}
	.signal-toggle:hover { background: rgba(255, 255, 255, 0.04); }
	.signal-toggle input { margin-top: 3px; accent-color: var(--color-primary); }
	.signal-content { display: flex; flex-direction: column; gap: 2px; }
	.signal-content span:first-of-type { font-size: var(--text-sm); font-weight: 500; }
	.signal-hint { font-size: var(--text-xs); color: var(--color-text-muted); }

	/* Generation Dot Sliders */
	.gen-sliders { display: flex; flex-direction: column; gap: var(--space-lg); }
	.gen-slider-row { display: flex; flex-direction: column; gap: var(--space-xs); }
	.gen-slider-header { display: flex; align-items: center; gap: var(--space-sm); }
	.gen-slider-header i { color: var(--color-primary); width: 1rem; text-align: center; font-size: 0.875rem; }
	.gen-slider-label { flex: 1; font-size: var(--text-sm); font-weight: 500; }
	.gen-slider-value { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-muted); }
	.gen-slider-track { display: flex; align-items: center; gap: var(--space-sm); }
	.gen-slider-low, .gen-slider-high { font-size: var(--text-xs); color: var(--color-text-muted); min-width: 3.5rem; }
	.gen-slider-low { text-align: right; }
	.gen-slider-high { text-align: left; }
	.dot-slider { display: flex; align-items: center; gap: var(--space-sm); flex: 1; justify-content: space-between; padding: var(--space-xs) 0; }
	.dot {
		width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.15);
		background: transparent; cursor: pointer; display: flex; align-items: center;
		justify-content: center; transition: all var(--transition-fast); padding: 0;
	}
	.dot:hover { border-color: var(--color-primary); }
	.dot.active { border-color: var(--color-primary); }
	.dot-inner { width: 10px; height: 10px; border-radius: 50%; background: transparent; transition: all var(--transition-fast); }
	.dot.active .dot-inner { background: var(--color-primary); }
	.dot.current { border-color: var(--color-primary); box-shadow: 0 0 8px rgba(99, 102, 241, 0.4); }
	.dot.current .dot-inner { width: 12px; height: 12px; background: var(--color-primary); }

	/* Live Badge */
	.live-badge {
		display: inline-flex; align-items: center; gap: var(--space-xs);
		padding: 2px 8px; background: var(--color-success-muted); color: var(--color-success);
		border-radius: var(--radius-sm); font-size: 0.6875rem; font-weight: 600;
		text-transform: uppercase; letter-spacing: 0.05em;
	}
	.live-badge i { font-size: 0.375rem; animation: pulse-live 2s ease-in-out infinite; }
	@keyframes pulse-live { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

	/* Inferred Intent */
	.primary-intent { margin-bottom: var(--space-lg); padding-bottom: var(--space-lg); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
	.intent-chip { display: inline-flex; align-items: center; gap: var(--space-sm); padding: var(--space-sm) var(--space-md); border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: 500; }
	.intent-chip i { font-size: 0.875rem; }
	.intent-chip-primary { background: var(--color-primary-muted); border: 1px solid rgba(99, 102, 241, 0.3); }
	.intent-chip-primary i { color: var(--color-primary); }
	.intent-chip-label { color: var(--color-text); }
	.intent-chip-confidence { font-family: var(--font-mono); font-size: var(--text-xs); font-weight: 600; }
	.intent-reasoning { margin-top: var(--space-sm); font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.5; }
	.intent-dims { display: flex; align-items: center; gap: var(--space-xs); margin-top: var(--space-sm); flex-wrap: wrap; }
	.intent-dims-label { font-size: var(--text-xs); color: var(--color-text-muted); }
	.dim-tag { display: inline-block; padding: 2px 8px; background: rgba(255, 255, 255, 0.05); border-radius: var(--radius-sm); font-size: var(--text-xs); color: var(--color-text); text-transform: capitalize; }

	/* Alternatives */
	.alternatives-section { margin-bottom: var(--space-lg); padding-bottom: var(--space-lg); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
	.alternatives-heading { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: var(--space-sm); display: flex; align-items: center; gap: var(--space-xs); }
	.alternatives-heading i { font-size: 0.625rem; }
	.alternatives-list { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
	.intent-chip-alt { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); opacity: 0.8; }
	.intent-chip-alt i { color: var(--color-text-muted); }

	/* Confidence Bars */
	.confidence-heading { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: var(--space-md); }
	.confidence-bars { display: flex; flex-direction: column; gap: var(--space-sm); }
	.conf-bar-row { display: grid; grid-template-columns: 8rem 1fr 2.5rem; align-items: center; gap: var(--space-sm); }
	.conf-bar-label { font-size: var(--text-xs); color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.conf-bar-track { height: 6px; background: rgba(255, 255, 255, 0.05); border-radius: 3px; overflow: hidden; }
	.conf-bar-fill { height: 100%; border-radius: 3px; transition: width var(--transition-normal); }
	.conf-bar-primary { background: linear-gradient(90deg, var(--color-primary), #8b5cf6); }
	.conf-bar-alt { background: rgba(255, 255, 255, 0.2); }
	.conf-bar-pct { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-muted); text-align: right; }

	/* Decision Transparency */
	.decision-chosen { margin-bottom: var(--space-lg); padding-bottom: var(--space-lg); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
	.decision-badge { display: inline-flex; align-items: center; gap: var(--space-xs); padding: var(--space-xs) var(--space-sm); border-radius: var(--radius-sm); font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-sm); }
	.decision-badge-chosen { background: var(--color-success-muted); color: var(--color-success); }
	.decision-text { font-size: var(--text-sm); font-weight: 500; line-height: 1.5; margin-bottom: var(--space-sm); }
	.decision-reasoning { font-size: var(--text-xs); color: var(--color-text-muted); display: flex; align-items: flex-start; gap: var(--space-xs); line-height: 1.4; }
	.decision-reasoning i { margin-top: 2px; flex-shrink: 0; }
	.rejected-heading { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: var(--space-md); display: flex; align-items: center; gap: var(--space-xs); }
	.rejected-heading i { color: var(--color-danger); font-size: 0.625rem; }
	.rejected-list { display: flex; flex-direction: column; gap: var(--space-sm); }
	.rejected-item { display: flex; flex-direction: column; gap: 2px; padding: var(--space-sm) var(--space-md); background: rgba(255, 255, 255, 0.02); border-radius: var(--radius-md); border-left: 3px solid var(--color-danger); }
	.rejected-label { font-size: var(--text-sm); text-decoration: line-through; color: var(--color-text-muted); }
	.rejected-reason { font-size: var(--text-xs); color: var(--color-text-muted); display: flex; align-items: center; gap: var(--space-xs); opacity: 0.7; }
	.rejected-reason i { font-size: 0.5rem; }

	/* Responsive */
	@media (max-width: 900px) {
		.transparency-grid { grid-template-columns: 1fr; }
		.output-column { position: static; max-height: none; overflow-y: visible; }
		.conf-bar-row { grid-template-columns: 5rem 1fr 2rem; }
	}

	@media (max-width: 640px) {
		.presets-bar { flex-direction: column; align-items: stretch; }
		.conf-bar-row { grid-template-columns: 1fr; gap: 2px; }
		.conf-bar-label { white-space: normal; }
		.conf-bar-pct { text-align: left; }
	}
</style>

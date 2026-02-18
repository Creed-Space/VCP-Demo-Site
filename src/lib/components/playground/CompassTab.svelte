<script lang="ts">
	/**
	 * CompassTab — Philosophical profile questionnaire.
	 * Maps everyday preferences to constitution modules, generation preferences,
	 * and dimensional modifiers in real time.
	 */
	import { deriveConstitutions, deriveGenerationPrefs, deriveDimensionalModifiers } from '$lib/vcp/compass';
	import type { CompassProfile } from '$lib/vcp/compass';

	let { onApplyToContext }: {
		onApplyToContext?: (constitutionId: string, genPrefs: Record<string, number>) => void;
	} = $props();

	let profile = $state<CompassProfile>({
		metaethics: null,
		epistemology: null,
		optimize_for: null,
		risk_tolerance: null,
		communication_style: null,
		explanations: null
	});

	let constitutions = $derived(deriveConstitutions(profile));
	let genPrefs = $derived(deriveGenerationPrefs(profile));
	let modifiers = $derived(deriveDimensionalModifiers(profile));
	let hasSelections = $derived(constitutions.length > 0 || Object.keys(genPrefs).length > 0 || Object.keys(modifiers).length > 0);

	const questions: Array<{
		key: keyof CompassProfile;
		label: string;
		icon: string;
		description: string;
		options: Array<{ value: string; label: string }>;
	}> = [
		{ key: 'optimize_for', label: 'What matters most to you?', icon: 'fa-heart', description: 'Your core value shapes which constitution modules activate.', options: [{ value: 'stability', label: 'Stability and security' }, { value: 'growth', label: 'Growth and learning' }, { value: 'freedom', label: 'Freedom and independence' }, { value: 'connection', label: 'Connection and relationships' }] },
		{ key: 'epistemology', label: 'How do you trust information?', icon: 'fa-magnifying-glass', description: 'Your epistemic style determines how the AI reasons with you.', options: [{ value: 'empiricist', label: 'Evidence — show me data' }, { value: 'rationalist', label: 'Logic — walk me through it' }, { value: 'pragmatist', label: 'Results — what works?' }, { value: 'skeptic', label: 'Caution — question everything' }] },
		{ key: 'metaethics', label: 'When facing tough calls...', icon: 'fa-scale-balanced', description: 'Your ethical lens guides how the AI handles moral dilemmas.', options: [{ value: 'consequentialist', label: 'The outcome matters most' }, { value: 'deontological', label: 'The principle matters most' }, { value: 'virtue_ethics', label: 'Character matters most' }, { value: 'anti_realist', label: 'It depends on context' }] },
		{ key: 'communication_style', label: 'How should AI talk to you?', icon: 'fa-comment-dots', description: 'Sets formality and directness generation preferences.', options: [{ value: 'gentle', label: 'Gently — softer tone' }, { value: 'balanced', label: 'Balanced — middle ground' }, { value: 'direct', label: 'Directly — no sugarcoating' }] },
		{ key: 'risk_tolerance', label: 'How much risk is OK?', icon: 'fa-gauge-high', description: 'Adjusts trust and rule-rigidity dimensional modifiers.', options: [{ value: 'conservative', label: 'Play it safe' }, { value: 'calculated', label: 'Weigh it carefully' }, { value: 'aggressive', label: 'Fortune favours the bold' }] },
		{ key: 'explanations', label: 'How detailed should explanations be?', icon: 'fa-list-check', description: 'Controls depth and technical level of AI responses.', options: [{ value: 'minimal', label: 'Just the answer' }, { value: 'brief', label: 'Brief context' }, { value: 'detailed', label: 'Full reasoning' }] }
	];

	const prefLabels: Record<string, string> = {
		formality: 'Formality', directness: 'Directness',
		depth: 'Depth', technical_level: 'Technical Level'
	};

	const modifierLabels: Record<string, string> = {
		trust_default: 'Trust Default', rule_rigidity: 'Rule Rigidity'
	};

	function resetProfile() {
		profile = { metaethics: null, epistemology: null, optimize_for: null, risk_tolerance: null, communication_style: null, explanations: null };
	}

	function handleSelect(key: keyof CompassProfile, value: string) {
		if (profile[key] === value) {
			profile[key] = null as never;
		} else {
			profile[key] = value as never;
		}
	}

	function handleApply() {
		if (!onApplyToContext || constitutions.length === 0) return;
		onApplyToContext(constitutions[0].path, genPrefs);
	}
</script>

<!-- Mapping Chain -->
<div class="mapping-chain">
	<span class="chain-step"><i class="fa-solid fa-user" aria-hidden="true"></i> Everyday answer</span>
	<i class="fa-solid fa-arrow-right chain-arrow" aria-hidden="true"></i>
	<span class="chain-step"><i class="fa-solid fa-book" aria-hidden="true"></i> Philosophical category</span>
	<i class="fa-solid fa-arrow-right chain-arrow" aria-hidden="true"></i>
	<span class="chain-step"><i class="fa-solid fa-scroll" aria-hidden="true"></i> Constitution module</span>
	<i class="fa-solid fa-arrow-right chain-arrow" aria-hidden="true"></i>
	<span class="chain-step"><i class="fa-solid fa-robot" aria-hidden="true"></i> Behavior change</span>
</div>

<div class="two-panel">
	<!-- Left Panel: Questions -->
	<div class="panel panel-questions">
		<div class="panel-header">
			<h2><i class="fa-solid fa-sliders" aria-hidden="true"></i> Your Preferences</h2>
			<button class="reset-btn" onclick={resetProfile} aria-label="Reset all selections">
				<i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Reset
			</button>
		</div>

		{#each questions as q}
			<div class="question-group">
				<span class="question-label">
					<i class="fa-solid {q.icon}" aria-hidden="true"></i>
					{q.label}
				</span>
				<p class="question-desc">{q.description}</p>
				<div class="option-grid" role="radiogroup" aria-label={q.label}>
					{#each q.options as opt}
						<button
							class="option-btn"
							class:selected={profile[q.key] === opt.value}
							onclick={() => handleSelect(q.key, opt.value)}
							role="radio"
							aria-checked={profile[q.key] === opt.value}
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Right Panel: Live Output -->
	<div class="panel panel-output">
		<div class="panel-header">
			<h2><i class="fa-solid fa-bolt" aria-hidden="true"></i> Live Derivation</h2>
			{#if onApplyToContext && hasSelections && constitutions.length > 0}
				<button class="btn btn-primary btn-sm" onclick={handleApply}>
					<i class="fa-solid fa-arrow-right" aria-hidden="true"></i> Apply to Context Builder
				</button>
			{/if}
		</div>

		{#if !hasSelections}
			<div class="empty-state">
				<i class="fa-solid fa-hand-pointer" aria-hidden="true"></i>
				<p>Select preferences on the left to see how they shape AI behavior.</p>
			</div>
		{:else}
			{#if constitutions.length > 0}
				<div class="output-section">
					<h3><i class="fa-solid fa-scroll" aria-hidden="true"></i> Active Constitution Modules</h3>
					<div class="constitution-cards">
						{#each constitutions as c}
							<div class="constitution-card">
								<div class="card-title">{c.title}</div>
								<div class="card-desc">{c.description}</div>
								<div class="card-path">
									<i class="fa-solid fa-folder-open" aria-hidden="true"></i>
									{c.path}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if Object.keys(genPrefs).length > 0}
				<div class="output-section">
					<h3><i class="fa-solid fa-sliders" aria-hidden="true"></i> Generation Preferences</h3>
					<div class="pref-bars">
						{#each Object.entries(genPrefs) as [key, value]}
							<div class="pref-bar-row">
								<span class="pref-label">{prefLabels[key] ?? key}</span>
								<div class="pref-bar-track">
									<div class="pref-bar-fill" style="width: {value * 100}%"></div>
								</div>
								<span class="pref-value">{Math.round(value * 100)}%</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if Object.keys(modifiers).length > 0}
				<div class="output-section">
					<h3><i class="fa-solid fa-arrows-left-right" aria-hidden="true"></i> Dimensional Modifiers</h3>
					<div class="modifier-list">
						{#each Object.entries(modifiers) as [key, value]}
							<div class="modifier-row">
								<span class="modifier-label">{modifierLabels[key] ?? key}</span>
								<div class="modifier-gauge">
									<div class="modifier-center"></div>
									<div
										class="modifier-indicator"
										class:positive={value > 0}
										class:negative={value < 0}
										class:neutral={value === 0}
										style="left: {50 + value * 200}%"
									></div>
								</div>
								<span class="modifier-value" class:positive={value > 0} class:negative={value < 0}>
									{value > 0 ? '+' : ''}{value.toFixed(2)}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.mapping-chain {
		display: flex; align-items: center; justify-content: center;
		gap: var(--space-sm); flex-wrap: wrap; margin-bottom: var(--space-lg);
	}

	.chain-step {
		display: inline-flex; align-items: center; gap: var(--space-xs);
		padding: var(--space-xs) var(--space-sm);
		background: var(--glass-bg, rgba(255, 255, 255, 0.03));
		border: var(--glass-border, 1px solid rgba(255, 255, 255, 0.06));
		border-radius: var(--radius-md); font-size: var(--text-sm);
		color: var(--color-text-muted); white-space: nowrap;
	}

	.chain-step i { color: var(--color-primary); }
	.chain-arrow { color: var(--color-text-subtle, var(--color-text-muted)); font-size: var(--text-xs); }

	.two-panel { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-xl); align-items: start; }

	.panel {
		background: var(--glass-bg, var(--color-bg-card));
		border: var(--glass-border, 1px solid rgba(255, 255, 255, 0.1));
		border-radius: var(--radius-lg); padding: var(--space-lg);
	}

	.panel-header {
		display: flex; align-items: center; justify-content: space-between;
		margin-bottom: var(--space-lg); padding-bottom: var(--space-md);
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.panel-header h2 {
		display: flex; align-items: center; gap: var(--space-sm);
		font-size: var(--text-xl); font-weight: 600; margin: 0;
	}

	.panel-header h2 i { color: var(--color-primary); }
	.panel-output { position: sticky; top: 100px; }

	.reset-btn {
		display: inline-flex; align-items: center; gap: var(--space-xs);
		padding: var(--space-xs) var(--space-sm); background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-sm);
		color: var(--color-text-muted); font-size: var(--text-sm); cursor: pointer;
		transition: all var(--transition-fast);
	}

	.reset-btn:hover { background: rgba(255, 255, 255, 0.1); color: var(--color-text); }
	.reset-btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

	.question-group { margin-bottom: var(--space-lg); }
	.question-group:last-child { margin-bottom: 0; }

	.question-label {
		display: flex; align-items: center; gap: var(--space-sm);
		font-size: var(--text-base); font-weight: 600; color: var(--color-text);
		margin-bottom: var(--space-xs);
	}

	.question-label i { color: var(--color-accent, var(--color-primary)); width: 16px; text-align: center; }

	.question-desc {
		font-size: var(--text-sm); color: var(--color-text-subtle, var(--color-text-muted));
		margin-bottom: var(--space-sm); padding-left: 28px;
	}

	.option-grid { display: flex; flex-wrap: wrap; gap: var(--space-xs); padding-left: 28px; }

	.option-btn {
		padding: var(--space-xs) var(--space-md);
		background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius-md); color: var(--color-text-muted);
		font-size: var(--text-sm); cursor: pointer; transition: all var(--transition-fast);
	}

	.option-btn:hover { background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.3); color: var(--color-text); }
	.option-btn:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

	.option-btn.selected {
		background: var(--color-primary-muted); border-color: var(--color-primary);
		color: var(--color-primary-hover, #818cf8); font-weight: 500;
	}

	.empty-state { text-align: center; padding: var(--space-2xl) var(--space-lg); color: var(--color-text-subtle, var(--color-text-muted)); }
	.empty-state i { font-size: 2rem; margin-bottom: var(--space-md); color: var(--color-primary-muted); display: block; }
	.empty-state p { font-size: var(--text-sm); line-height: var(--leading-relaxed, 1.6); }

	.output-section { margin-bottom: var(--space-lg); }
	.output-section:last-child { margin-bottom: 0; }

	.output-section h3 {
		display: flex; align-items: center; gap: var(--space-sm);
		font-size: var(--text-sm); font-weight: 600; color: var(--color-text-muted);
		text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-md);
	}

	.output-section h3 i { color: var(--color-accent, var(--color-primary)); }
	.constitution-cards { display: flex; flex-direction: column; gap: var(--space-sm); }

	.constitution-card {
		padding: var(--space-md); background: rgba(99, 102, 241, 0.05);
		border: 1px solid rgba(99, 102, 241, 0.15); border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.constitution-card:hover { background: rgba(99, 102, 241, 0.08); border-color: rgba(99, 102, 241, 0.25); }
	.card-title { font-weight: 600; font-size: var(--text-base); color: var(--color-text); margin-bottom: var(--space-xs); }
	.card-desc { font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-sm); }

	.card-path {
		font-size: var(--text-xs); color: var(--color-text-subtle, var(--color-text-muted));
		font-family: monospace; display: flex; align-items: center; gap: var(--space-xs);
	}

	.card-path i { font-size: 0.625rem; }
	.pref-bars { display: flex; flex-direction: column; gap: var(--space-md); }

	.pref-bar-row {
		display: grid; grid-template-columns: 120px 1fr 48px;
		align-items: center; gap: var(--space-sm);
	}

	.pref-label { font-size: var(--text-sm); color: var(--color-text-muted); font-weight: 500; }

	.pref-bar-track {
		height: 8px; background: rgba(255, 255, 255, 0.06);
		border-radius: 4px; overflow: hidden;
	}

	.pref-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary), var(--color-accent, #8b5cf6));
		border-radius: 4px; transition: width 0.3s ease;
	}

	.pref-value {
		font-size: var(--text-sm); color: var(--color-accent, var(--color-primary));
		font-weight: 600; text-align: right; font-variant-numeric: tabular-nums;
	}

	.modifier-list { display: flex; flex-direction: column; gap: var(--space-md); }

	.modifier-row {
		display: grid; grid-template-columns: 120px 1fr 60px;
		align-items: center; gap: var(--space-sm);
	}

	.modifier-label { font-size: var(--text-sm); color: var(--color-text-muted); font-weight: 500; }

	.modifier-gauge {
		height: 8px; background: rgba(255, 255, 255, 0.06);
		border-radius: 4px; position: relative;
	}

	.modifier-center {
		position: absolute; left: 50%; top: -2px;
		width: 1px; height: 12px; background: rgba(255, 255, 255, 0.2);
	}

	.modifier-indicator {
		position: absolute; top: -3px; width: 14px; height: 14px;
		border-radius: 50%; transform: translateX(-50%);
		transition: left 0.3s ease; border: 2px solid;
	}

	.modifier-indicator.positive { background: var(--color-success-muted); border-color: var(--color-success); }
	.modifier-indicator.negative { background: var(--color-warning-muted); border-color: var(--color-warning); }
	.modifier-indicator.neutral { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.3); }

	.modifier-value {
		font-size: var(--text-sm); font-weight: 600; text-align: right;
		font-variant-numeric: tabular-nums; color: var(--color-text-muted);
	}

	.modifier-value.positive { color: var(--color-success); }
	.modifier-value.negative { color: var(--color-warning); }

	@media (max-width: 900px) {
		.two-panel { grid-template-columns: 1fr; }
		.panel-output { position: static; }
	}

	@media (max-width: 640px) {
		.mapping-chain { flex-direction: column; }
		.chain-arrow { transform: rotate(90deg); }
		.option-grid { padding-left: 0; }
		.question-desc { padding-left: 0; }
		.pref-bar-row { grid-template-columns: 90px 1fr 40px; }
		.modifier-row { grid-template-columns: 90px 1fr 50px; }
	}
</style>

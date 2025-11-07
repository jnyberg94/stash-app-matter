<!-- <script>
	import { config, setTheme, setQuickSaveSide, addTag, removeTag } from '$lib/utils/configStore';
	import { MagnifyingGlass, Scan } from 'phosphor-svelte';
	import Icon from './Icon.svelte';

	async function toggleTheme() {
		const newTheme = $config.theme === 'dark' ? 'light' : 'dark';
		await setTheme(newTheme);
	}

	async function toggleSide() {
		const newSide = $config.quick_save_side === 'left' ? 'right' : 'left';
		await setQuickSaveSide(newSide);
	}

	let newTag = '';

	async function handleAddTag() {
		if (newTag.trim()) {
			await addTag(newTag.trim());
			newTag = '';
		}
	}
</script>

<div class="settings-cont">
	<div class="theme-toggle flex-horiz gap-md">
		<div class="toggle-cont">
			<button onclick={toggleTheme} class="toggle-selection dark">
				<img src="/images/dark.png" alt="" class="toggle-img" />
			</button>
			<h3>Dark</h3>
		</div>

		<div class="toggle-cont">
			<button onclick={toggleTheme} class="toggle-selection dark">
				<img src="/images/light.png" alt="" class="toggle-img" />
			</button>
			<h3>Light</h3>
		</div>
	</div>

	<div class="line"></div>

	<div class="side-toggle flex-horiz gap-md">
		<div class="toggle-cont">
			<button onclick={toggleSide} class="toggle-selection dark">
				<img src="/images/left.png" alt="" class="toggle-img" />
			</button>
			<h3>Left</h3>
		</div>

		<div class="toggle-cont">
			<button onclick={toggleSide} class="toggle-selection dark">
				<img src="/images/right.png" alt="" class="toggle-img" />
			</button>
			<h3>Right</h3>
		</div>
	</div>

	<div class="line"></div>

	<div class="shortcuts-cont">
		<h3 class="subtext">Keyboard shortcuts</h3>
		<div class="list-cont">
			<div class="flex-horiz space-between">
				<div class="flex-horiz gap-sm">
					<Icon icon={Scan} variant="grey" size="lg" />
					<h3 class="bright">Open quick save</h3>
				</div>
				<kbd class="keyboard-shortcut"> ⌘⇧S </kbd>
			</div>

			<div class="flex-horiz space-between">
				<div class="flex-horiz gap-sm">
					<Icon icon={MagnifyingGlass} variant="grey" size="lg" />
					<h3 class="bright">Search inspiration</h3>
				</div>
				<kbd class="keyboard-shortcut"> ⌘F </kbd>
			</div>
		</div>
	</div>
</div>

<style>
	.settings-cont {
		position: absolute;
		top: 0;
		left: -5000%;
		width: 316px;
		height: auto;
		display: flex;
		flex-direction: column;
		gap: var(--md);
		background: var(--bg-elevated);
		border: var(--border-thin);
		border-radius: var(--border-md);
		padding: var(--sm);
	}

	.toggle-cont {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--xxs);
	}

	.toggle-selection {
		width: 100%;
		height: auto;
		border-radius: var(--border-md);
	}

	.toggle-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: var(--border-md);
		display: block;
	}

	.dark {
		border: var(--border);
	}

	.active {
		border: 3px solid var(--primary);
	}

	.line {
		height: 1px;
		width: 100%;
		background-color: var(--strokeselect);
	}

	.shortcuts-cont {
		display: flex;
		flex-direction: column;
		gap: var(--sm);
	}

	.list-cont {
		display: flex;
		flex-direction: column;
		gap: var(--xxs);
	}

	.space-between {
		justify-content: space-between;
	}

	.keyboard-shortcut {
		padding: var(--xxs);
		border: var(--border-thin);
		border-radius: var(--border-sm);
		font-size: var(--sm);
	}
</style> -->

<script>
	import { config, setTheme, setQuickSaveSide, addTag, removeTag } from '$lib/utils/configStore';
	import { MagnifyingGlass, Scan } from 'phosphor-svelte';
	import Icon from './Icon.svelte';

	async function setThemeToDark() {
		await setTheme('dark');
	}

	async function setThemeToLight() {
		await setTheme('light');
	}

	async function setSideToLeft() {
		await setQuickSaveSide('left');
	}

	async function setSideToRight() {
		await setQuickSaveSide('right');
	}

	let newTag = '';
	async function handleAddTag() {
		if (newTag.trim()) {
			await addTag(newTag.trim());
			newTag = '';
		}
	}
</script>

<div class="settings-cont">
	<div class="theme-toggle flex-horiz gap-md">
		<div class="toggle-cont">
			<button
				onclick={setThemeToDark}
				class="toggle-selection dark"
				class:active={$config.theme === 'dark'}
			>
				<img src="/images/dark.png" alt="" class="toggle-img" />
			</button>
			<h3>Dark</h3>
		</div>
		<div class="toggle-cont">
			<button
				onclick={setThemeToLight}
				class="toggle-selection dark"
				class:active={$config.theme === 'light'}
			>
				<img src="/images/light.png" alt="" class="toggle-img" />
			</button>
			<h3>Light</h3>
		</div>
	</div>
	<div class="line"></div>
	<div class="side-toggle flex-horiz gap-md">
		<div class="toggle-cont">
			<button
				onclick={setSideToLeft}
				class="toggle-selection dark"
				class:active={$config.quick_save_side === 'left'}
			>
				<img src="/images/right.png" alt="" class="toggle-img" />
			</button>
			<h3>Left</h3>
		</div>
		<div class="toggle-cont">
			<button
				onclick={setSideToRight}
				class="toggle-selection dark"
				class:active={$config.quick_save_side === 'right'}
			>
				<img src="/images/left.png" alt="" class="toggle-img" />
			</button>
			<h3>Right</h3>
		</div>
	</div>
	<div class="line"></div>
	<div class="shortcuts-cont">
		<h3 class="subtext">Keyboard shortcuts</h3>
		<div class="list-cont">
			<div class="flex-horiz space-between">
				<div class="flex-horiz gap-sm">
					<Icon icon={Scan} variant="grey" size="lg" />
					<h3 class="bright">Open quick save</h3>
				</div>
				<kbd class="keyboard-shortcut"> ⌘⇧S </kbd>
			</div>
			<div class="flex-horiz space-between">
				<div class="flex-horiz gap-sm">
					<Icon icon={MagnifyingGlass} variant="grey" size="lg" />
					<h3 class="bright">Search inspiration</h3>
				</div>
				<kbd class="keyboard-shortcut"> ⌘F </kbd>
			</div>
		</div>
	</div>
</div>

<style>
	.settings-cont {
		position: absolute;
		top: var(--xxl);
		right: var(--sm);
		width: 316px;
		height: auto;
		display: flex;
		flex-direction: column;
		gap: var(--md);
		background: var(--bg-elevated);
		border: var(--border-thin);
		border-radius: var(--border-md);
		padding: var(--sm);
	}
	.toggle-cont {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--xxs);
	}
	.toggle-selection {
		width: 100%;
		height: auto;
		border-radius: var(--border-md);
	}
	.toggle-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: var(--border-sm);
		display: block;
	}
	.dark {
		border: var(--border);
	}
	.active {
		border: var(--border);
		outline: 3px solid var(--primary);
		outline-offset: -3px;
	}
	.line {
		height: 1px;
		width: 100%;
		background-color: var(--strokeselect);
	}
	.shortcuts-cont {
		display: flex;
		flex-direction: column;
		gap: var(--sm);
	}
	.list-cont {
		display: flex;
		flex-direction: column;
		gap: var(--xxs);
	}
	.space-between {
		justify-content: space-between;
	}
	.keyboard-shortcut {
		padding: var(--xxs);
		border: var(--border-thin);
		border-radius: var(--border-sm);
		font-size: var(--sm);
	}
</style>

<!-- <script>


</script>

<div class="modal-cont">
    <img src="/images/onboarding.png" alt="" class="hero">
    <div class="text-cont">
        <h1 class="welcome bright">Welcome to Stash!</h1>
        <h3 class="subtext centered-text">To start saving inspiration<br>use the keyboard shortcut</h3>
    </div>
    <div class="flex-horiz gap-md">
        <div class="stack">
            <div class="key">
                <h1>⌘</h1>
            </div>
            <div class="shadow">
                <h1 class="none">⌘</h1>
            </div>
        </div>

        <div class="stack">
            <div class="key">
                <h1>shift</h1>
            </div>
            <div class="shadow">
                <h1 class="none">shift</h1>
            </div>
        </div>

        <div class="stack">
            <div class="key">
                <h1>S</h1>
            </div>
            <div class="shadow">
                <h1 class="none">S</h1>
            </div>
        </div>
    </div>
</div>


<style>

    .modal-cont {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 500px;
        transform: translate(-50%, -50%);
        padding: var(--md);
        background-color: var(--bg-elevated);
        border: var(--border);
        border-radius: var(--border-xl);
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .welcome {
        font-size: 32px;
        letter-spacing: -1%; /* might need to change tp px*/
    }

    .hero {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: var(--border-lg);
    }

    .centered-text {
        text-align: center;
    }

    .stack {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
    }
    
    .stack > * {
        grid-column: 1;
        grid-row: 1;
    }

    .key {
        z-index: 1;
        background-color: var(--selected);
        border: var(--border);
        border-radius: var(--border-lg);
        padding: var(--sm) var(--lg);
        transform: translateY(-15%);
    }

    .shadow {
        z-index: 0;
        background-color: var(--bg-shadow);
        border-radius: var(--border-lg);
        padding: var(--sm) var(--lg);
    }

    .none {
        color: transparent;
    }


</style> -->

<script>
	import { listen } from '@tauri-apps/api/event';
	import { onMount, onDestroy } from 'svelte';

	let commandPressed = $state(false);
	let shiftPressed = $state(false);
	let sPressed = $state(false);
	let isVisible = $state(true);

	function handleKeyDown(event) {
		if (event.key === 'Meta' || event.key === 'Control') {
			commandPressed = true;
		}
		if (event.key === 'Shift') {
			shiftPressed = true;
		}
		if (event.key === 's' || event.key === 'S') {
			sPressed = true;
		}

		// Check if all three keys are pressed
		if (commandPressed && shiftPressed && sPressed) {
			isVisible = false;
		}
	}

	function handleKeyUp(event) {
		if (event.key === 'Meta' || event.key === 'Control') {
			commandPressed = false;
		}
		if (event.key === 'Shift') {
			shiftPressed = false;
		}
		if (event.key === 's' || event.key === 'S') {
			sPressed = false;
		}
	}

	async function setupTauriListener() {
		unlisten = await listen('shortcut-triggered', () => {
			// Animate all keys
			commandPressed = true;
			shiftPressed = true;
			sPressed = true;

			// Reset after animation
			setTimeout(() => {
				commandPressed = false;
				shiftPressed = false;
				sPressed = false;
				isVisible = false;
			}, 300);
		});
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		setupTauriListener();
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
		window.removeEventListener('keyup', handleKeyUp);
		if (listen) unlisten()
	});
</script>

{#if isVisible}
	<div class="modal-cont">
		<img src="/images/onboarding.png" alt="" class="hero" />
		<div class="text-cont">
			<h1 class="welcome bright">Welcome to Stash!</h1>
			<h3 class="subtext centered-text">
				To start saving inspiration<br />use the keyboard shortcut
			</h3>
		</div>
		<div class="flex-horiz gap-md">
			<div class="stack">
				<div class="key" class:active-command={commandPressed}>
					<h1 class:extra-bright={commandPressed}>⌘</h1>
				</div>
				<div class="shadow" class:active-command={commandPressed}>
					<h1 class="none">⌘</h1>
				</div>
			</div>
			<div class="stack">
				<div class="key" class:active-shift={shiftPressed}>
					<h1 class:extra-bright={shiftPressed}>shift</h1>
				</div>
				<div class="shadow" class:active-shift={shiftPressed}>
					<h1 class="none">shift</h1>
				</div>
			</div>
			<div class="stack">
				<div class="key" class:active-s={sPressed}>
					<h1 class:extra-bright={sPressed}>S</h1>
				</div>
				<div class="shadow" class:active-s={sPressed}>
					<h1 class="none">S</h1>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-cont {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 500px;
		transform: translate(-50%, -50%);
		padding: var(--md);
		padding-bottom: var(--xxl);
		background-color: var(--bg-elevated);
		border: var(--border);
		border-radius: var(--border-xl);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--xl);
	}

	.text-cont {
		display: flex;
		flex-direction: column;
		gap: var(--xs);
	}

	.welcome {
		font-size: 32px;
		letter-spacing: -1%;
	}

	.hero {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: var(--border-lg);
	}

	.centered-text {
		text-align: center;
	}

	.stack {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
	}

	.stack > * {
		grid-column: 1;
		grid-row: 1;
	}

	.key {
		z-index: 1;
		background-color: var(--selected);
		border: var(--border);
		border-radius: var(--border-lg);
		padding: var(--sm) var(--lg);
		transform: translateY(-15%);
		transition:
			border 0.3s ease,
			transform 0.3s ease;
	}

	.shadow {
		z-index: 0;
		background-color: var(--bg-shadow);
		border-radius: var(--border-lg);
		padding: var(--sm) var(--lg);
		transition: border 0.3s ease;
		border: 1px solid transparent;
	}

	.none {
		color: transparent;
	}

	/* Command key gradient - Blue/Purple */
	.key.active-command,
	.shadow.active-command {
		border: 1px solid transparent;
		background:
			linear-gradient(var(--selected), var(--selected)) padding-box,
			linear-gradient(0deg, #00fffb 0%, #1c45ec 100%) border-box;
	}

	/* Shift key gradient - Pink/Orange */
	.key.active-shift,
	.shadow.active-shift {
		border: 1px solid transparent;
		background:
			linear-gradient(var(--selected), var(--selected)) padding-box,
			linear-gradient(135deg, #385ef3 0%, #aa32ff 100%) border-box;
	}

	/* S key gradient - Green/Cyan */
	.key.active-s,
	.shadow.active-s {
		border: 1px solid transparent;
		background:
			linear-gradient(var(--selected), var(--selected)) padding-box,
			linear-gradient(135deg, #a932ff 0%, #ff5a13 100%) border-box;
	}

	.key.active-command,
	.key.active-shift,
	.key.active-s {
		transform: translateY(-10%);
	}
</style>

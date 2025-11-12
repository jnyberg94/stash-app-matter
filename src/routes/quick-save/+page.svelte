<script>
	import { onMount } from 'svelte';
	import { addImageToIndex } from '$lib/inference/indexImage';
	import { ArrowBendDownLeft, X, Check } from 'phosphor-svelte';
	import Icon from '$lib/components/Icon.svelte';
	import DragDropImage from '$lib/components/DragAndDrop.svelte';

	let caption = $state('');
	let tags = $state('');
	let dragDropComponent = $state(null);
	let currentImageFile = $state(null);
	let showToast = $state(false);

	function handleImageLoad(file) {
		console.log('Image loaded:', file);
		currentImageFile = file;
	}

	async function handleIndex() {
		if (!currentImageFile) return;

		const imageFile = currentImageFile;
		const captionText = caption;
		const tagList = tags
			.split(',')
			.map((t) => t.trim())
			.filter((t) => t);

		await showSuccessAnimation();
		handleDiscard();

		// fire and forget
		indexImage(imageFile, captionText, tagList);
	}

	async function showSuccessAnimation() {
		showToast = true;
		await new Promise((resolve) => setTimeout(resolve, 2000));
		showToast = false;
	}

	async function indexImage(imageFile, caption, tagList) {
		try {
			let imageBuffer;

			if (imageFile.buffer) {
				imageBuffer = new Uint8Array(imageFile.buffer);
			} else {
				const arrayBuffer = await imageFile.arrayBuffer();
				imageBuffer = new Uint8Array(arrayBuffer);
			}

			await dashboard.refresh();

			const indexedResults = await addImageToIndex(imageBuffer, imagePath);
			console.log('Indexed:', indexedResults);
		} catch (error) {
			console.error('Index failed:', error);
			// Show error toast to user
		}
	}

	function handleDiscard() {
		dragDropComponent?.clear();
		currentImageFile = null;
		caption = '';
		tags = '';
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	async function handleKeydown(e) {
		// Enter key - trigger index
		if (e.key === 'Enter' && currentImageFile) {
			e.preventDefault();
			handleIndex();
		}

		// Escape key - discard
		if (e.key === 'Escape') {
			e.preventDefault();
			handleDiscard();

			await new Promise((resolve) => requestAnimationFrame(resolve));

			try {
			} catch (error) {
				console.error('Failed to slide window:', error);
			}
		}
	}
</script>

<div class="quick-save-panel">
	{#if !showToast}
		<DragDropImage bind:this={dragDropComponent} onImageLoad={handleImageLoad} />

		<div class="caption-cont">
			<h3 class="input-title extra-bright">Caption</h3>
			<div class="flex-horiz caption-input-cont shared-input">
				<input bind:value={caption} type="text" placeholder="Caption" class="caption-input" />
				{#if caption}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="clear-cont" onclick={() => (caption = '')}>
						<Icon icon={X} variant="white" size="xs" />
					</div>
				{/if}
			</div>
			<h4 class="subtip">Captions are not mandatory</h4>
		</div>

		<!-- <div class="tags-cont">
			<h3 class="input-title extra-bright">Tags</h3>
			<div class="flex-horiz gap-md tag-input-cont shared-input">
				<input
					bind:value={tags}
					type="text"
					placeholder="design, ui, inspiration"
					class="tags-input"
				/>
			</div>
		</div> -->

		<div class="bottom-cont">
			<div class="line"></div>

			<div class="actions flex-horiz">
				<button class="flex-horiz gap-md discard action-button" onclick={handleDiscard}>
					<h3 class="extra-bright">Discard</h3>
					<kbd class="discard-shortcut">esc</kbd>
				</button>
				<button
					class="flex-horiz gap-md index action-button"
					onclick={handleIndex}
					disabled={!currentImageFile}
				>
					<h3 class="extra-bright">Index Image</h3>
					<div class="icon-border">
						<Icon icon={ArrowBendDownLeft} variant="white" size="xs" />
					</div>
				</button>
			</div>
		</div>
	{:else}
		<div class="success-toast flex-horiz gap-md">
			<div class="check-cont">
				<div class="check-circle">
					<Icon icon={Check} variant="white" size="lg" />
				</div>
			</div>

			<div class="toast-text-cont">
				<h2>Indexing complete</h2>
				<h3>File should be visible on your dashboard</h3>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		background-color: transparent;
	}

	.quick-save-panel {
		width: 100%;
		height: 100vh;
		background: transparent;
		display: flex;
		flex-direction: column;
		gap: var(--lg);
		padding: 20px;
		border: 1px solid var(--white-20);
		border-radius: 20px;
	}

	.shared-input {
		background-color: var(--white-20);
		padding: var(--sm);
		border-radius: var(--border-md);
	}

	/* caption input */

	.caption-cont {
		display: flex;
		flex-direction: column;
		gap: var(--xs);
	}

	.input-title {
		margin-left: var(--xxs);
	}

	.caption-input-cont {
		justify-content: space-between;
	}

	.caption-input {
		color: var(--extra-bright-text);
		font-size: 16px;
		background-color: transparent;
	}

	.caption-input::placeholder {
		color: var(--bright-text);
	}

	.clear-cont {
		border-radius: var(--border-lg);
		background-color: var(--white-35);
		padding: 2px;
	}

	.subtip {
		text-align: center;
	}

	/* lower actions */

	.bottom-cont {
		display: flex;
		flex-direction: column;
		gap: var(--sm);
	}

	.line {
		height: 1px;
		background-color: var(--white-20);
		width: 100vw;
		margin-left: -20px;
	}

	.actions {
		justify-content: space-between;
	}

	.action-button {
		padding: var(--xxs) 6px var(--xxs) 10px;
		border-radius: var(--border-sm);
	}

	.discard {
		background-color: var(--white-20);
	}

	.index {
		background-color: var(--primary);
	}

	.discard-shortcut {
		font-size: 12px;
		padding: 2px;
		border: var(--border-thin);
		border-color: var(--white-20);
		border-radius: 6px;
		color: var(--bright-text);
	}

	.icon-border {
		border: var(--border-thin);
		border-color: var(--extra-bright-text);
		border-radius: 6px;
		padding: 1px 2px 1px 2px;
	}

	/* 
	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		border-bottom: 1px solid #333;
	}

	.panel-header h2 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
	}

	.close-btn {
		background: none;
		border: none;
		color: #888;
		font-size: 32px;
		cursor: pointer;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s;
	}

	.close-btn:hover {
		color: #fff;
	}

	.drop-zone {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px dashed #444;
		border-radius: 12px;
		margin: 20px;
		transition: all 0.3s;
	}

	.drop-zone.dragging {
		border-color: #0066ff;
		background: rgba(0, 102, 255, 0.1);
	}

	.drop-zone-content {
		text-align: center;
		padding: 40px;
	}

	.drop-zone-content svg {
		color: #666;
		margin-bottom: 20px;
	}

	.drop-zone-title {
		font-size: 18px;
		font-weight: 600;
		margin: 0 0 8px 0;
	}

	.drop-zone-subtitle {
		font-size: 14px;
		color: #888;
		margin: 0 0 24px 0;
	}

	.browse-btn {
		background: #0066ff;
		color: white;
		border: none;
		padding: 10px 24px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.browse-btn:hover {
		background: #0052cc;
	}

	.preview-container {
		flex: 1;
		padding: 20px;
		overflow-y: auto;
	}

	.image-preview {
		position: relative;
		border-radius: 12px;
		overflow: hidden;
		margin-bottom: 24px;
		background: #000;
	}

	.image-preview img {
		width: 100%;
		height: auto;
		display: block;
	}

	.remove-image {
		position: absolute;
		top: 12px;
		right: 12px;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(10px);
		border: none;
		color: white;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		font-size: 24px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
	}

	.remove-image:hover {
		background: rgba(255, 0, 0, 0.8);
	}

	.metadata-section {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.ai-suggestion {
		background: #252525;
		border-radius: 10px;
		padding: 16px;
	}

	.label-with-icon {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		font-weight: 600;
		color: #aaa;
		margin-bottom: 12px;
	}

	.shimmer-icon {
		font-size: 16px;
		animation: shimmer 2s infinite;
	}

	@keyframes shimmer {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.skeleton-title {
		padding: 12px;
	}

	.skeleton-bar {
		height: 20px;
		background: linear-gradient(90deg, #333 25%, #444 50%, #333 75%);
		background-size: 200% 100%;
		border-radius: 4px;
		animation: loading 1.5s infinite;
	}

	@keyframes loading {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.suggestion-box {
		background: #2a2a2a;
		border-radius: 8px;
		padding: 12px;
	}

	.suggestion-box.just-generated {
		animation: fadeInShimmer 0.6s ease-out;
	}

	@keyframes fadeInShimmer {
		0% {
			opacity: 0;
			transform: translateY(-4px);
		}
		50% {
			opacity: 0.5;
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.suggested-title {
		margin: 0 0 12px 0;
		font-size: 15px;
		line-height: 1.5;
	}

	.suggestion-actions {
		display: flex;
		gap: 8px;
	}

	.use-btn,
	.regenerate-btn {
		border: none;
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.use-btn {
		background: #0066ff;
		color: white;
		flex: 1;
	}

	.use-btn:hover {
		background: #0052cc;
	}

	.regenerate-btn {
		background: #333;
		color: #aaa;
	}

	.regenerate-btn:hover {
		background: #3a3a3a;
		color: #fff;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.input-group label {
		font-size: 13px;
		font-weight: 600;
		color: #aaa;
	}

	.title-input,
	.tags-input {
		background: #252525;
		border: 1px solid #333;
		color: #fff;
		padding: 10px 12px;
		border-radius: 8px;
		font-size: 14px;
		transition: border-color 0.2s;
	}

	.title-input:focus,
	.tags-input:focus {
		outline: none;
		border-color: #0066ff;
	}

	.title-input::placeholder,
	.tags-input::placeholder {
		color: #666;
	}

	.save-btn {
		background: #00cc66;
		color: white;
		border: none;
		padding: 14px;
		border-radius: 8px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		margin-top: 8px;
	}

	.save-btn:hover:not(:disabled) {
		background: #00b359;
	}

	.save-btn:disabled {
		background: #333;
		color: #666;
		cursor: not-allowed;
	} */
</style>

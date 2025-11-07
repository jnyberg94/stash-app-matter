<!-- <script>
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { addImageToIndex } from '$lib/inference/indexImage';
	import { FileArrowUp, Plus, ArrowBendDownLeft, X } from 'phosphor-svelte';
	import Icon from '$lib/Icon.svelte';

	let imagePreview = $state(null);
	let imageFile = $state(null);
	let imageBuffer = $state(null);
	let aiSuggestedTitle = $state('');
	let userTitle = $state('');
	let tags = $state('');
	let isGeneratingTitle = $state(false);
	let isDragging = $state(false);
	let titleGenerated = $state(false);
	let fileInput = $state(null);
	let caption = $state('');

	onMount(() => {
		window.addEventListener('paste', handlePaste);
		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('paste', handlePaste);
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	function handleKeydown(e) {
		if (e.key === 'Escape' && imagePreview) {
			clearImage();
		}
		if ((e.metaKey || e.ctrlKey) && e.key === 's' && imagePreview) {
			e.preventDefault();
			handleSave();
		}
	}

	async function handlePaste(e) {
		const items = e.clipboardData?.items;
		if (!items) return;
		for (let item of items) {
			if (item.type.startsWith('image/')) {
				e.preventDefault();
				const file = item.getAsFile();
				if (file) {
					await loadImage(file);
				}
				break;
			}
		}
	}

	function handleDragOver(e) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e) {
		e.preventDefault();
		isDragging = false;
	}

	async function handleDrop(e) {
		e.preventDefault();
		isDragging = false;
		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			const file = files[0];
			if (file.type.startsWith('image/')) {
				await loadImage(file);
			}
		}
	}

	function handleFileSelect(e) {
		const file = e.target.files?.[0];
		if (file) {
			loadImage(file);
		}
	}

	async function loadImage(file) {
		try {
			imageFile = file;

			// Create preview URL
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target.result;
			};
			reader.readAsDataURL(file);

			// Convert to buffer for processing
			const arrayBuffer = await file.arrayBuffer();
			const imageBuffer = new Uint8Array(arrayBuffer);

			const finalTitle = userTitle.trim() || aiSuggestedTitle || 'Untitled';

			const tagList = tags
				.split(',')
				.map((t) => t.trim())
				.filter((t) => t);

			// ======== this stuff is NEW
			const imagePath = await invoke('save_inspiration_image', {
				imageBuffer: Array.from(imageBuffer),
				title: finalTitle,
				tags: tagList
			});

			const indexedResults = await addImageToIndex(imageBuffer, imagePath);

			console.log('indexedResults', indexedResults);
		} catch (error) {
			console.error('Index failed:', error);
			alert(`Index failed: ${error.message}`);
		}
	}

	function clearImage() {
		imagePreview = null;
		imageFile = null;
		imageBuffer = null;
		aiSuggestedTitle = '';
		userTitle = '';
		tags = '';
		isGeneratingTitle = false;
		titleGenerated = false;
		if (fileInput) fileInput.value = '';
	}
</script>

<div class="quick-save-panel">
	<!-- {#if !imagePreview}
		<div
			class="drop-zone"
			class:dragging={isDragging}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
		>
			<div class="drop-zone-content">
				<svg
					width="64"
					height="64"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
					<circle cx="8.5" cy="8.5" r="1.5" />
					<polyline points="21 15 16 10 5 21" />
				</svg>
				<p class="drop-zone-title">Drag & drop an image</p>
				<p class="drop-zone-subtitle">or paste from clipboard (Cmd+V)</p>
				<button class="browse-btn" onclick={() => fileInput.click()}> Browse Files </button>
				<input
					type="file"
					accept="image/*"
					bind:this={fileInput}
					onchange={handleFileSelect}
					style="display: none;"
				/>
			</div>
		</div>
	{:else}
		<div class="preview-container">
			<div class="image-preview">
				<img src={imagePreview} alt="Preview" />
				<button class="remove-image" onclick={clearImage}>×</button>
			</div>

			<div class="metadata-section">
				<div class="ai-suggestion">
					
					<label class="label-with-icon">
						<span class="shimmer-icon">✨</span>
						AI Suggestion:
					</label>

					{#if isGeneratingTitle}
						<div class="skeleton-title">
							<div class="skeleton-bar"></div>
						</div>
					{:else if aiSuggestedTitle}
						<div class="suggestion-box" class:just-generated={titleGenerated}>
							<p class="suggested-title">{aiSuggestedTitle}</p>
							<div class="suggestion-actions">
								<button class="use-btn" onclick={useSuggestedTitle}> Use This </button>
								<button class="regenerate-btn" onclick={regenerateTitle}> Regenerate </button>
							</div>
						</div>
					{/if}
				</div>

				<div class="input-group">
					<label for="user-title">Your Title (optional):</label>
					<input
						id="user-title"
						type="text"
						bind:value={userTitle}
						placeholder="Leave blank to use AI suggestion"
						class="title-input"
					/>
				</div>

				<div class="input-group">
					<label for="tags">Tags:</label>
					<input
						id="tags"
						type="text"
						bind:value={tags}
						placeholder="design, inspiration, ui (comma-separated)"
						class="tags-input"
					/>
				</div>

				<button class="save-btn" onclick={handleSave} disabled={isGeneratingTitle}>
					{#if isGeneratingTitle}
						Generating title...
					{:else}
						Save Inspiration
					{/if}
				</button>
			</div>
		</div>
	{/if}

	{#if !imagePreview}
		
		<div class="drop-cont">
			<div class="icon-cont">
				<Icon icon={FileArrowUp} variant="white" size="xl" />
			</div>
			<div class="text-cont">
				<div class="flex-horiz gap-md">
					<h3 class="choose-file">Choose a file</h3>
					<h3 class="bright">Or</h3>
					<h3 class="extra-bright">Drag and drop</h3>
				</div>
				<h4 class="bright">Images over 512px help with searchability</h4>
			</div>
		</div>
	{:else}
		<div class="drop-cont">
			<img src={imagePreview} alt="" class="display-image">
		</div>
	{/if}

	<div class="caption-cont">
		<h3 class="input-title extra-bright">Caption</h3>
		<div class="flex-horiz caption-input-cont shared-input">
			<input bind:value={caption} type="text" placeholder="Caption" class="caption-input" />
			{#if caption}
				<div class="clear-cont">
					<Icon icon={X} variant="white" size="xs" />
				</div>
			{/if}
		</div>
		<h4 class="subtip">Captions are not mandatory</h4>
	</div>

	<div class="tags-cont">
		<h3 class="input-title extra-bright">Tags</h3>
		<div class="flex-horiz gap-md tag-input-cont shared-input"></div>
	</div>

	<div class="bottom-cont">
		<div class="line"></div>

		<div class="actions flex-horiz">
			<button class="flex-horiz gap-md discard action-button">
				<h3 class="extra-bright">Discard</h3>
				<kbd class="discard-shortcut">esc</kbd>
			</button>
			<button class="flex-horiz gap-md index action-button">
				<h3 class="extra-bright">Index Image</h3>
				<div class="icon-border">
					<Icon icon={ArrowBendDownLeft} variant="white" size="xs" />
				</div>
			</button>
		</div>
	</div>
</div> -->

<!-- working version
<script>
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { getCurrentWebview } from '@tauri-apps/api/webview';
	import { addImageToIndex } from '$lib/inference/indexImage';
	import { FileArrowUp, ArrowBendDownLeft, X } from 'phosphor-svelte';
	import Icon from '$lib/Icon.svelte';
	import DragAndDrop from '$lib/DragAndDrop.svelte';

	let imagePreview = $state(null);
	let imageFile = $state(null);
	let caption = $state('');
	let tags = $state('');
	let isDragging = $state(false);
	let fileInput = $state(null);

	onMount(() => {
		window.addEventListener('paste', handlePaste);
		window.addEventListener('keydown', handleKeydown);
		
		// Set up Tauri drag-drop listener
		let unlisten;
		const setupDragDrop = async () => {
			unlisten = await getCurrentWebview().onDragDropEvent((event) => {
				console.log('Drag drop event:', event.payload.type);
				
				if (event.payload.type === 'over') {
					isDragging = true;
				} else if (event.payload.type === 'leave' || event.payload.type === 'cancel') {
					isDragging = false;
				} else if (event.payload.type === 'drop') {
					isDragging = false;
					const paths = event.payload.paths;
					console.log('Dropped files:', paths);
					
					if (paths && paths.length > 0) {
						loadImageFromPath(paths[0]);
					}
				}
			});
		};
		setupDragDrop();
		
		return () => {
			window.removeEventListener('paste', handlePaste);
			window.removeEventListener('keydown', handleKeydown);
			if (unlisten) unlisten();
		};
	});

	function handleKeydown(e) {
		if (e.key === 'Escape' && imagePreview) {
			clearImage();
		}
		if ((e.metaKey || e.ctrlKey) && e.key === 's' && imagePreview) {
			e.preventDefault();
			handleIndex();
		}
	}

	async function handlePaste(e) {
		const items = e.clipboardData?.items;
		if (!items) return;
		
		for (let item of items) {
			if (item.type.startsWith('image/')) {
				e.preventDefault();
				const file = item.getAsFile();
				if (file) await loadImage(file);
				break;
			}
		}
	}

	function handleDragOver(e) {
		console.log('dragover detected');
		e.preventDefault();
		e.stopPropagation();
		isDragging = true;
	}

	function handleDragEnter(e) {
		console.log('dragenter detected');
		e.preventDefault();
		e.stopPropagation();
		isDragging = true;
	}

	function handleDragLeave(e) {
		console.log('dragleave detected');
		e.preventDefault();
		e.stopPropagation();
		// Check if we're actually leaving the drop zone, not just entering a child
		if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget)) {
			isDragging = false;
		}
	}

	async function handleDrop(e) {
		console.log('drop detected', e.dataTransfer?.files);
		e.preventDefault();
		e.stopPropagation();
		isDragging = false;
		
		const files = e.dataTransfer?.files;
		if (files?.length > 0 && files[0].type.startsWith('image/')) {
			await loadImage(files[0]);
		}
	}

	function handleClick(e) {
		if (!isDragging) {
			triggerFileInput();
		}
	}

	function handleFileSelect(e) {
		const file = e.target.files?.[0];
		if (file) loadImage(file);
	}

	function triggerFileInput() {
		fileInput?.click();
	}

	async function loadImageFromPath(path) {
		try {
			console.log('Loading image from path:', path);
			// Read the file using Tauri's fs API
			const imageBuffer = await invoke('read_file', { path });
			
			// Create a blob URL for preview
			const blob = new Blob([new Uint8Array(imageBuffer)]);
			imagePreview = URL.createObjectURL(blob);
			
			// Store for later indexing
			imageFile = { path, buffer: imageBuffer };
		} catch (error) {
			console.error('Failed to load image from path:', error);
			alert(`Failed to load image: ${error.message}`);
		}
	}

	async function loadImage(file) {
		try {
			imageFile = file;

			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target.result;
			};
			reader.readAsDataURL(file);
		} catch (error) {
			console.error('Failed to load image:', error);
			alert(`Failed to load image: ${error.message}`);
		}
	}

	async function handleIndex() {
		if (!imageFile) return;

		try {
			let imageBuffer;
			
			// Handle both File objects (from paste/browse) and path objects (from drag)
			if (imageFile.buffer) {
				// From Tauri drag-drop
				imageBuffer = new Uint8Array(imageFile.buffer);
			} else {
				// From browser File API
				const arrayBuffer = await imageFile.arrayBuffer();
				imageBuffer = new Uint8Array(arrayBuffer);
			}

			const tagList = tags
				.split(',')
				.map((t) => t.trim())
				.filter((t) => t);

			const imagePath = await invoke('save_inspiration_image', {
				imageBuffer: Array.from(imageBuffer),
				title: caption || 'Untitled',
				tags: tagList
			});

			const indexedResults = await addImageToIndex(imageBuffer, imagePath);
			console.log('Indexed:', indexedResults);
			
			clearImage();
		} catch (error) {
			console.error('Index failed:', error);
			alert(`Index failed: ${error.message}`);
		}
	}

	function clearImage() {
		imagePreview = null;
		imageFile = null;
		caption = '';
		tags = '';
		if (fileInput) fileInput.value = '';
	}
</script>

<div class="quick-save-panel">
	{#if !imagePreview}

		<div 
			class="drop-cont" 
			class:dragging={isDragging}
			onclick={handleClick}
		>
			<div class="icon-cont">
				<Icon icon={FileArrowUp} variant="white" size="xl" />
			</div>
			<div class="text-cont">
				<div class="flex-horiz gap-md">
					<h3 class="choose-file">Choose a file</h3>
					<h3 class="bright">Or</h3>
					<h3 class="extra-bright">Drag and drop</h3>
				</div>
				<h4 class="bright">Images over 512px help with searchability</h4>
			</div>
		</div>
	{:else}
		<div class="drop-cont">
			<img src={imagePreview} alt="" class="display-image">
		</div>
	{/if}

	<input
		type="file"
		accept="image/*"
		bind:this={fileInput}
		onchange={handleFileSelect}
		style="display: none;"
	/>

	<div class="caption-cont">
		<h3 class="input-title extra-bright">Caption</h3>
		<div class="flex-horiz caption-input-cont shared-input">
			<input bind:value={caption} type="text" placeholder="Caption" class="caption-input" />
			{#if caption}

				<div class="clear-cont" onclick={() => caption = ''}>
					<Icon icon={X} variant="white" size="xs" />
				</div>
			{/if}
		</div>
		<h4 class="subtip">Captions are not mandatory</h4>
	</div>

	<div class="tags-cont">
		<h3 class="input-title extra-bright">Tags</h3>
		<div class="flex-horiz gap-md tag-input-cont shared-input">
			<input bind:value={tags} type="text" placeholder="design, ui, inspiration" class="tags-input" />
		</div>
	</div>

	<div class="bottom-cont">
		<div class="line"></div>

		<div class="actions flex-horiz">
			<button class="flex-horiz gap-md discard action-button" onclick={clearImage}>
				<h3 class="extra-bright">Discard</h3>
				<kbd class="discard-shortcut">esc</kbd>
			</button>
			<button class="flex-horiz gap-md index action-button" onclick={handleIndex} disabled={!imagePreview}>
				<h3 class="extra-bright">Index Image</h3>
				<div class="icon-border">
					<Icon icon={ArrowBendDownLeft} variant="white" size="xs" />
				</div>
			</button>
		</div>
	</div>
</div> -->

<script>
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
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
		await invoke('collapse_to_toast');
		showToast = true;
		await new Promise((resolve) => setTimeout(resolve, 2000));
		await invoke('slide_window', { show: false });
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

			const imagePath = await invoke('save_inspiration_image', {
				imageBuffer: Array.from(imageBuffer),
				title: caption || 'Untitled',
				tags: tagList
			});

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
				await invoke('slide_window', { show: false });
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

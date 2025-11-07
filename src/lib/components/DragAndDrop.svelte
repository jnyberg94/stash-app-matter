<script>
	import { onMount } from 'svelte';
	import { getCurrentWebview } from '@tauri-apps/api/webview';
	import { invoke } from '@tauri-apps/api/core';
	import { FileArrowUp } from 'phosphor-svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { onImageLoad = (file) => {} } = $props();

	let imagePreview = $state(null);
	let imageFile = $state(null);
	let isDragging = $state(false);
	let fileInput = $state(null);

	onMount(() => {
		window.addEventListener('paste', handlePaste);
		window.addEventListener('keydown', handleKeydown);

		// Set up Tauri drag-drop listener
		let unlisten;
		const setupDragDrop = async () => {
			unlisten = await getCurrentWebview().onDragDropEvent(async (event) => {
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

						// Focus the window after drop
						try {
							await invoke('focus_window');
							console.log('webview focus set')
						} catch (error) {
							console.error('Failed to focus window:', error);
						}
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

			// Store for later use
			imageFile = { path, buffer: imageBuffer };

			// Notify parent component
			onImageLoad(imageFile);
		} catch (error) {
			console.error('Failed to load image from path:', error);
			alert(`Failed to load image: ${error.message}`);
		}
	}

	async function loadImage(file) {
		try {
			// Create preview URL
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target.result;
			};
			reader.readAsDataURL(file);

			// Store file
			imageFile = file;

			// Notify parent component
			onImageLoad(file);
		} catch (error) {
			console.error('Failed to load image:', error);
			alert(`Failed to load image: ${error.message}`);
		}
	}

	function clearImage() {
		if (imagePreview && imagePreview.startsWith('blob:')) {
			URL.revokeObjectURL(imagePreview);
		}
		imagePreview = null;
		imageFile = null;
		if (fileInput) fileInput.value = '';
	}

	function handleClick() {
		if (!isDragging) {
			triggerFileInput();
		}
	}

	export function clear() {
		clearImage();
	}

	export function getFile() {
		return imageFile;
	}

	export function getPreview() {
		return imagePreview;
	}
</script>

{#if !imagePreview}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="drop-cont" class:dragging={isDragging} onclick={handleClick}>
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
	<div class="drop-cont dropped">
		<img src={imagePreview} alt="" class="display-image" />
	</div>
{/if}

<input
	type="file"
	accept="image/*"
	bind:this={fileInput}
	onchange={handleFileSelect}
	style="display: none;"
/>

<style>
	.drop-cont {
		width: 100%;
		height: 220px;
		background-color: var(--white-20);
		border-radius: var(--border-lg);
		border: 1px var(--primary-text) dashed;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--md);
	}

	.dragging {
		border: 1px var(--primary) dashed;
	}

	.dropped {
		border: none;
	}

	.icon-cont {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: var(--sm);
		background-color: var(--white-35);
		border: 1px solid var(--white-35);
		border-radius: var(--border-md);
	}

	.text-cont {
		display: flex;
		flex-direction: column;
		gap: var(--xxs);
	}

	.choose-file {
		color: #859eff;
		text-decoration: underline;
	}

	.display-image {
		object-fit: cover;
		height: 100%;
		width: 100%;
		border-radius: var(--border-lg);
	}
</style>

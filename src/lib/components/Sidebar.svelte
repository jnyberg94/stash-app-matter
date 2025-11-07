<script>
	import { convertFileSrc, invoke } from '@tauri-apps/api/core';
	import { searchImagesWithImage } from '../inference/searchImages';
	import { writeImage } from '@tauri-apps/plugin-clipboard-manager';
	import { readFile, remove } from '@tauri-apps/plugin-fs';
	import { enrichResults } from '../inference/enrichResults';
	import { handleDragStart } from '$lib/utils/dragImage';
	import { dashboard } from '$lib/utils/dashboardStore';
	import {
		SelectionBackground,
		ListMagnifyingGlass,
		Trash,
		Plus,
		DotsThreeVertical
	} from 'phosphor-svelte';
	import Icon from './Icon.svelte';
	import ImagePreview from './ImagePreview.svelte';

	let { sidebarData, onClose } = $props();

	let assetUrl = $state('');
	let naturalWidth = $state(0);
	let naturalHeight = $state(0);
	let imgElement = $state(null);
	let similarImages = $state(null);
	let isVisible = $state(false);

	function handleImageLoad() {
		if (imgElement) {
			naturalWidth = imgElement.naturalWidth;
			naturalHeight = imgElement.naturalHeight;
		}
	}

	$effect(() => {
		if (sidebarData) {
			setTimeout(() => (isVisible = true), 10);
		}
	});

	function handleClose() {
		isVisible = false;
		setTimeout(onClose, 300);
	}

	// ======== sidebar logic ======== //

	function sidebarInit(imagePath, title, date, tags = null) {
		sidebarData = { imagePath, title, date, tags };
	}

	$effect(() => {
		if (sidebarData?.imagePath) {
			assetUrl = convertFileSrc(sidebarData.imagePath);
		}
		console.log('isvisible', isVisible);
	});

	//search similar images
	$effect(async () => {
		if (sidebarData?.imagePath) {
			let rawResults = await searchImagesWithImage(sidebarData.imagePath);
			console.log('rawResults', rawResults);
			similarImages = await enrichResults(rawResults);
			console.log('image results', similarImages);
		}
	});

	// ======== Action Functions ======== //

	async function copyImage() {
		try {
			await invoke('copy_image_to_clipboard', { path: sidebarData.imagePath });
			console.log('Image copied to clipboard');
		} catch (error) {
			console.error('Failed to copy image:', error);
			alert(`Failed to copy image: ${error}`);
		}
	}

	async function revealInFinder() {
		try {
			await invoke('show_in_folder', { path: sidebarData.imagePath });
		} catch (error) {
			console.error('Failed to reveal in finder:', error);
			alert(`Failed to reveal in finder: ${error}`);
		}
	}

	async function deleteImage() {
		try {
			await dashboard.deleteImage(sidebarData.imagePath);
			await remove(sidebarData.imagePath);
			console.log('Image deleted');
			await handleClose();

		} catch (error) {
			console.error('Failed to delete image:', error);
			alert(`Failed to delete image: ${error}`);
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="sidebar-overlay" class:visible={isVisible} onclick={handleClose}></div>

<div class="sidebar-cont" class:visible={isVisible}>
	<div class="sidebar-inner">
		<div class="line"></div>
		<div class="main">
			<img
				bind:this={imgElement}
				class="image"
				src={assetUrl}
				alt=""
				onload={handleImageLoad}
				draggable="true"
				ondragstart={() => handleDragStart(event, sidebarData.imagePath, assetUrl)}
			/>
			<div class="text-cont">
				<div class="flex-horiz gap-lg">
					<h3 class="date">October 18, 2025</h3>
					<h3 class="dimensions">{naturalWidth}×{naturalHeight}</h3>
				</div>
				<h1 class="extra-bright title">{sidebarData?.title || ''}</h1>
			</div>
		</div>

		<div class="similar-images-cont">
			{#if similarImages}
				<h2 class="similar-text">Similar Images</h2>
			{/if}

			<div class="similar-images">
				{#each similarImages as item (item.id)}
					<ImagePreview
						title={item.title}
						imageUrl={item.path}
						handleClick={() => sidebarInit(item.path, item.title, item.created_at, item.tags)}
						isSmall={true}
					/>
				{/each}
			</div>
		</div>

		<div class="action-bar-cont bg-blur flex-horiz gap-lg">
			<button class="action flex-horiz gap-sm" onclick={copyImage}>
				<Icon icon={SelectionBackground} variant="white" size="sm" />
				<h3 class="extra-bright">Copy Image</h3>
			</button>
			<button class="action flex-horiz gap-sm" onclick={revealInFinder}>
				<Icon icon={ListMagnifyingGlass} variant="white" size="sm" />
				<h3 class="extra-bright">Reveal in Finder</h3>
			</button>
			<button class="action flex-horiz gap-sm" onclick={deleteImage}>
				<Icon icon={Trash} variant="red" size="sm" />
				<h3 class="red">Delete</h3>
			</button>
		</div>
	</div>
</div>

<style>
	.sidebar-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0);
		z-index: 2;
		transition: background 0.3s ease;
		pointer-events: none;
	}

	.sidebar-overlay.visible {
		background: rgba(0, 0, 0, 0.4);
		pointer-events: auto;
	}

	.sidebar-cont {
		position: fixed;
		z-index: 3;
		top: 0;
		right: 0;
		width: 460px;
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background-color: var(--bg-base);
		border-left: var(--border);
		transform: translateX(100%);
		transition: transform 0.3s ease;
	}

	.sidebar-cont.visible {
		transform: translateX(0);
	}

	.sidebar-inner {
		position: relative;
		overflow-y: scroll;
		overflow-x: hidden;
		overscroll-behavior: none;
		padding: 20px 20px var(--md) 20px;
		display: flex;
		flex-direction: column;
		gap: var(--sm);
	}

	.main {
		display: flex;
		flex-direction: column;
		gap: var(--md);
		padding-bottom: var(--xxl);
	}

	.text-cont {
		display: flex;
		flex-direction: column;
		gap: var(--xxs);
		padding-left: var(--xs);
	}

	.image {
		width: 100%;
		border-radius: var(--border-lg);
		border: var(--border);
	}

	.line {
		position: absolute;
		top: 0;
		left: 3px;
		background-color: var(--strokeselect);
		width: 1px;
		height: 100%;
	}

	.similar-images-cont {
		display: flex;
		flex-direction: column;
		gap: var(--xs);
	}

	.similar-images {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(204px, 1fr));
		gap: var(--xs);
	}

	.similar-text {
		padding-left: var(--xs);
	}

	/* action bar */

	.action-bar-cont {
		position: sticky;
		width: 430px;
		justify-content: space-between;
		bottom: 0;
		padding: var(--xs) var(--sm);
		border-radius: var(--border-md);
		align-self: center;
		margin-top: auto;
	}

	.action {
		padding: var(--xxs) 6px;
		background-color: transparent;
		transition: background-color 0.3s;
		border-radius: var(--border-sm);
	}

	.action:hover {
		background-color: var(--btn-hover);
	}

	.red {
		color: var(--warning);
	}
</style>

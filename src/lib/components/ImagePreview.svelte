<script>
	import { onMount } from 'svelte';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { readFile } from '@tauri-apps/plugin-fs';
	import { handleDragStart } from '$lib/utils/dragImage';

	let { imageUrl = '', title = '', handleClick, isSmall = false } = $props();
	const maxTitleLength = 28;

	let imgElement;
	let naturalWidth = $state(0);
	let naturalHeight = $state(0);
	let truncatedTitle = $state('');
	let assetUrl = $state('');
	let isDragging = $state(false);

	$effect(() => {
		truncatedTitle =
			title.length > maxTitleLength ? title.substring(0, maxTitleLength) + '...' : title;
		assetUrl = convertFileSrc(imageUrl);
	});

	function handleImageLoad() {
		if (imgElement) {
			naturalWidth = imgElement.naturalWidth;
			naturalHeight = imgElement.naturalHeight;
		}
	}

</script>

<button onclick={handleClick} class="image-preview-card" class:small={isSmall}>
	<div class="image-cont" class:small-img={isSmall}>
		<img
			bind:this={imgElement}
			src={assetUrl}
			alt={title}
			onload={handleImageLoad}
			draggable="true"
			ondragstart={()=> handleDragStart(event, imageUrl, assetUrl)}
			class:dragging={isDragging}
			class="preview-image"
		/>
	</div>

	<div class="details-cont">
		<h3 class="title">{truncatedTitle}</h3>
		<h4 class="dimensions">{naturalWidth}×{naturalHeight}</h4>
	</div>
</button>

<style>
	.image-preview-card {
		display: flex;
		flex-direction: column;
		gap: var(--xs);
		width: 230px;
		padding: var(--xxs);
		border-radius: 15px;
		background-color: transparent;
		border-radius: calc(var(--border-md) + 3px);
		transition: background-color 0.5s;
	}

	.small {
		width: 204px;
	}

	.image-preview-card:hover {
		background-color: var(--selected);
	}

	.image-cont {
		width: 100%;
		height: 180px;
		border-radius: var(--border-md);
		overflow: hidden;
		position: relative;
	}

	.small-img {
		height: 155px;
	}

	.preview-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.details-cont {
		padding: 0px 6px;
	}

	.title {
		text-align: left;
		margin-bottom: 2px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dimensions {
		color: var(--subtext);
	}
</style>

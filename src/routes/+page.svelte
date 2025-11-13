<script>
	import { onMount, onDestroy } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { browser } from '$app/environment';
	import { searchImagesWithText } from '$lib/inference/searchImages';
	import { enrichResults } from '$lib/inference/enrichResults';
	import { dashboard } from '$lib/utils/dashboardStore';
	import {
		Gear,
		DotsThreeVertical,
		Plus,
		MagnifyingGlass,
		X,
		SelectionBackground,
		ListMagnifyingGlass,
		Trash
	} from 'phosphor-svelte';
	import Icon from '$lib/components/Icon.svelte';
	import ImagePreview from '$lib/components/ImagePreview.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Settings from '$lib/components/Settings.svelte';
	import OnboardingModal from '$lib/components/onboardingModal.svelte';

	//let items = $state([]);
	let currentSide = $state('right');
	let isChangingSide = $state(false);
	let searchQuery = $state('');
	let searchInput = $state();
	let isSearching = $state(false);
	let searchResults = $state(null);
	let sidebarData = $state(null);
	let modelsLoaded = $state(false);
	let loadingModels = $state(true);
	let creatingTag = $state(false);
	let menuOpen = $state(false);
	let settingsContainerRef = $state();
	let searchContainerRef = $state();
	let searchCollapsed = $state(true);

	// ========= helper functions ========= //

	// function loadItemsFromLocal() {
	// 	if (browser) {
	// 		const stored = localStorage.getItem('clipboard_items');
	// 		return stored ? JSON.parse(stored) : [];
	// 	}
	// 	return [];
	// }

	// function saveItemToLocal(item) {
	// 	if (browser) {
	// 		const current = loadItemsFromLocal();
	// 		const updated = [item, ...current];
	// 		localStorage.setItem('clipboard_items', JSON.stringify(updated));
	// 	}
	// }

	// async function switchSide(newSide) {
	// 	if (isChangingSide) return;

	// 	try {
	// 		isChangingSide = true;
	// 		await invoke('set_quick_save_side', { side: newSide });
	// 		currentSide = newSide;
	// 		console.log('Side changed to:', newSide);
	// 	} catch (error) {
	// 		console.error('Failed to set side:', error);
	// 		alert(`Failed to switch side: ${error}`);
	// 	} finally {
	// 		isChangingSide = false;
	// 	}
	// }

	function handleClickOutside(event) {
		if (menuOpen && settingsContainerRef && !settingsContainerRef.contains(event.target)) {
			menuOpen = false;
		}

		if (!searchCollapsed && searchContainerRef && !searchContainerRef.contains(event.target)) {
            searchCollapsed = true;
        }
	}

	// ======== sidebar logic ======== //

	function sidebarInit(imagePath, title, date, tags = null) {
		sidebarData = { imagePath, title, date, tags };
	}

	// ======== search functions ======= //

	async function handleSearch() {
		if (!searchQuery.trim() || isSearching) return;

		try {
			isSearching = true;
			console.log('search called!');
			let rawResults = await searchImagesWithText(searchQuery);
			console.log('rawResults', rawResults);
			searchResults = await enrichResults(rawResults);

			console.log('searchQuery', searchQuery, 'searchResults', searchResults);
		} catch (error) {
			console.error('Search failed:', error);
			alert(`Search failed: ${error.message}`);
		} finally {
			isSearching = false;
		}
	}

	function handleSearchKeydown(e) {
		if (e.key === 'Enter') {
			handleSearch();
		}
	}

	function focusSearch() {
		if (searchCollapsed) {
			searchCollapsed = !searchCollapsed;
			searchInput?.focus();
		}
	}

	onMount(async () => {
		//items = loadItemsFromLocal();
		await dashboard.loadImages();
		//console.log('currentStash', currentStash)
		console.log('dashboard', $dashboard.periods.length);
		//allImageCount = currentStash.reduce((sum, period) => sum + period.items.length, 0);
		//await loadCurrentSide();
	});
</script>

<div class="titlebar" data-tauri-drag-region>
	<!-- <div class="flex-horiz gap-sm">
		<h3>My tags:</h3>
		<div class="add-tag">
			<Icon icon={Plus} variant="grey" size="sm" />
		</div>
		{#if creatingTag}
			<input type="text" class="tag-input" />
		{/if}
	</div> -->
	<div class="flex-horiz gap-md">
		<button class="flex-horiz gap-sm filter" onclick={() => dashboard.toggleSortOrder()}>
			<img 
				src="/icons/arrow-up.svg" 
				alt="Sort" 
				class="arrow-icon"
				class:rotate={$dashboard.sortOrder === 'oldest'}
			/>
			<h3>Date</h3>
		</button>
	</div>

	<div class="settings-menu-cont" bind:this={settingsContainerRef}>
		<button class="settings-cont" onclick={() => (menuOpen = !menuOpen)} class:active={menuOpen}>
			<Icon icon={Gear} variant="grey" size="md" />
		</button>
		{#if menuOpen}
			<Settings />
		{/if}
	</div>
</div>

<div class="main">
	{#if searchResults}
		<div class="flex-horiz gap-md display-cont">
			{#each searchResults as item (item.id)}
				<ImagePreview
					title={item.title}
					imageUrl={item.path}
					handleClick={() => sidebarInit(item.path, item.title, item.created_at, item.tags)}
				/>
			{/each}
		</div>
	{:else if $dashboard.loading}
		<h3>Loading...</h3>
	{:else if $dashboard.periods.length > 0}
		{#each $dashboard.periods as dateRange (dateRange.label)}
			<div class="range-cont">
				<h2 class="label">{dateRange.label}</h2>
				<div class="flex-horiz gap-md display-cont">
					{#each dateRange.items as item (item.created_at)}
						<ImagePreview
							title={item.title}
							imageUrl={item.path}
							handleClick={() => sidebarInit(item.path, item.title, item.created_at, item.tags)}
						/>
					{/each}
				</div>
			</div>
		{/each}
	{:else}
		<OnboardingModal />
	{/if}
</div>

{#if sidebarData}
	<Sidebar {sidebarData} onClose={() => (sidebarData = null)} />
{/if}

<button
	bind:this={searchContainerRef}
	class="search-cont flex-horiz bg-blur"
	class:collapsed={searchCollapsed}
	onclick={focusSearch}
>
	<div class="flex-horiz gap-md">
		<Icon icon={MagnifyingGlass} variant="white" size="xl" />
		<input
			bind:value={searchQuery}
			bind:this={searchInput}
			onkeydown={handleSearchKeydown}
			type="text"
			placeholder="Search for anything..."
			class="search-input"
			class:collapsed={searchCollapsed}
		/>
	</div>

	<div class="flex-horiz gap-md">
		<div class="count-cont">
			<h4 class="bright">{$dashboard.allImageCount}</h4>
		</div>

		<kbd class="keyboard-shortcut"> ⌘F </kbd>
	</div>
</button>

<svelte:window
	on:keydown={(e) => {
		if (e.key === 'Escape') {
			window.__TAURI__?.window?.getCurrent?.()?.hide?.();
		}

		if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
			e.preventDefault();
			searchCollapsed = !searchCollapsed;
			searchInput?.focus();
		}
	}}
	on:click={handleClickOutside}
/>

<style>
	:global(body) {
		background-color: var(--bg-base);
	}

	/* top bar styles */

	.titlebar {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 1;
		width: 100%;
		background: var(--bg-base);
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		padding: var(--sm) var(--lg) var(--sm) 100px;
		user-select: none;
		border-bottom: var(--border);
	}

	.main {
		margin-top: 49px;
		padding: 0px var(--md) var(--xxl) var(--md);
	}

	.filter {
		background-color: var(--bg-elevated);
		border: var(--border-thin);
		border-radius: var(--border-sm);
		padding: 4px 6px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.filter:hover {
		background-color: var(--bg-base);
	}

	.arrow-icon {
		width: 18px;
		height: 18px;
		transition: transform 0.3s ease;
	}

	.arrow-icon.rotate {
		transform: rotate(180deg);
	}

	.settings-cont {
		padding: var(--xxs);
		border-radius: var(--border-sm);
		border: var(--border-thin);
	}

	.settings-cont.active {
		background-color: var(--bg-elevated);
	}

	/* search bar styles  */

	.search-cont {
		position: fixed;
		bottom: var(--md);
		left: 50%;
		transform: translateX(-50%);
		height: 45px;
		width: 469px;
		padding: var(--xs);
		border-radius: var(--border-md);
		justify-content: space-between;
		transition:
			height 0.5s,
			width 0.5s,
			border-radius 0.5s;
	}

	.search-cont.collapsed {
		height: 40px;
		width: 130px;
		border-radius: var(--md);
	}

	.search-input {
		background-color: transparent;
		border: none;
		outline: none;
		color: var(--bright-text);
		width: 350px;
		transition: width 0.5s;
	}

	.search-input.collapsed {
		width: 0px;
	}

	.search-input::placeholder {
		color: var(--primary-text);
	}

	.keyboard-shortcut {
		padding: var(--xxs) 6px;
		border: var(--border-thin);
		border-radius: var(--border-sm);
	}

	/* bulk upload welcome screen */

	/* .bulk-upload-cont {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		width: 100%;
		height: 100%;
	}

	.center {
		text-align: center;
		transform: translateY(-49px);
	} */

	/* current stash screen */

	.display-cont {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
		gap: var(--sm);
		justify-items: center;
	}

	.range-cont {
		padding: var(--md) 0px;
	}

	.count-cont {
		padding: 3px 6px;
		background-color: var(--selected);
		border-radius: 100px;
	}

	.label {
		padding-bottom: var(--sm);
	}
</style>

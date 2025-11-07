<script>
	import '../app.css';
	import IconContext from 'phosphor-svelte/lib/IconContext';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { config, loadConfig } from '$lib/utils/configStore';
  import { browser } from '$app/environment';

	let isQuickSave = $state(null);
	let theme = $state('light');

	let { children } = $props();

	$effect(() => (isQuickSave = $page.url.pathname.includes('quick-save')));

	$effect(() => {
		if (browser && $config.theme) {
			document.documentElement.setAttribute('data-theme', $config.theme);
		}
	});

	onMount(async () => {
		document.documentElement.setAttribute('data-theme', theme);
		await loadConfig();
	});
</script>

<svelte:body class:quick-save={isQuickSave} />

<IconContext
	values={{
		color: '#808080',
		size: '16px',
		weight: 'regular'
	}}
>
	{@render children()}
</IconContext>

<style>
</style>

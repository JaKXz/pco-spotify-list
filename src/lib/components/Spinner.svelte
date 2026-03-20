<script>
	let { children = null } = $props();
</script>

<div
	class="fixed right-4 bottom-4 z-50 flex h-12 w-[50%] items-center gap-1 rounded bg-white/90 px-3 py-1.5 shadow-md backdrop-blur-sm"
>
	<span
		class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent"
	></span>
	<span class="px-4 text-xs font-medium wrap-anywhere text-gray-500">
		{#if children}
			{@render children()}
		{:else}
			Loading...
		{/if}
	</span>
</div>

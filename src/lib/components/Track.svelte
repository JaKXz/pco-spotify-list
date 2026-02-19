<script>
	/** @type {{ item: any, pcoDescription?: import('svelte').Snippet, check?: import('svelte').Snippet }} */
	let { item, pcoDescription, check } = $props();
</script>

<details class="w-full overflow-hidden rounded-lg border border-gray-200">
	<summary class="cursor-pointer px-4 py-3 transition-colors hover:bg-gray-50">
		<a
			href={item.url}
			target="_blank"
			rel="noreferrer noopener"
			class="font-medium text-blue-600 hover:text-blue-800 hover:underline"
		>
			{item.name}
		</a>
		<span class="text-gray-600">
			by {item.artist} from <span class="italic">{item.album.name}</span>
		</span>
	</summary>

	<div class="flex items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 p-4">
		<div class="flex min-h-30 flex-1 flex-col justify-evenly gap-3">
			{#if pcoDescription}
				{@render pcoDescription()}
			{/if}

			{#if item.id}
				<iframe
					title="Spotify player for {item.name}"
					src="https://open.spotify.com/embed/track/{item.id}?utm_source=generator&theme=0"
					width="100%"
					height="80"
					frameborder="0"
					allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
					loading="lazy"
					class="rounded"
				></iframe>
			{/if}
		</div>

		<div class="shrink-0">
			{#if check}
				{@render check()}
			{/if}
		</div>
	</div>
</details>

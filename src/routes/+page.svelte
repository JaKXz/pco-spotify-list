<script>
	import { goto } from '$app/navigation';

	let input = $state('');
	let error = $state('');

	function navigate(e) {
		e.preventDefault();
		error = '';

		const value = input.trim();
		if (!value) {
			error = 'Please enter a plan ID or URL.';
			return;
		}

		// Accept a raw numeric ID
		if (/^\d+$/.test(value)) {
			goto(`/plans/${value}`);
			return;
		}

		// Accept a full PCO URL like https://services.planningcenteronline.com/plans/123456
		// or https://services.planningcenteronline.com/service_types/456/plans/123456
		const match = value.match(/plans\/(\d+)/);
		if (match) {
			goto(`/plans/${match[1]}`);
			return;
		}

		error = 'Could not find a plan ID. Paste a PCO plan URL or enter the numeric ID directly.';
	}
</script>

<main class="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-4">
	<div class="w-full rounded-lg border border-green-300 bg-green-50 p-8 shadow-sm">
		<p class="mt-2 text-sm text-gray-600">
			Generate a Spotify playlist from a Planning Center plan or browse all active songs.
		</p>

		<div class="mt-6">
			<a
				href="/all"
				class="inline-block rounded bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
			>
				Browse all active songs →
			</a>
		</div>

		<hr class="my-6 border-gray-200" />

		<form onsubmit={navigate} class="space-y-3">
			<label for="plan-input" class="block text-sm font-medium text-gray-700">
				Go to a specific plan
			</label>
			<div class="flex gap-2">
				<input
					id="plan-input"
					type="text"
					bind:value={input}
					placeholder="Plan ID or PCO URL"
					class="block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
				/>
				<button
					type="submit"
					class="shrink-0 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
				>
					Go
				</button>
			</div>
			<p class="text-xs text-gray-500">
				e.g. <code class="rounded bg-gray-100 px-1 py-0.5">12345678</code> or
				<code class="rounded bg-gray-100 px-1 py-0.5"
					>https://services.planningcenteronline.com/plans/12345678</code
				>
			</p>
			{#if error}
				<p class="text-sm text-red-600">{error}</p>
			{/if}
		</form>
	</div>
</main>

export async function batchAsync<T, R>(items: T[], task: (item: T) => Promise<R>, concurrency = 5) {
	const results: R[] = new Array(items.length);

	let index = 0;

	async function worker() {
		while (index < items.length) {
			const currentIndex = index++;
			try {
				results[currentIndex] = await task(items[currentIndex]);
			} catch (error) {
				console.error(`Error processing item at index ${currentIndex}:`, error);
				results[currentIndex] = null;
			}
		}
	}

	const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());

	await Promise.all(workers);

	return results;
}

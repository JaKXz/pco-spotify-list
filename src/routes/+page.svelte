<script lang="ts">
	import type {PageProps} from './$types';

	let {data}: PageProps = $props();
</script>

<div>
<pre>
    <code>
        {JSON.stringify(data.data, null, 2)}
    </code>
</pre>
</div>

<script lang="ts">
	import type { UkuleleReview } from '../lib/types'
	import { getRatingBadge } from '../lib/data'

	export let review: UkuleleReview

	// Format price range for display
	function formatPriceRange(range: string): string {
		const map: Record<string, string> = {
			'<50': 'Under $50',
			'50-100': '$50 - $100',
			'100-200': '$100 - $200',
			'200-500': '$200 - $500',
			'500+': '$500+'
		}
		return map[range] || range
	}

	// Format size for display
	function formatSize(size: string): string {
		return size.charAt(0).toUpperCase() + size.slice(1)
	}

	// Format date
	function formatDate(dateStr: string): string {
		const date = new Date(dateStr)
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short'
		})
	}
</script>

<article
	class="bg-zinc-800 rounded-xl p-6 transition-all duration-200 flex flex-col gap-4 hover:bg-zinc-700 hover:-translate-y-1 hover:shadow-lg"
>
	<div class="flex flex-col gap-1">
		<div class="flex justify-between items-center">
			<span class="block text-blue-400 text-sm font-medium uppercase tracking-wide">{review.brand}</span>
			{#if getRatingBadge(review.rating).text}
				<span
					class="px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide whitespace-nowrap {getRatingBadge(
						review.rating
					).class === 'badge-top-rated'
						? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
						: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'}"
				>
					{getRatingBadge(review.rating).text}
				</span>
			{/if}
		</div>
		<h3 class="flex-1 text-lg font-semibold">
			{review.model}
		</h3>
	</div>

	<div class="grid gap-2">
		<div class="flex justify-between items-center">
			<span class="text-zinc-400 text-sm">Size:</span>
			<span class="text-white text-sm font-medium">{formatSize(review.size)}</span>
		</div>

		<div class="flex justify-between items-center">
			<span class="text-zinc-400 text-sm">Price:</span>
			<span class="text-white text-sm font-medium">{formatPriceRange(review.priceRange)}</span>
		</div>

		<div class="flex justify-between items-center">
			<span class="text-zinc-400 text-sm">Rating:</span>
			<span class="text-blue-400 text-sm font-semibold">{review.rating}/10</span>
		</div>

		<div class="flex justify-between items-center">
			<span class="text-zinc-400 text-sm">Reviewed:</span>
			<span class="text-white text-sm font-medium">{formatDate(review.reviewDate)}</span>
		</div>
	</div>

	<a
		href={review.url}
		target="_blank"
		rel="noopener noreferrer"
		class="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors underline decoration-transparent hover:decoration-current mt-auto self-start"
	>
		Read Full Review →
	</a>
</article>

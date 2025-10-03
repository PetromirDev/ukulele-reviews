// Data access utilities
import type { UkuleleReview, FilterOptions } from './types'

// Import data from parent directory
export async function loadReviewsData(): Promise<{ reviews: UkuleleReview[]; metadata: any }> {
	try {
		const response = await fetch('/data/ukulele-reviews.json')

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const data = await response.json()
		return {
			reviews: data.data || [],
			metadata: data.metadata || {}
		}
	} catch (error) {
		console.error('Failed to load reviews data:', error)
		return { reviews: [], metadata: {} }
	}
}

export async function loadFilterOptions(): Promise<FilterOptions> {
	try {
		const response = await fetch('/data/other-data.json')

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const data = await response.json()
		return {
			brands: data.brands || [], // Sort brands alphabetically
			sizes: data.sizes || [],
			priceRanges: data.priceRanges || []
		}
	} catch (error) {
		console.error('Failed to load filter options:', error)
		return {
			brands: [],
			sizes: [],
			priceRanges: []
		}
	}
}

// Filter and search utilities
export function filterReviews(
	reviews: UkuleleReview[],
	priceOrder: string[],
	filters: {
		search: string
		brand: string
		size: string
		priceRange: string
	}
): UkuleleReview[] {
	let filtered = reviews.filter((review) => {
		// Search filter (searches brand, model, and combines them)
		const searchTerm = filters.search.toLowerCase().trim()
		if (searchTerm) {
			const brandModel = `${review.brand} ${review.model}`.toLowerCase()
			const matchesBrand = review.brand.toLowerCase().includes(searchTerm)
			const matchesModel = review.model.toLowerCase().includes(searchTerm)
			const matchesCombined = brandModel.includes(searchTerm)

			if (!(matchesBrand || matchesModel || matchesCombined)) {
				return false
			}
		}

		// Brand filter
		if (filters.brand && review.brand !== filters.brand) {
			return false
		}

		// Size filter
		if (filters.size && review.size !== filters.size) {
			return false
		}

		// Price range filter
		if (filters.priceRange && review.priceRange !== filters.priceRange) {
			return false
		}

		return true
	})

	// Sort reviews by priority: price first, then top rated, then recommended, then others
	return filtered.sort((a, b) => {
		// Priority sorting
		const aPrice = priceOrder.indexOf(a.priceRange)
		const bPrice = priceOrder.indexOf(b.priceRange)

		if (aPrice !== bPrice) {
			return aPrice - bPrice // Lower price first
		}

		// Finally by rating descending
		return b.rating - a.rating
	})
}

export function getRatingBadge(rating: number): { text: string; class: string } {
	if (rating >= 9.0) {
		return { text: 'Top Rated', class: 'badge-top-rated' }
	} else if (rating >= 8.0) {
		return { text: 'Recommended', class: 'badge-recommended' }
	}
	return { text: '', class: '' }
}

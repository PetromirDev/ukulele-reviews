// Data access utilities
import type { UkuleleReview, FilterOptions } from './types'

// Import data from parent directory
export async function loadReviewsData(): Promise<{ reviews: UkuleleReview[]; metadata: any }> {
	try {
		const response = await fetch('/data/ukulele-reviews-2025-10-02.json')

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
			brands: (data.brands || []).sort(), // Sort brands alphabetically
			sizes: sortSizes(data.sizes || []),
			priceRanges: sortPriceRanges(data.priceRanges || [])
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

// Sort sizes in the specified order
function sortSizes(sizes: string[]): string[] {
	const sizeOrder = ['soprano', 'concert', 'baritone', 'tenor', 'other']
	return sizes.sort((a, b) => {
		const aIndex = sizeOrder.indexOf(a.toLowerCase())
		const bIndex = sizeOrder.indexOf(b.toLowerCase())

		// If both are in the order list, sort by their position
		if (aIndex !== -1 && bIndex !== -1) {
			return aIndex - bIndex
		}

		// If only one is in the order list, it comes first
		if (aIndex !== -1) return -1
		if (bIndex !== -1) return 1

		// If neither is in the order list, sort alphabetically
		return a.localeCompare(b)
	})
}

// Sort price ranges from low to high
function sortPriceRanges(priceRanges: string[]): string[] {
	const priceOrder = ['<50', '50-100', '100-200', '200-500', '500+']
	return priceRanges.sort((a, b) => {
		const aIndex = priceOrder.indexOf(a)
		const bIndex = priceOrder.indexOf(b)

		if (aIndex !== -1 && bIndex !== -1) {
			return aIndex - bIndex
		}

		// If not in standard format, sort alphabetically
		return a.localeCompare(b)
	})
}

// Filter and search utilities
export function filterReviews(
	reviews: UkuleleReview[],
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
		const priceOrder = ['<50', '50-100', '100-200', '200-500', '500+']
		const aPrice = priceOrder.indexOf(a.priceRange)
		const bPrice = priceOrder.indexOf(b.priceRange)

		if (aPrice !== bPrice) {
			return aPrice - bPrice // Lower price first
		}

		// Then by rating (top rated first)
		const aTopRated = a.rating >= 8.5 ? 1 : 0
		const bTopRated = b.rating >= 8.5 ? 1 : 0

		if (aTopRated !== bTopRated) {
			return bTopRated - aTopRated // Top rated first
		}

		// Then by recommended (good rating)
		const aRecommended = a.rating >= 7.5 ? 1 : 0
		const bRecommended = b.rating >= 7.5 ? 1 : 0

		if (aRecommended !== bRecommended) {
			return bRecommended - aRecommended // Recommended first
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

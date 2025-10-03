// Type definitions
export interface UkuleleReview {
	size: string
	brand: string
	model: string
	priceRange: string
	url: string
	rating: number
	reviewDate: string
}

export interface FilterOptions {
	brands: string[]
	sizes: string[]
	priceRanges: string[]
	lastUpdated: string
}

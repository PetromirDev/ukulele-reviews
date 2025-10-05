import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs/promises'
import path from 'path'
import Logger from './logger.js'

/**
 * Improved Ukulele Reviews Scraper for gotaukulele.com
 * Targets the actual price range sections and extracts all ukulele reviews
 */
class UkuleleReviewsScraper {
	constructor(options = {}) {
		this.sourceUrl = 'https://www.gotaukulele.com/p/ukulele-reviews.html'
		this.outputDir = options.outputDir || './public/data'
		this.userAgent =
			'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
		this.logger = new Logger()

		// Price range mappings
		this.priceRanges = {
			'Ukuleles £0 - £50': '<50',
			'Ukuleles £50- £100': '50-100',
			'Ukuleles £100 - £200': '100-200',
			'Ukuleles £200 - £500': '200-500',
			'Ukuleles £500 plus': '500+'
		}

		this.ensureOutputDir()
	}

	async ensureOutputDir() {
		try {
			await fs.mkdir(this.outputDir, { recursive: true })
			this.logger.info(`Output directory ensured: ${this.outputDir}`)
		} catch (error) {
			this.logger.error(`Error creating output directory: ${error.message}`)
			throw error
		}
	}

	/**
	 * Make HTTP request
	 */
	async makeRequest(url) {
		try {
			this.logger.debug(`Making request to: ${url}`)
			const response = await axios.get(url, {
				headers: { 'User-Agent': this.userAgent },
				timeout: 10000
			})
			this.logger.debug(`Request successful: ${url}`)
			return response.data
		} catch (error) {
			this.logger.error(`Request failed for ${url}: ${error.message}`)
			throw error
		}
	}

	/**
	 * Extract brands from the brand tag cloud widget
	 */
	extractBrandsFromTagCloud(htmlContent) {
		const $ = cheerio.load(htmlContent)
		const brands = new Set()

		// Find the brand tag cloud widget
		$('.cloud-label-widget-content a').each((i, element) => {
			const $link = $(element)
			const brandName = $link.text().trim()
			if (brandName) {
				brands.add(brandName.toUpperCase()) // Normalize to uppercase
			}
		})

		this.logger.info(`Extracted ${brands.size} brands from tag cloud`)
		return Array.from(brands).sort()
	}

	/**
	 * Find best matching brand for a title using the brand list
	 */
	findBestMatchingBrand(title, brandList) {
		const titleUpper = title.toUpperCase()

		// Sort brands by length (longest first) to match more specific brands first
		const sortedBrands = [...brandList].sort((a, b) => b.length - a.length)

		for (const brand of sortedBrands) {
			if (titleUpper.includes(brand)) {
				return brand
			}
		}

		// If no brand found, try to extract first word as fallback
		const firstWord = title.split(/\s+/)[0]
		return firstWord ? firstWord.toUpperCase() : 'UNKNOWN'
	}

	getEdgeCaseSize(title) {
		const lowerTitle = title.toLowerCase().trim()

		if (lowerTitle === 'enya euc-ms') return 'concert'

		return null
	}

	/**
	 * Extract ukulele size from title
	 */
	extractSize(title) {
		const lowerTitle = title.toLowerCase()

		if (this.getEdgeCaseSize(title)) {
			return this.getEdgeCaseSize(title)
		}

		if (lowerTitle.includes('soprano')) return 'soprano'
		if (lowerTitle.includes('sopranino')) return 'sopranino'
		if (lowerTitle.includes('concert')) return 'concert'
		if (lowerTitle.includes('tenor')) return 'tenor'
		if (lowerTitle.includes('baritone') || lowerTitle.includes('bari ')) return 'baritone'

		return 'other'
	}

	/**
	 * Extract brand and model using brand list from tag cloud
	 */
	extractBrandAndModel(title, brandList = []) {
		const brand = this.findBestMatchingBrand(title, brandList)

		// Remove common words and clean up
		let cleanTitle = title
			.replace(/ ukuleles/gi, '')
			.replace(/ ukulele/gi, '')
			.replace(/ uke/gi, '')
			.replace(/ review/gi, '')
			.trim()

		// Remove the brand from the title to get the model
		const brandRegex = new RegExp(`^${brand.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*`, 'i')
		let model = cleanTitle.replace(brandRegex, '').trim() || 'Unknown Model'

		// Remove size from model name only if it's the last word AND there are multiple words
		const sizeWords = ['sopranino', 'soprano', 'concert', 'tenor', 'baritone']
		const modelWords = model.split(/\s+/)

		if (modelWords.length > 1) {
			const lastWord = modelWords[modelWords.length - 1].toLowerCase()
			if (sizeWords.includes(lastWord)) {
				model = modelWords.slice(0, -1).join(' ')
			}
		}

		return { brand, model }
	}

	/**
	 * Parse review date from string
	 */
	parseReviewDate(dateStr) {
		if (!dateStr) return null

		// Clean up the date string
		const cleanDate = dateStr.replace(/[()]/g, '').trim()

		// Try to parse common formats
		const months = {
			jan: '01',
			feb: '02',
			mar: '03',
			apr: '04',
			may: '05',
			jun: '06',
			jul: '07',
			aug: '08',
			sep: '09',
			oct: '10',
			nov: '11',
			dec: '12'
		}

		// Pattern: "Jan 2023", "Feb 2024", etc.
		const monthYearMatch = cleanDate.match(/([a-z]{3})\s+(\d{4})/i)
		if (monthYearMatch) {
			const month = months[monthYearMatch[1].toLowerCase()]
			const year = monthYearMatch[2]
			if (month) {
				return `${year}-${month}-01`
			}
		}

		// Pattern: "2023", just year
		const yearMatch = cleanDate.match(/(\d{4})/)
		if (yearMatch) {
			return `${yearMatch[1]}-01-01`
		}

		return null
	}

	/**
	 * Extract brands from the brand tag cloud widget
	 */
	extractBrandsFromTagCloud(htmlContent) {
		const $ = cheerio.load(htmlContent)
		const brands = new Set()

		// Find the brand tag cloud widget
		$('.cloud-label-widget-content a').each((i, element) => {
			const $link = $(element)
			const brandName = $link.text().trim()
			if (brandName) {
				brands.add(brandName.toUpperCase()) // Normalize to uppercase
			}
		})

		this.logger.info(`Extracted ${brands.size} brands from tag cloud`)
		return Array.from(brands).sort()
	}

	/**
	 * Find best matching brand for a title using the brand list
	 */
	findBestMatchingBrand(title, brandList) {
		const titleUpper = title.toUpperCase()

		// Sort brands by length (longest first) to match more specific brands first
		const sortedBrands = [...brandList].sort((a, b) => b.length - a.length)

		for (const brand of sortedBrands) {
			if (titleUpper.includes(brand)) {
				return brand
			}
		}

		// If no brand found, try to extract first word as fallback
		const firstWord = title.split(/\s+/)[0]
		return firstWord ? firstWord.toUpperCase() : 'UNKNOWN'
	}

	/**
	 * Save brand metadata for filtering and validation
	 */
	async saveBrandMetadata(reviews) {
		const metadata = {
			lastUpdated: new Date().toISOString(),
			brands: [],
			sizes: [],
			priceRanges: []
		}

		// Extract unique values
		const brandSet = new Set()
		const sizeSet = new Set()
		const priceRangeSet = new Set()

		reviews.forEach((review) => {
			brandSet.add(review.brand)
			sizeSet.add(review.size)
			priceRangeSet.add(review.priceRange)
		})

		metadata.brands = Array.from(brandSet).sort()
		metadata.sizes = ['Soprano', 'Concert', 'Tenor', 'Baritone', 'Sopranino', 'Other']
		metadata.priceRanges = ['<50', '50-100', '100-200', '200-500', '500+']

		if (!Array.from(priceRangeSet).every((pr) => metadata.priceRanges.includes(pr))) {
			throw new Error('Unexpected price ranges found in reviews')
		}

		if (!Array.from(sizeSet).every((sz) => metadata.sizes.map((s) => s.toLowerCase()).includes(sz))) {
			throw new Error('Unexpected sizes found in reviews')
		}

		const metadataPath = path.join(this.outputDir, 'other-data.json')
		await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
		this.logger.info(`Brand metadata saved to: ${metadataPath}`)

		return metadata
	}

	/**
	 * Check for new brands and report them
	 */
	async checkForNewBrands(currentBrands) {
		const metadataPath = path.join(this.outputDir, 'other-data.json')

		try {
			const existingData = await fs.readFile(metadataPath, 'utf8')
			const existingMetadata = JSON.parse(existingData)

			const newBrands = currentBrands.filter((brand) => !existingMetadata.brands.includes(brand))

			if (newBrands.length > 0) {
				this.logger.info(`🆕 NEW BRANDS DETECTED: ${newBrands.join(', ')}`)
				return newBrands
			} else {
				this.logger.info('No new brands detected')
				return []
			}
		} catch (error) {
			this.logger.info('No previous brand metadata found - all brands are new')
			return currentBrands
		}
	}

	isHigherInDom(node1, node2) {
		return node1.startIndex < node2.startIndex
	}

	extractReviewPrice(node, priceTitles, $) {
		let priceNode = priceTitles[0]

		priceTitles.forEach((priceTitleNode) => {
			if (!this.isHigherInDom(node, priceTitleNode, $)) {
				priceNode = priceTitleNode
			}
		})

		return this.mapPriceRange(priceNode.data)
	}

	/**
	 * Extract all ukulele reviews from the page
	 */
	async extractAllReviews() {
		this.logger.info('Fetching main reviews page...')
		const html = await this.makeRequest(this.sourceUrl)

		// Fetch the page from local cache for development
		// const html = await fs.readFile(path.join(this.outputDir, 'debug-page.html'), 'utf8')
		// Save the html for debugging
		// await fs.writeFile(path.join(this.outputDir, 'debug-page.html'), html)

		const $ = cheerio.load(html, {
			xml: {
				withStartIndices: true,
				withEndIndices: true
			}
		})

		// Extract brands from tag cloud first
		const brandList = this.extractBrandsFromTagCloud(html)

		// Get all review links
		const allReviewData = []

		// Get the main content area
		const mainContent = $('.post-body').html() || $('body').html()
		const $main = cheerio.load(mainContent, {
			xml: {
				withStartIndices: true,
				withEndIndices: true
			}
		})

		// Get all price range title nodes for context
		const priceTitleNodes = []

		Object.keys(this.priceRanges).forEach((priceTitle) => {
			$main('b > span').each((_, element) => {
				const text = $main(element).text().trim()
				if (text.startsWith(priceTitle)) {
					priceTitleNodes.push(element.children[0])
				}
			})
		})

		// Find all review links and collect their data
		$main('a[href*="gotaukulele.com"]').each((i, element) => {
			const $link = $main(element)
			const href = $link.attr('href')
			const linkText = $link.text().trim()

			// Skip non-review links
			if (!href || href.includes('/p/') || linkText.length < 5) return

			// Get the next siblings to find rating and date
			let nextNode = $link[0].next
			let followingText = ''

			// Collect text nodes that follow the link
			while (nextNode && followingText.length < 100) {
				if (nextNode.type === 'text' && nextNode.data.includes('out')) {
					followingText += nextNode.data
				} else if (nextNode.type === 'tag' && nextNode.name === 'br' && nextNode.name === 'div') {
					break // Stop at line break
				}
				nextNode = nextNode.next
			}

			// If nothing collected, check if the link is inside <b> and try to get the next sibling of <b>
			if (!followingText && $link.parent() && $link.parent()[0].name === 'b') {
				let bSibling = $link.parent()[0].next
				while (bSibling && followingText.length < 100) {
					if (bSibling.type === 'text') {
						followingText += bSibling.data
						break
					} else if (bSibling.type === 'tag' && bSibling.name === 'br' && bSibling.name === 'div') {
						break
					}
					bSibling = bSibling.next
				}
			}

			// Look for the pattern: " - X out of 10 (Date)" or " - X/10"
			const ratingPattern = /([\d.]+)\s*(?:out\s*of\s*10|\/10)\s*\(([^)]+)\)\s*(?:null)?/i
			const ratingPattern2 = /([\d.]+)\s*(?:out\s*10|\/10)\s*\(([^)]+)\)\s*(?:null)?/i
			const match = followingText.trim().match(ratingPattern) || followingText.trim().match(ratingPattern2)

			if (match) {
				const rating = parseFloat(match[1])
				const dateStr = match[2].trim()
				const reviewDate = this.parseReviewDate(dateStr)
				const size = this.extractSize(linkText)
				const priceRange = this.extractReviewPrice($link[0], priceTitleNodes, $)

				allReviewData.push({
					title: linkText,
					url: href.startsWith('http') ? href : `https://www.gotaukulele.com${href}`,
					rating,
					priceRange,
					reviewDate,
					size,
					index: i
				})
			}
		})

		this.logger.info(`Found ${allReviewData.length} review links`)

		// Map each review to its price range and extract brand/model
		const reviews = allReviewData.map((reviewData, index) => {
			// Extract brand and model using tag cloud brands
			const brandModel = this.extractBrandAndModel(reviewData.title, brandList)

			return {
				size: reviewData.size,
				brand: brandModel.brand,
				model: brandModel.model,
				priceRange: reviewData.priceRange,
				url: reviewData.url,
				rating: reviewData.rating,
				reviewDate: reviewData.reviewDate
			}
		})

		this.logger.info(`Successfully extracted ${reviews.length} ukulele reviews with improved brand detection`)

		// Get unique brands for validation
		const uniqueBrands = Array.from(new Set(reviews.map((r) => r.brand))).sort()

		// Check for new brands
		await this.checkForNewBrands(uniqueBrands)

		// Save brand metadata
		await this.saveBrandMetadata(reviews)

		// Log brand validation for specified test brands
		const testBrands = ['FLIGHT', 'BATON ROUGE', 'HARLEY BENTON', 'KM UKULELES', 'MARTIN']
		this.logger.info('🔍 BRAND VALIDATION:')
		testBrands.forEach((testBrand) => {
			const matches = reviews.filter((r) => r.brand === testBrand)
			if (matches.length > 0) {
				const models = Array.from(new Set(matches.map((r) => r.model))).slice(0, 3)
				this.logger.info(`  ✅ ${testBrand}: ${matches.length} reviews (e.g., ${models.join(', ')})`)
			} else {
				this.logger.warn(`  ❌ ${testBrand}: Not found`)
			}
		})

		// Log brand distribution
		const brandCounts = {}
		reviews.forEach((review) => {
			brandCounts[review.brand] = (brandCounts[review.brand] || 0) + 1
		})

		const topBrands = Object.entries(brandCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10)

		this.logger.info(`Top brands found: ${topBrands.map(([brand, count]) => `${brand}(${count})`).join(', ')}`)

		return reviews
	}

	/**
	 * Map price range text to standard format
	 */
	mapPriceRange(priceRangeText) {
		const cleanText = priceRangeText.replace(/£/g, '').toLowerCase().trim()
		this.logger.debug(`Mapping price range: "${priceRangeText}" -> "${cleanText}"`)

		// Handle variations based on debug output patterns
		if (cleanText.includes('500') && (cleanText.includes('plus') || cleanText.includes('+'))) return '500+'
		if (cleanText.includes('200 -') || cleanText.includes('200-')) return '200-500'
		if (cleanText.includes('100 -') || cleanText.includes('100-')) return '100-200'
		if (cleanText.includes('50-') || cleanText.includes('50 -')) return '50-100'
		if (cleanText.includes('0 -') || cleanText.startsWith('0-')) return '<50'

		return 'unknown'
	}

	/**
	 * Generate diff report comparing previous and current data
	 */
	generateDiffReport(previousData, currentData) {
		const prevUrls = new Set((previousData || []).map((item) => item.url))
		const currUrls = new Set(currentData.map((item) => item.url))

		const newReviews = currentData.filter((item) => !prevUrls.has(item.url))
		const removedUrls = [...prevUrls].filter((url) => !currUrls.has(url))

		return {
			timestamp: new Date().toISOString(),
			changes: {
				new: newReviews,
				updated: [], // For simplicity, not tracking updates
				removed: removedUrls
			},
			summary: {
				totalPrevious: previousData ? previousData.length : 0,
				totalCurrent: currentData.length,
				netChange: currentData.length - (previousData ? previousData.length : 0)
			}
		}
	}

	/**
	 * Main scraping method
	 */
	async scrape() {
		const startTime = Date.now()

		try {
			this.logger.info('Starting comprehensive ukulele reviews scraping...')

			// Extract all reviews
			const reviews = await this.extractAllReviews()

			if (reviews.length === 0) {
				throw new Error('No reviews found')
			}

			// Load previous data for comparison
			let previousData = null
			try {
				const files = await fs.readdir(this.outputDir)
				const jsonFiles = files.filter((f) => f === 'ukulele-reviews.json')

				if (jsonFiles.length > 0) {
					const latestFile = jsonFiles.sort().reverse()[0]
					const filePath = path.join(this.outputDir, latestFile)
					const data = await fs.readFile(filePath, 'utf8')
					const parsed = JSON.parse(data)
					previousData = parsed.data || []
					this.logger.info(`Loaded previous data: ${previousData.length} reviews`)
				}
			} catch (error) {
				this.logger.warn(`Could not load previous data: ${error.message}`)
			}

			// Generate diff report
			const diffReport = this.generateDiffReport(previousData, reviews)

			// Create output data
			const output = {
				data: reviews,
				metadata: {
					sourceUrl: this.sourceUrl,
					scrapedAt: Date.now(),
					total: reviews.length,
					diffReport: diffReport
				}
			}

			// Save to file
			const filename = `ukulele-reviews.json`
			const filepath = path.join(this.outputDir, filename)

			await fs.writeFile(filepath, JSON.stringify(output, null, 2))

			this.logger.info('Scraping completed successfully!')
			this.logger.info(`- Total reviews found: ${reviews.length}`)
			this.logger.info(`- New reviews: ${diffReport.changes.new.length}`)
			this.logger.info(`- Output saved to: ${filepath}`)
			this.logger.info(`- Time taken: ${((Date.now() - startTime) / 1000).toFixed(2)}s`)

			// Log price range distribution
			const priceRangeCounts = {}
			reviews.forEach((review) => {
				priceRangeCounts[review.priceRange] = (priceRangeCounts[review.priceRange] || 0) + 1
			})

			this.logger.info('Price range distribution:')
			Object.entries(priceRangeCounts).forEach(([range, count]) => {
				this.logger.info(`  ${range}: ${count} reviews`)
			})

			return output
		} catch (error) {
			this.logger.error(`Scraping failed: ${error.message}`)
			this.logger.error(`Stack trace: ${error.stack}`)
			throw error
		}
	}
}

// Run the scraper if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const scraper = new UkuleleReviewsScraper()
	scraper.scrape().catch(console.error)
}

export default UkuleleReviewsScraper

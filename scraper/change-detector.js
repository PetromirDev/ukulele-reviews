import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

/**
 * Change Detection Manager for tracking review updates
 */
class ChangeDetector {
	constructor(dataDir = './data') {
		this.dataDir = dataDir
		this.cacheFile = path.join(dataDir, 'scrape-cache.json')
		this.cache = null
	}

	/**
	 * Generate hash for URL to track changes
	 */
	generateHash(url) {
		return crypto.createHash('md5').update(url).digest('hex')
	}

	/**
	 * Load existing cache
	 */
	async loadCache() {
		try {
			const cacheData = await fs.readFile(this.cacheFile, 'utf8')
			this.cache = JSON.parse(cacheData)
		} catch (error) {
			// Cache doesn't exist or is corrupted, start fresh
			this.cache = {
				lastRun: null,
				urls: {},
				metadata: {
					created: new Date().toISOString(),
					totalRuns: 0
				}
			}
		}
	}

	/**
	 * Save cache to file
	 */
	async saveCache() {
		try {
			await fs.mkdir(this.dataDir, { recursive: true })
			await fs.writeFile(this.cacheFile, JSON.stringify(this.cache, null, 2))
		} catch (error) {
			console.error('Error saving cache:', error.message)
		}
	}

	/**
	 * Check if a URL is new or updated since last run
	 */
	isNewOrUpdated(url, contentHash = null) {
		if (!this.cache) {
			return true // First run, everything is new
		}

		const urlHash = this.generateHash(url)
		const cached = this.cache.urls[urlHash]

		if (!cached) {
			return true // New URL
		}

		if (contentHash && cached.contentHash !== contentHash) {
			return true // Content changed
		}

		return false // No changes detected
	}

	/**
	 * Update cache with new URL data
	 */
	updateCache(url, data = {}) {
		if (!this.cache) {
			this.loadCache()
		}

		const urlHash = this.generateHash(url)
		this.cache.urls[urlHash] = {
			url: url,
			lastSeen: new Date().toISOString(),
			contentHash: data.contentHash || null,
			title: data.title || null,
			...data
		}
	}

	/**
	 * Mark start of new scraping run
	 */
	startNewRun() {
		if (!this.cache) {
			this.cache = {
				lastRun: null,
				urls: {},
				metadata: {
					created: new Date().toISOString(),
					totalRuns: 0
				}
			}
		}

		this.cache.lastRun = new Date().toISOString()
		this.cache.metadata.totalRuns++
	}

	/**
	 * Get statistics about changes
	 */
	getChangeStats(currentUrls) {
		if (!this.cache || !this.cache.urls) {
			return {
				newUrls: currentUrls.length,
				updatedUrls: 0,
				unchangedUrls: 0,
				totalCached: 0
			}
		}

		const cachedUrls = Object.values(this.cache.urls).map((item) => item.url)
		const newUrls = currentUrls.filter((url) => !cachedUrls.includes(url))
		const unchangedUrls = currentUrls.filter((url) => cachedUrls.includes(url))

		return {
			newUrls: newUrls.length,
			updatedUrls: 0, // Will be calculated during actual scraping
			unchangedUrls: unchangedUrls.length,
			totalCached: cachedUrls.length,
			newUrlsList: newUrls
		}
	}

	/**
	 * Get URLs that should be scraped (new or updated only)
	 */
	getUrlsToScrape(allUrls, forceAll = false) {
		if (!this.cache || forceAll) {
			return allUrls // First run or force all
		}

		return allUrls.filter((url) => this.isNewOrUpdated(url))
	}

	/**
	 * Generate diff report
	 */
	generateDiffReport(previousData, currentData) {
		const report = {
			timestamp: new Date().toISOString(),
			changes: {
				new: [],
				updated: [],
				removed: []
			},
			summary: {
				totalPrevious: previousData?.length || 0,
				totalCurrent: currentData?.length || 0,
				netChange: (currentData?.length || 0) - (previousData?.length || 0)
			}
		}

		if (!previousData) {
			report.changes.new = currentData || []
			return report
		}

		const previousUrls = previousData.map((item) => item.url)
		const currentUrls = currentData.map((item) => item.url)

		// Find new items
		report.changes.new = currentData.filter((item) => !previousUrls.includes(item.url))

		// Find removed items
		report.changes.removed = previousData.filter((item) => !currentUrls.includes(item.url))

		// Find updated items (simplified - just different data)
		currentData.forEach((currentItem) => {
			const previousItem = previousData.find((p) => p.url === currentItem.url)
			if (previousItem && JSON.stringify(previousItem) !== JSON.stringify(currentItem)) {
				report.changes.updated.push({
					url: currentItem.url,
					previous: previousItem,
					current: currentItem
				})
			}
		})

		return report
	}
}

export default ChangeDetector

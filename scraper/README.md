# Ukulele Reviews Scraper

A comprehensive JavaScript web scraping solution for extracting ukulele review data from [Got A Ukulele](https://www.gotaukulele.com/p/ukulele-reviews.html). Built for scheduled execution with robust error handling, change detection, and WordPress compatibility.

## Features

- 🎯 **Targeted Scraping**: Extracts structured review data including brand, model, size, pricing, and ratings
- 🔄 **Incremental Updates**: Smart change detection to avoid re-scraping unchanged content
- 📊 **Comprehensive Logging**: Timestamped logs with error tracking and performance metrics
- 🛡️ **Error Resilience**: Retry logic, timeout handling, and graceful failure recovery
- 📋 **WordPress Optimized**: Designed for WordPress site structure with fallback selectors
- 🔧 **Configurable**: JSON-based configuration for easy customization
- 📈 **Progress Tracking**: Detailed metadata and diff reports for monitoring changes

## Installation

1. **Clone or download** this project to your desired directory
2. **Install dependencies**:
   ```bash
   npm install
   ```

## Quick Start

### Basic Usage

```bash
# Run the scraper
npm run scrape

# Or directly with node
node scraper.js
```

### Configuration

The scraper uses `config.json` for configuration. Key settings:

```json
{
  "scraper": {
    "delayBetweenRequests": 1000,
    "incrementalMode": true,
    "testMode": {
      "enabled": true,
      "maxReviews": 10
    }
  }
}
```

### Programmatic Usage

```javascript
import UkuleleReviewsScraper from './scraper.js';

const scraper = new UkuleleReviewsScraper({
  outputDir: './my-data',
  delay: 2000,
  incrementalMode: false
});

const results = await scraper.scrape();
console.log(`Scraped ${results.data.length} reviews`);
```

## Output Format

The scraper generates JSON files with the following structure:

```json
{
  "data": [
    {
      "size": "soprano",
      "brand": "Example Brand",
      "model": "Model X",
      "priceRange": "100-200",
      "url": "https://www.gotaukulele.com/...",
      "rating": 8.5,
      "reviewDate": "2024-03-15"
    }
  ],
  "metadata": {
    "sourceUrl": "https://www.gotaukulele.com/p/ukulele-reviews.html",
    "scrapedAt": 1234567890000,
    "totalFound": 662,
    "scraped": 10,
    "errors": 0,
    "timestamp": "2024-03-15T10:30:00.000Z",
    "processingTimeMs": 15000,
    "incrementalRun": true,
    "diffReport": {
      "changes": {
        "new": [...],
        "updated": [...],
        "removed": [...]
      }
    }
  }
}
```

## Data Schema

### Review Object Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `size` | String | Ukulele size category | "soprano", "concert", "tenor", "baritone", "other" |
| `brand` | String | Manufacturer name | "Kala", "Martin", "Ohana" |
| `model` | String | Specific model name | "KA-15S", "T1K", "CK-35G" |
| `priceRange` | String | Price category | "<50", "50-100", "100-200", "200-300", "300-500", "500+" |
| `url` | String | Full URL to review | "https://www.gotaukulele.com/..." |
| `rating` | Number/null | 0-10 rating scale | 8.5, null if not found |
| `reviewDate` | String/null | ISO 8601 date | "2024-03-15", null if not found |

### Price Range Categories

- `<50`: Under $50/£50
- `50-100`: $50-100/£50-100
- `100-200`: $100-200/£100-200
- `200-300`: $200-300/£200-300
- `300-500`: $300-500/£300-500
- `500+`: Over $500/£500

## Configuration Options

### Scraper Settings

```json
{
  "scraper": {
    "sourceUrl": "https://www.gotaukulele.com/p/ukulele-reviews.html",
    "outputDir": "./data",
    "delayBetweenRequests": 1000,
    "maxRetries": 3,
    "timeout": 10000,
    "incrementalMode": true
  }
}
```

- **delayBetweenRequests**: Milliseconds between requests (rate limiting)
- **maxRetries**: Number of retry attempts for failed requests
- **timeout**: Request timeout in milliseconds
- **incrementalMode**: Only scrape new/changed content

### Test Mode

```json
{
  "testMode": {
    "enabled": true,
    "maxReviews": 10
  }
}
```

Set `testMode.enabled` to `false` and `maxReviews` to a higher number (or remove the limit in code) for full scraping.

## Incremental Scraping

The scraper maintains a cache file (`data/scrape-cache.json`) to track:

- Previously scraped URLs
- Last run timestamp
- Content hashes for change detection

On subsequent runs, only new or changed reviews are scraped, making it ideal for scheduled execution.

### Cache Management

```bash
# View cache status
cat data/scrape-cache.json

# Reset cache (forces full re-scrape)
rm data/scrape-cache.json
```

## Error Handling

The scraper includes comprehensive error handling:

- **Network Issues**: Automatic retries with exponential backoff
- **Parsing Errors**: Graceful handling of malformed HTML
- **Rate Limiting**: Configurable delays between requests
- **Data Validation**: Checks for required fields and content quality

### Log Files

Logs are saved to `logs/scraper-YYYY-MM-DD.log` with:

- Timestamped entries
- Different log levels (INFO, WARN, ERROR, DEBUG)
- Request/response tracking
- Error stack traces

## Scheduling

For automated execution, you can use:

### Cron (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add daily execution at 2 AM
0 2 * * * cd /path/to/ukulele-reviews && npm run scrape
```

### Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., daily at 2 AM)
4. Set action to run: `cmd /c "cd C:\\path\\to\\ukulele-reviews && npm run scrape"`

### PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
pm2 ecosystem

# Add to ecosystem.config.js:
{
  name: 'ukulele-scraper',
  script: 'scraper.js',
  cron_restart: '0 2 * * *',
  autorestart: false
}

# Start
pm2 start ecosystem.config.js
```

## WordPress Considerations

This scraper is optimized for WordPress sites:

- **Content Selectors**: Uses `.post-body` with fallback to `body`
- **URL Patterns**: Filters out WordPress admin and static pages
- **Plugin Updates**: Robust selectors that work across theme changes
- **Performance**: Respectful rate limiting to avoid server load

## Development

### Project Structure

```
ukulele-reviews/
├── scraper.js           # Main scraper class
├── logger.js            # Logging functionality
├── change-detector.js   # Change detection system
├── config.json          # Configuration file
├── package.json         # Dependencies and scripts
├── data/                # Output directory
│   ├── ukulele-reviews-2024-10-01.json
│   └── scrape-cache.json
├── logs/                # Log files
│   └── scraper-2024-10-01.log
└── README.md
```

### Adding New Features

1. **New Data Fields**: Modify the extraction methods in `scraper.js`
2. **Different Sources**: Extend or create new scraper classes
3. **Output Formats**: Modify the output generation in the `scrape()` method
4. **Scheduling**: Use the configuration options or external schedulers

### Testing

```bash
# Test with limited reviews
node scraper.js

# Test without incremental mode
node -e "
import UkuleleReviewsScraper from './scraper.js';
const scraper = new UkuleleReviewsScraper({ incrementalMode: false });
scraper.scrape();
"
```

## Troubleshooting

### Common Issues

1. **No reviews found**
   - Check network connectivity
   - Verify the source URL is accessible
   - Review the extraction filters in config

2. **SSL/TLS errors**
   ```bash
   export NODE_TLS_REJECT_UNAUTHORIZED=0
   ```

3. **Rate limiting/blocked requests**
   - Increase `delayBetweenRequests` in config
   - Check User-Agent string
   - Consider using a proxy

4. **Memory issues with large datasets**
   - Enable incremental mode
   - Process in smaller batches
   - Increase Node.js memory limit:
   ```bash
   node --max-old-space-size=4096 scraper.js
   ```

### Debug Mode

Enable detailed debugging:

```bash
DEBUG=* node scraper.js
```

Or check the log files for detailed execution information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Disclaimer

This scraper is for educational and research purposes. Please respect the website's terms of service and robots.txt file. Consider reaching out to the website owner for permission before running large-scale scraping operations.

## Support

For issues, questions, or feature requests, please open an issue in the project repository.
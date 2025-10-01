/**
 * Simple logging utility
 */
class Logger {
	constructor(level = 'INFO') {
		this.level = level
		this.levels = {
			DEBUG: 0,
			INFO: 1,
			WARN: 2,
			ERROR: 3
		}
	}

	log(level, message) {
		if (this.levels[level] >= this.levels[this.level]) {
			const timestamp = new Date().toISOString()
			console.log(`[${timestamp}] [${level}] ${message}`)
		}
	}

	debug(message) {
		this.log('DEBUG', message)
	}

	info(message) {
		this.log('INFO', message)
	}

	warn(message) {
		this.log('WARN', message)
	}

	error(message) {
		this.log('ERROR', message)
	}
}

export default Logger

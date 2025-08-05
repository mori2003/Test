#!/usr/bin/env node

/**
 * Advanced Web Scraping and Data Processing Example
 * =================================================
 * 
 * This module demonstrates sophisticated web scraping capabilities including:
 * - HTTP requests and response handling
 * - HTML parsing and data extraction
 * - Asynchronous programming patterns
 * - Error handling and retry logic
 * - Data processing and analysis
 * - File I/O operations
 * 
 * @author AI Agent
 * @date 2024
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

/**
 * Advanced web scraper class with comprehensive functionality
 */
class WebScraper {
    constructor(options = {}) {
        this.options = {
            userAgent: 'Mozilla/5.0 (compatible; AI-Agent-Scraper/1.0)',
            timeout: 10000,
            maxRetries: 3,
            retryDelay: 1000,
            ...options
        };
        
        this.results = [];
        this.errors = [];
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            startTime: null,
            endTime: null
        };
    }

    /**
     * Make HTTP request with retry logic and error handling
     * @param {string} url - URL to fetch
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<string>} Response body
     */
    async makeRequest(url, retryCount = 0) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 443,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'User-Agent': this.options.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: this.options.timeout
            };

            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        this.stats.successfulRequests++;
                        resolve(data);
                    } else {
                        const error = new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`);
                        error.statusCode = res.statusCode;
                        reject(error);
                    }
                });
            });

            req.on('error', async (error) => {
                if (retryCount < this.options.maxRetries) {
                    console.log(`Retrying request to ${url} (attempt ${retryCount + 1}/${this.options.maxRetries})`);
                    await this.delay(this.options.retryDelay * (retryCount + 1));
                    try {
                        const result = await this.makeRequest(url, retryCount + 1);
                        resolve(result);
                    } catch (retryError) {
                        reject(retryError);
                    }
                } else {
                    this.stats.failedRequests++;
                    reject(error);
                }
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`Request timeout for ${url}`));
            });

            req.end();
        });
    }

    /**
     * Simple HTML parser to extract data
     * @param {string} html - HTML content
     * @returns {Object} Extracted data
     */
    parseHTML(html) {
        const data = {
            title: this.extractTitle(html),
            headings: this.extractHeadings(html),
            links: this.extractLinks(html),
            paragraphs: this.extractParagraphs(html),
            metadata: this.extractMetadata(html)
        };
        
        return data;
    }

    /**
     * Extract title from HTML
     * @param {string} html - HTML content
     * @returns {string} Page title
     */
    extractTitle(html) {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        return titleMatch ? titleMatch[1].trim() : 'No title found';
    }

    /**
     * Extract headings from HTML
     * @param {string} html - HTML content
     * @returns {Array} Array of headings
     */
    extractHeadings(html) {
        const headings = [];
        const headingRegex = /<h([1-6])[^>]*>([^<]+)<\/h[1-6]>/gi;
        let match;
        
        while ((match = headingRegex.exec(html)) !== null) {
            headings.push({
                level: parseInt(match[1]),
                text: match[2].trim()
            });
        }
        
        return headings;
    }

    /**
     * Extract links from HTML
     * @param {string} html - HTML content
     * @returns {Array} Array of links
     */
    extractLinks(html) {
        const links = [];
        const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
        let match;
        
        while ((match = linkRegex.exec(html)) !== null) {
            links.push({
                url: match[1],
                text: match[2].trim()
            });
        }
        
        return links.slice(0, 50); // Limit to first 50 links
    }

    /**
     * Extract paragraphs from HTML
     * @param {string} html - HTML content
     * @returns {Array} Array of paragraph texts
     */
    extractParagraphs(html) {
        const paragraphs = [];
        const paragraphRegex = /<p[^>]*>([^<]+(?:<[^>]+>[^<]*)*)<\/p>/gi;
        let match;
        
        while ((match = paragraphRegex.exec(html)) !== null) {
            const text = match[1].replace(/<[^>]+>/g, '').trim();
            if (text.length > 20) { // Only include substantial paragraphs
                paragraphs.push(text);
            }
        }
        
        return paragraphs.slice(0, 20); // Limit to first 20 paragraphs
    }

    /**
     * Extract metadata from HTML
     * @param {string} html - HTML content
     * @returns {Object} Metadata object
     */
    extractMetadata(html) {
        const metadata = {};
        
        // Extract meta tags
        const metaRegex = /<meta[^>]+name=["']([^"']+)["'][^>]+content=["']([^"']+)["'][^>]*>/gi;
        let match;
        
        while ((match = metaRegex.exec(html)) !== null) {
            metadata[match[1]] = match[2];
        }
        
        // Extract additional info
        metadata.wordCount = (html.match(/\b\w+\b/g) || []).length;
        metadata.imageCount = (html.match(/<img[^>]*>/gi) || []).length;
        metadata.scriptCount = (html.match(/<script[^>]*>/gi) || []).length;
        
        return metadata;
    }

    /**
     * Scrape multiple URLs concurrently
     * @param {Array} urls - Array of URLs to scrape
     * @param {number} concurrency - Number of concurrent requests
     * @returns {Promise<Array>} Array of scraped data
     */
    async scrapeUrls(urls, concurrency = 3) {
        this.stats.startTime = new Date();
        this.stats.totalRequests = urls.length;
        
        console.log(`🚀 Starting to scrape ${urls.length} URLs with concurrency: ${concurrency}`);
        
        const results = [];
        const semaphore = new Array(concurrency).fill(null);
        
        const processUrl = async (url, index) => {
            try {
                console.log(`📡 Scraping: ${url}`);
                const html = await this.makeRequest(url);
                const data = this.parseHTML(html);
                
                const result = {
                    url,
                    index,
                    success: true,
                    data,
                    scrapedAt: new Date().toISOString()
                };
                
                results[index] = result;
                console.log(`✅ Successfully scraped: ${url}`);
                
            } catch (error) {
                const errorResult = {
                    url,
                    index,
                    success: false,
                    error: error.message,
                    scrapedAt: new Date().toISOString()
                };
                
                results[index] = errorResult;
                this.errors.push(errorResult);
                console.log(`❌ Failed to scrape: ${url} - ${error.message}`);
            }
        };

        // Process URLs with concurrency control
        const promises = urls.map(async (url, index) => {
            // Wait for available slot
            await new Promise(resolve => {
                const checkSlot = () => {
                    const availableIndex = semaphore.findIndex(slot => slot === null);
                    if (availableIndex !== -1) {
                        semaphore[availableIndex] = index;
                        resolve();
                    } else {
                        setTimeout(checkSlot, 100);
                    }
                };
                checkSlot();
            });

            await processUrl(url, index);
            
            // Release slot
            const slotIndex = semaphore.findIndex(slot => slot === index);
            if (slotIndex !== -1) {
                semaphore[slotIndex] = null;
            }
        });

        await Promise.all(promises);
        
        this.stats.endTime = new Date();
        this.results = results.filter(r => r); // Remove undefined entries
        
        return this.results;
    }

    /**
     * Analyze scraped data and generate insights
     * @returns {Object} Analysis results
     */
    analyzeData() {
        if (this.results.length === 0) {
            return { error: 'No data to analyze' };
        }

        const successfulResults = this.results.filter(r => r.success);
        const analysis = {
            summary: {
                totalUrls: this.results.length,
                successfulScrapes: successfulResults.length,
                failedScrapes: this.results.length - successfulResults.length,
                successRate: (successfulResults.length / this.results.length * 100).toFixed(2) + '%',
                averageProcessingTime: this.getAverageProcessingTime()
            },
            contentAnalysis: {
                averageWordCount: this.calculateAverage(successfulResults, 'data.metadata.wordCount'),
                averageImageCount: this.calculateAverage(successfulResults, 'data.metadata.imageCount'),
                averageHeadingCount: this.calculateAverage(successfulResults, 'data.headings.length'),
                averageLinkCount: this.calculateAverage(successfulResults, 'data.links.length')
            },
            topDomains: this.getTopDomains(successfulResults),
            commonKeywords: this.getCommonKeywords(successfulResults)
        };

        return analysis;
    }

    /**
     * Calculate average of a nested property
     * @param {Array} results - Results array
     * @param {string} path - Property path
     * @returns {number} Average value
     */
    calculateAverage(results, path) {
        const values = results.map(r => this.getNestedProperty(r, path)).filter(v => v !== undefined);
        return values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0;
    }

    /**
     * Get nested property value
     * @param {Object} obj - Object to traverse
     * @param {string} path - Property path
     * @returns {any} Property value
     */
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    /**
     * Get top domains from scraped URLs
     * @param {Array} results - Successful results
     * @returns {Array} Top domains
     */
    getTopDomains(results) {
        const domains = {};
        results.forEach(result => {
            try {
                const domain = new URL(result.url).hostname;
                domains[domain] = (domains[domain] || 0) + 1;
            } catch (e) {
                // Skip invalid URLs
            }
        });

        return Object.entries(domains)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([domain, count]) => ({ domain, count }));
    }

    /**
     * Extract common keywords from scraped content
     * @param {Array} results - Successful results
     * @returns {Array} Common keywords
     */
    getCommonKeywords(results) {
        const wordCount = {};
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);

        results.forEach(result => {
            if (result.data && result.data.paragraphs) {
                result.data.paragraphs.forEach(paragraph => {
                    const words = paragraph.toLowerCase().match(/\b\w+\b/g) || [];
                    words.forEach(word => {
                        if (word.length > 3 && !stopWords.has(word)) {
                            wordCount[word] = (wordCount[word] || 0) + 1;
                        }
                    });
                });
            }
        });

        return Object.entries(wordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([word, count]) => ({ word, count }));
    }

    /**
     * Get average processing time
     * @returns {string} Average processing time
     */
    getAverageProcessingTime() {
        if (!this.stats.startTime || !this.stats.endTime) {
            return 'N/A';
        }
        
        const totalTime = this.stats.endTime - this.stats.startTime;
        const avgTime = totalTime / this.stats.totalRequests;
        return `${avgTime.toFixed(2)}ms`;
    }

    /**
     * Save results to JSON file
     * @param {string} filename - Output filename
     * @returns {Promise<void>}
     */
    async saveResults(filename) {
        const output = {
            metadata: {
                scrapedAt: new Date().toISOString(),
                totalUrls: this.results.length,
                successfulScrapes: this.results.filter(r => r.success).length,
                stats: this.stats
            },
            results: this.results,
            analysis: this.analyzeData()
        };

        await fs.writeFile(filename, JSON.stringify(output, null, 2));
        console.log(`💾 Results saved to: ${filename}`);
    }

    /**
     * Utility function to add delay
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Main function demonstrating the web scraper
 */
async function main() {
    console.log('🕷️  AI Agent Web Scraper Showcase');
    console.log('=' .repeat(50));

    // Sample URLs for demonstration (using httpbin.org for safe testing)
    const testUrls = [
        'https://httpbin.org/html',
        'https://httpbin.org/json',
        'https://httpbin.org/user-agent',
        'https://httpbin.org/headers',
        'https://httpbin.org/ip'
    ];

    try {
        // Initialize scraper
        const scraper = new WebScraper({
            timeout: 15000,
            maxRetries: 2,
            retryDelay: 1000
        });

        console.log('\n1. Starting web scraping process...');
        
        // Scrape URLs
        const results = await scraper.scrapeUrls(testUrls, 2);
        
        console.log('\n2. Analyzing scraped data...');
        const analysis = scraper.analyzeData();
        
        // Display results
        console.log('\n📊 Scraping Results:');
        console.log(`   ✓ Total URLs processed: ${analysis.summary.totalUrls}`);
        console.log(`   ✓ Successful scrapes: ${analysis.summary.successfulScrapes}`);
        console.log(`   ✓ Success rate: ${analysis.summary.successRate}`);
        console.log(`   ✓ Average processing time: ${analysis.summary.averageProcessingTime}`);
        
        if (analysis.contentAnalysis) {
            console.log('\n📈 Content Analysis:');
            console.log(`   • Average word count: ${analysis.contentAnalysis.averageWordCount}`);
            console.log(`   • Average image count: ${analysis.contentAnalysis.averageImageCount}`);
            console.log(`   • Average heading count: ${analysis.contentAnalysis.averageHeadingCount}`);
            console.log(`   • Average link count: ${analysis.contentAnalysis.averageLinkCount}`);
        }

        // Save results
        console.log('\n3. Saving results...');
        const outputFile = path.join(__dirname, 'scraping_results.json');
        await scraper.saveResults(outputFile);
        
        console.log('\n🎉 Web scraping completed successfully!');
        console.log('   📄 Check scraping_results.json for detailed results');
        
    } catch (error) {
        console.error('❌ Scraping failed:', error.message);
        process.exit(1);
    }
}

// Export for use as module
module.exports = WebScraper;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
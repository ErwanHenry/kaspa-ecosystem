// main.js - Actor Apify pour Kaspa
import { Actor } from 'apify';
import { PlaywrightCrawler } from 'crawlee';

await Actor.init();

const input = await Actor.getInput();
const { startUrls = [], webhookUrl } = input;

// Configuration du crawler
const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 100,
    maxConcurrency: 5,
    
    async requestHandler({ request, page, log }) {
        log.info(`Processing ${request.url}`);
        
        const projectData = {
            sourceUrl: request.url,
            scrapedAt: new Date().toISOString()
        };
        
        try {
            // Logique d'extraction spécifique pour Kaspa
            if (request.url.includes('github.com')) {
                // GitHub project
                projectData.platform = 'github';
                projectData.name = await page.$eval('.repository-content h1', el => el.textContent.trim()).catch(() => '');
                projectData.description = await page.$eval('[itemprop="description"]', el => el.textContent.trim()).catch(() => '');
                projectData.github = request.url.match(/github\.com\/([^/]+\/[^/]+)/)?.[1] || '';
                
                // Get stars
                const stars = await page.$eval('[aria-label*="star"]', el => {
                    const text = el.textContent.trim();
                    return parseInt(text.replace(/[^0-9]/g, '')) || 0;
                }).catch(() => 0);
                projectData.stars = stars;
                
                // Get topics
                const topics = await page.$$eval('.topic-tag', els => 
                    els.map(el => el.textContent.trim())
                ).catch(() => []);
                projectData.tags = topics;
                
                // Determine category based on description and topics
                const content = `${projectData.name} ${projectData.description} ${topics.join(' ')}`.toLowerCase();
                if (content.includes('wallet')) projectData.category = 'Wallet';
                else if (content.includes('defi') || content.includes('dex')) projectData.category = 'DeFi';
                else if (content.includes('mining') || content.includes('pool')) projectData.category = 'Mining';
                else if (content.includes('nft')) projectData.category = 'NFT';
                else if (content.includes('game') || content.includes('gaming')) projectData.category = 'Gaming';
                else if (content.includes('explorer') || content.includes('api')) projectData.category = 'Infrastructure';
                else projectData.category = 'Tools';
                
            } else if (request.url.includes('kaspa.org')) {
                // Official Kaspa site
                projectData.platform = 'official';
                projectData.name = 'Kaspa';
                projectData.category = 'Core';
                projectData.description = await page.$eval('meta[name="description"]', el => el.content).catch(() => 'The fastest pure proof-of-work consensus protocol');
                projectData.url = 'https://kaspa.org';
                projectData.twitter = 'KaspaCurrency';
                projectData.github = 'kaspanet/kaspad';
                projectData.tags = ['blockchain', 'core', 'official'];
                
            } else {
                // Generic website
                projectData.platform = 'website';
                projectData.name = await page.$eval('h1', el => el.textContent.trim()).catch(() => '');
                projectData.description = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');
                projectData.url = request.url;
                
                // Find social links
                const twitterLink = await page.$eval('a[href*="twitter.com"]', el => el.href).catch(() => '');
                if (twitterLink) {
                    projectData.twitter = twitterLink.match(/twitter\.com\/([^/?]+)/)?.[1] || '';
                }
                
                const githubLink = await page.$eval('a[href*="github.com"]', el => el.href).catch(() => '');
                if (githubLink) {
                    projectData.github = githubLink.match(/github\.com\/([^/?]+)/)?.[1] || '';
                }
                
                // Try to determine category from content
                const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
                if (pageText.includes('wallet')) projectData.category = 'Wallet';
                else if (pageText.includes('exchange') || pageText.includes('swap')) projectData.category = 'DeFi';
                else projectData.category = 'Other';
            }
            
            // Only save if we have meaningful data
            if (projectData.name && projectData.name !== '') {
                await Actor.pushData(projectData);
                
                // Send to webhook if configured
                if (webhookUrl && projectData.name) {
                    try {
                        await fetch(webhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                project_data: projectData,
                                submission_type: 'scraper'
                            })
                        });
                        log.info(`Sent ${projectData.name} to webhook`);
                    } catch (error) {
                        log.error(`Webhook error: ${error.message}`);
                    }
                }
            }
            
        } catch (error) {
            log.error(`Error processing ${request.url}: ${error.message}`);
        }
    },
    
    failedRequestHandler({ request, log }) {
        log.error(`Request ${request.url} failed too many times`);
    },
});

// Add start URLs
for (const url of startUrls) {
    await crawler.addRequests([url]);
}

// Run the crawler
await crawler.run();

// Get the results
const dataset = await Actor.openDataset();
const { items } = await dataset.getData();
log.info(`Scraped ${items.length} potential projects`);

await Actor.exit();
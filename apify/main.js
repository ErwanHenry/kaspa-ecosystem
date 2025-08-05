import { Actor } from 'apify';
import { PuppeteerCrawler } from 'crawlee';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://kxdngctxlxrbjhdtztuu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

Actor.main(async () => {
    const input = await Actor.getInput();
    const { projectId, urls = {} } = input;

    console.log(`Starting scraper for project ${projectId}`);

    // Data to collect
    const scrapedData = {
        projectId,
        github: {},
        twitter: {},
        discord: {},
        website: {},
        timestamp: new Date().toISOString()
    };

    // GitHub Scraper
    if (urls.github) {
        try {
            const githubData = await scrapeGitHub(urls.github);
            scrapedData.github = githubData;
        } catch (error) {
            console.error('GitHub scraping error:', error);
        }
    }

    // Twitter Scraper
    if (urls.twitter) {
        try {
            const twitterData = await scrapeTwitter(urls.twitter);
            scrapedData.twitter = twitterData;
        } catch (error) {
            console.error('Twitter scraping error:', error);
        }
    }

    // Discord Scraper (if invite link)
    if (urls.discord) {
        try {
            const discordData = await scrapeDiscord(urls.discord);
            scrapedData.discord = discordData;
        } catch (error) {
            console.error('Discord scraping error:', error);
        }
    }

    // Website Scraper
    if (urls.website) {
        try {
            const websiteData = await scrapeWebsite(urls.website);
            scrapedData.website = websiteData;
        } catch (error) {
            console.error('Website scraping error:', error);
        }
    }

    // Send data to webhook
    if (process.env.WEBHOOK_URL) {
        await sendToWebhook(scrapedData);
    }

    // Store in dataset
    await Actor.pushData(scrapedData);

    console.log('Scraping completed:', scrapedData);
});

async function scrapeGitHub(url) {
    console.log(`Scraping GitHub: ${url}`);
    
    const crawler = new PuppeteerCrawler({
        maxRequestsPerCrawl: 1,
        async requestHandler({ page, request }) {
            await page.goto(request.url, { waitUntil: 'networkidle2' });
            
            // Extract GitHub stats
            const stats = await page.evaluate(() => {
                const getNumber = (selector) => {
                    const element = document.querySelector(selector);
                    if (!element) return 0;
                    const text = element.textContent.trim();
                    return parseInt(text.replace(/[^0-9]/g, '')) || 0;
                };

                return {
                    stars: getNumber('[aria-label*="star"]'),
                    forks: getNumber('[aria-label*="fork"]'),
                    issues: getNumber('[aria-label*="issue"]'),
                    watchers: getNumber('[aria-label*="watching"]')
                };
            });

            // Get last commit date
            const lastCommit = await page.evaluate(() => {
                const commitElement = document.querySelector('relative-time');
                return commitElement ? commitElement.getAttribute('datetime') : null;
            });

            return {
                ...stats,
                lastCommit,
                url
            };
        }
    });

    const [result] = await crawler.run([url]);
    return result || {};
}

async function scrapeTwitter(url) {
    console.log(`Scraping Twitter: ${url}`);
    
    // Twitter requires authentication, so we'll use their API if available
    // For now, return placeholder
    return {
        followers: null,
        tweets: null,
        url,
        note: 'Twitter scraping requires API access'
    };
}

async function scrapeDiscord(inviteUrl) {
    console.log(`Scraping Discord: ${inviteUrl}`);
    
    // Extract invite code
    const inviteCode = inviteUrl.match(/discord\.gg\/([a-zA-Z0-9]+)/)?.[1];
    
    if (!inviteCode) {
        return { error: 'Invalid Discord invite URL' };
    }

    try {
        // Use Discord API to get invite info
        const response = await fetch(`https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`);
        const data = await response.json();
        
        return {
            memberCount: data.approximate_member_count || 0,
            onlineCount: data.approximate_presence_count || 0,
            serverName: data.guild?.name || 'Unknown',
            url: inviteUrl
        };
    } catch (error) {
        return { error: 'Failed to fetch Discord data' };
    }
}

async function scrapeWebsite(url) {
    console.log(`Scraping website: ${url}`);
    
    const crawler = new PuppeteerCrawler({
        maxRequestsPerCrawl: 1,
        async requestHandler({ page, request }) {
            await page.goto(request.url, { waitUntil: 'networkidle2' });
            
            // Extract meta information
            const metaData = await page.evaluate(() => {
                const getMeta = (name) => {
                    const element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
                    return element ? element.getAttribute('content') : null;
                };

                return {
                    title: document.title,
                    description: getMeta('description') || getMeta('og:description'),
                    image: getMeta('og:image'),
                    keywords: getMeta('keywords')
                };
            });

            // Check for social links
            const socialLinks = await page.evaluate(() => {
                const links = {
                    twitter: null,
                    github: null,
                    discord: null,
                    telegram: null
                };

                document.querySelectorAll('a[href]').forEach(link => {
                    const href = link.getAttribute('href');
                    if (href.includes('twitter.com')) links.twitter = href;
                    if (href.includes('github.com')) links.github = href;
                    if (href.includes('discord.gg') || href.includes('discord.com')) links.discord = href;
                    if (href.includes('t.me')) links.telegram = href;
                });

                return links;
            });

            return {
                ...metaData,
                socialLinks,
                url
            };
        }
    });

    const [result] = await crawler.run([url]);
    return result || {};
}

async function sendToWebhook(data) {
    const webhookUrl = process.env.WEBHOOK_URL;
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Apify-Webhook-Secret': webhookSecret || ''
            },
            body: JSON.stringify(data)
        });
        console.log('Data sent to webhook');
    } catch (error) {
        console.error('Webhook error:', error);
    }
}

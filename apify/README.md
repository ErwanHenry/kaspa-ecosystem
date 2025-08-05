# Kaspa Ecosystem Scraper

This Apify Actor scrapes social and technical metrics for Kaspa ecosystem projects.

## Features

- **GitHub Scraping**: Stars, forks, issues, last commit date
- **Discord Scraping**: Member count, online count
- **Website Scraping**: Meta tags, social links discovery
- **Twitter**: Ready for API integration

## Input Schema

```json
{
    "projectId": "uuid-of-project",
    "urls": {
        "github": "https://github.com/kaspanet/kaspad",
        "twitter": "https://twitter.com/KaspaCurrency",
        "discord": "https://discord.gg/kaspa",
        "website": "https://kaspa.org"
    }
}
```

## Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Service role key for Supabase
- `WEBHOOK_URL`: Endpoint to receive scraped data
- `WEBHOOK_SECRET`: Secret for webhook authentication

## Webhook Integration

The Actor sends scraped data to your Netlify function:

```javascript
POST https://your-site.netlify.app/.netlify/functions/webhook-apify

{
    "projectId": "uuid",
    "github": {
        "stars": 1234,
        "forks": 567,
        "issues": 89,
        "lastCommit": "2024-01-15T10:30:00Z"
    },
    "discord": {
        "memberCount": 5000,
        "onlineCount": 1200
    },
    "website": {
        "title": "Project Title",
        "description": "...",
        "socialLinks": {...}
    }
}
```

## Scheduling

Recommended schedule: Every 6 hours for active projects

```json
{
    "cronExpression": "0 */6 * * *"
}
```

## Usage

1. Deploy to Apify platform
2. Set environment variables
3. Create schedule or run manually
4. Data updates automatically in Supabase

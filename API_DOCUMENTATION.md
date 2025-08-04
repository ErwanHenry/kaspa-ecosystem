# API Documentation - Kaspa Ecosystem Directory

## Base URL

Production: `https://your-site.netlify.app/api`
Local: `http://localhost:8888/api`

## Endpoints

### Get All Projects

**GET** `/api/projects`

Retrieves all projects in the Kaspa ecosystem.

#### Response
```json
{
  "projects": [
    {
      "id": "1",
      "name": "Project Name",
      "category": "DeFi",
      "description": "Project description",
      "url": "https://example.com",
      "twitter": "@handle",
      "github": "username",
      "discord": "https://discord.gg/invite",
      "telegram": "https://t.me/channel",
      "tags": ["defi", "wallet"],
      "added": "2024-01-01",
      "lastUpdated": "2024-08-04"
    }
  ],
  "lastUpdate": "2024-08-04T12:00:00.000Z",
  "version": "1.0",
  "totalProjects": 42,
  "categories": ["DeFi", "Gaming", "Infrastructure", "Wallet"]
}
```

### Search Projects

**GET** `/api/projects?q=search_term`

Search projects by name, description, or tags.

#### Query Parameters

- `q` (string): Search term
- `category` (string): Filter by category
- `tags` (string): Filter by tags (comma-separated)

#### Examples

```bash
# Search for wallets
GET /api/projects?q=wallet

# Filter by category
GET /api/projects?category=DeFi

# Filter by multiple tags
GET /api/projects?tags=wallet,mobile

# Combined filters
GET /api/projects?q=kas&category=DeFi&tags=staking
```

## Rate Limiting

- Public endpoints: 100 requests per 15 minutes per IP
- Cached responses: 5 minutes TTL

## Error Responses

### 404 Not Found
```json
{
  "error": "Not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch projects",
  "message": "Internal server error"
}
```

## CORS

All API endpoints support CORS for browser-based applications.

## Authentication

Public endpoints do not require authentication.

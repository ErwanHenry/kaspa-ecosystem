# Kaspa Ecosystem Directory - Public Files

This directory contains the static files for the Kaspa Ecosystem Directory website.

## Files

- `index.html` - Main application file
- `kaspa-ecosystem-data.json` - Initial data file (can be empty or contain sample data)
- `_redirects` - Netlify redirects configuration

## Deployment

This directory is configured as the publish directory in `netlify.toml`.
All files in this directory will be served by Netlify.

## Note

The application uses IndexedDB for local data storage, so it doesn't require a backend server for basic functionality.

# Fixing Cache Issues

## Problem
When deploying updates (especially environment variable changes), browsers may cache:
- Old JavaScript bundles with old API URLs baked in
- The index.html file that references old assets

## Solutions Applied

### 1. Cache-Control Headers
Added to `index.html`:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

### 2. GitHub Pages Headers
Created `public/_headers` to control server-side caching:
- HTML files: no-cache
- Assets: long-term cache (they have content hashes)

### 3. Deploy Script
Use `./scripts/deploy-fresh.sh` instead of `npm run deploy`:
- Cleans old builds
- Adds timestamp query parameters
- Provides clear instructions

## When Cache Issues Occur

### Quick Fix:
1. Open the site in incognito/private mode
2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### For Users:
If users report the chat is broken:
1. Tell them to clear their browser cache
2. Or use incognito mode
3. Wait 5-10 minutes for CDN updates

### Future Prevention:
Consider implementing runtime configuration:
- Load API URLs from a separate config.json
- This avoids rebuilding when URLs change
- See `DEPLOYMENT.md` for implementation details
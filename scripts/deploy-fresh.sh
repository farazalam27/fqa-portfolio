#!/bin/bash
# Deploy with cache busting

echo "Cleaning previous build..."
rm -rf dist

echo "Building with fresh assets..."
npm run build

echo "Adding cache-bust timestamp to index.html..."
TIMESTAMP=$(date +%s)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/\.js\"/\.js?v=$TIMESTAMP\"/g" dist/index.html
    sed -i '' "s/\.css\"/\.css?v=$TIMESTAMP\"/g" dist/index.html
else
    # Linux
    sed -i "s/\.js\"/\.js?v=$TIMESTAMP\"/g" dist/index.html
    sed -i "s/\.css\"/\.css?v=$TIMESTAMP\"/g" dist/index.html
fi

echo "Deploying to GitHub Pages..."
npm run deploy

echo ""
echo "Deployment complete!"
echo "Cache-busted with timestamp: $TIMESTAMP"
echo ""
echo "To ensure the latest version loads:"
echo "1. Wait 5-10 minutes for CDN to update"
echo "2. Clear browser cache or use incognito mode"
echo "3. Visit https://fqa.info"
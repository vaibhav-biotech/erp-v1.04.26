/**
 * Store Router Middleware
 * 
 * Purpose: Detect which store is being accessed and set req.storeName for all routes
 * This enables Option C: Single Backend with Router approach
 * 
 * Detection Methods (in order of priority):
 * 1. X-Store-Name header (sent by frontend)
 * 2. Domain/subdomain parsing (production use)
 * 3. Environment STORE_NAME (fallback for backwards compatibility)
 * 
 * Backwards Compatible: Always has a fallback value
 */

const normalizeStoreName = (value) => {
  const normalized = String(value || '').toLowerCase().trim();

  if (
    normalized === 'plants in garden'
    || normalized === 'plants-in-garden'
    || normalized === 'plantingarden'
  ) {
    return 'plantsingarden';
  }

  return normalized.replace(/\s+/g, '');
};

const storeRouter = (req, res, next) => {
  try {
    // Method 1: Check X-Store-Name header (frontend sends this)
    const storeFromHeader = req.headers['x-store-name'];
    
    // Method 2: Parse from domain/hostname
    const host = req.get('host') || 'localhost:5050'; // e.g., "plantsingarden.localhost", "store2.com"
    const hostParts = host.split(':')[0].toLowerCase().split('.').filter(Boolean); // Remove port, split by dots
    let storeFromDomain = hostParts[0] || 'plantsingarden'; // Get first part (subdomain)

    // Handle www domains (www.plantingarden.com -> plantingarden)
    if (storeFromDomain === 'www' && hostParts.length > 1) {
      storeFromDomain = hostParts[1];
    }

    storeFromDomain = normalizeStoreName(storeFromDomain);
    
    // Method 3: Use environment variable (fallback)
    const storeFromEnv = process.env.STORE_NAME || 'plantsingarden';
    
    // Determine which store to use (priority order) - normalize to lowercase for consistency
    const detectedStore = normalizeStoreName(storeFromHeader || storeFromDomain || storeFromEnv);
    
    // Set store context on request object
    req.storeName = detectedStore;
    
    // Optional: Log store detection for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[storeRouter] Store detected: ${detectedStore} | Header: ${storeFromHeader || 'none'} | Domain: ${storeFromDomain} | Env: ${storeFromEnv}`);
    }
    
    // Store additional config for later use
    req.storeConfig = {
      storeName: detectedStore,
      detectionMethod: storeFromHeader ? 'header' : 'domain',
    };
    
    // Continue to next middleware/route
    next();
    
  } catch (error) {
    console.error('[storeRouter] Error:', error.message);
    // Don't fail the request, just use default
    req.storeName = normalizeStoreName(process.env.STORE_NAME || 'plantsingarden');
    next();
  }
};

module.exports = storeRouter;

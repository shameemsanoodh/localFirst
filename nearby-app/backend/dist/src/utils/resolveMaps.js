import https from 'https';
import http from 'http';
// ─── Coord extraction from a full Google Maps URL ────────────────────────────
function extractCoords(url) {
    const patterns = [
        // @lat,lng,zoom  (most common in share links)
        /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // !3d lat !4d lng  (embed/place format)
        /!3d(-?\d+\.?\d*).*!4d(-?\d+\.?\d*)/,
        // /maps/search/lat,+lng  (redirect target of maps.app.goo.gl short links)
        /\/maps\/search\/(-?\d+\.?\d*)[,+\s]+(-?\d+\.?\d*)/,
        // ?q=lat,lng
        /[?&]q=(-?\d+\.?\d*),(?:\+*)(-?\d+\.?\d*)/,
        // /place/ ... /@lat,lng
        /\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // ll=lat,lng
        /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // center=lat,lng
        /[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    ];
    for (const pattern of patterns) {
        const m = url.match(pattern);
        if (m) {
            const lat = parseFloat(m[1]);
            const lng = parseFloat(m[2]);
            // Sanity check: valid lat/lng ranges
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return { lat, lng };
            }
        }
    }
    return null;
}
// ─── Follow HTTP redirects (up to maxRedirects) ──────────────────────────────
function followRedirects(inputUrl, maxRedirects = 8) {
    return new Promise((resolve, reject) => {
        let redirectCount = 0;
        function fetch(url) {
            if (redirectCount > maxRedirects) {
                return reject(new Error('Too many redirects'));
            }
            const lib = url.startsWith('https') ? https : http;
            const req = lib.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 ' +
                        '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                },
                timeout: 8000,
            }, (res) => {
                const { statusCode, headers } = res;
                // Drain the response body so the socket can be reused
                res.resume();
                // Check coords in the URL itself right now
                const coords = extractCoords(url);
                if (coords) {
                    return resolve(url);
                }
                if (statusCode &&
                    statusCode >= 300 &&
                    statusCode < 400 &&
                    headers.location) {
                    redirectCount++;
                    const nextUrl = headers.location.startsWith('http')
                        ? headers.location
                        : new URL(headers.location, url).href;
                    fetch(nextUrl);
                }
                else {
                    // We've reached the final URL — return it even if no coords found
                    resolve(url);
                }
            });
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timed out'));
            });
        }
        fetch(inputUrl);
    });
}
// ─── Handler ──────────────────────────────────────────────────────────────────
export const handler = async (event) => {
    const cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Content-Type': 'application/json',
    };
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: cors, body: '' };
    }
    const rawUrl = event.queryStringParameters?.url;
    if (!rawUrl) {
        return {
            statusCode: 400,
            headers: cors,
            body: JSON.stringify({ success: false, error: 'url parameter is required' }),
        };
    }
    const decodedUrl = decodeURIComponent(rawUrl);
    // Only allow Google Maps URLs for security
    const allowedHosts = [
        'maps.app.goo.gl',
        'goo.gl',
        'maps.google.com',
        'www.google.com',
        'google.com',
    ];
    try {
        const parsed = new URL(decodedUrl);
        if (!allowedHosts.some(h => parsed.hostname.endsWith(h))) {
            return {
                statusCode: 403,
                headers: cors,
                body: JSON.stringify({ success: false, error: 'Only Google Maps URLs are supported' }),
            };
        }
    }
    catch {
        return {
            statusCode: 400,
            headers: cors,
            body: JSON.stringify({ success: false, error: 'Invalid URL' }),
        };
    }
    try {
        const resolvedUrl = await followRedirects(decodedUrl);
        const coords = extractCoords(resolvedUrl);
        if (coords) {
            return {
                statusCode: 200,
                headers: cors,
                body: JSON.stringify({
                    success: true,
                    data: {
                        lat: coords.lat,
                        lng: coords.lng,
                        resolvedUrl,
                    },
                }),
            };
        }
        else {
            return {
                statusCode: 200,
                headers: cors,
                body: JSON.stringify({
                    success: false,
                    resolvedUrl,
                    error: 'Could not extract coordinates from the resolved URL. Please use a full Google Maps share link.',
                }),
            };
        }
    }
    catch (err) {
        console.error('resolveMaps error:', err);
        return {
            statusCode: 500,
            headers: cors,
            body: JSON.stringify({ success: false, error: err.message || 'Failed to resolve URL' }),
        };
    }
};
//# sourceMappingURL=resolveMaps.js.map
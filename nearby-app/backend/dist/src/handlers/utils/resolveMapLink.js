import https from 'https';
/**
 * Resolve shortened Google Maps links and extract coordinates
 * This bypasses CORS restrictions by resolving URLs on the backend
 */
export const handler = async (event) => {
    try {
        console.log('Resolve map link request received');
        const body = JSON.parse(event.body || '{}');
        const { url } = body;
        if (!url) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ error: 'URL is required' })
            };
        }
        console.log('Resolving URL:', url);
        // Fetch the URL to get the redirect location using native https
        const resolvedUrl = await new Promise((resolve, reject) => {
            const request = https.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; NearByApp/1.0)'
                },
                timeout: 10000 // 10 second timeout
            }, (response) => {
                // Follow redirects manually
                if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
                    const redirectUrl = response.headers.location;
                    if (redirectUrl) {
                        console.log('Following redirect to:', redirectUrl);
                        // Recursively follow redirect
                        https.get(redirectUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (compatible; NearByApp/1.0)'
                            },
                            timeout: 10000
                        }, (finalResponse) => {
                            resolve(finalResponse.url || redirectUrl);
                        }).on('error', reject);
                    }
                    else {
                        reject(new Error('Redirect location not found'));
                    }
                }
                else {
                    resolve(response.url || url);
                }
            });
            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
        console.log('Resolved to:', resolvedUrl);
        // Extract coordinates from the resolved URL
        // Method 1: Direct coordinate extraction (@lat,lng)
        let match = resolvedUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (match) {
            const coords = {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2]),
                resolvedUrl
            };
            console.log('Extracted coordinates:', coords);
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify(coords)
            };
        }
        // Method 2: Query parameters (?q=lat,lng or &ll=lat,lng)
        match = resolvedUrl.match(/[?&](?:q|ll)=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (match) {
            const coords = {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2]),
                resolvedUrl
            };
            console.log('Extracted coordinates from query:', coords);
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify(coords)
            };
        }
        // Method 3: Place links (place/.../@lat,lng)
        match = resolvedUrl.match(/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (match) {
            const coords = {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2]),
                resolvedUrl
            };
            console.log('Extracted coordinates from place:', coords);
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify(coords)
            };
        }
        console.warn('Could not extract coordinates from resolved URL');
        return {
            statusCode: 404,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                error: 'Coordinates not found in URL',
                resolvedUrl
            })
        };
    }
    catch (error) {
        console.error('Error resolving map link:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                error: 'Failed to resolve URL',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};
//# sourceMappingURL=resolveMapLink.js.map
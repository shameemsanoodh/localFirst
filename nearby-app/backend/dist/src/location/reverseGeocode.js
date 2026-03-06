import { LocationClient, SearchPlaceIndexForPositionCommand } from '@aws-sdk/client-location';
const locationClient = new LocationClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const PLACE_INDEX_NAME = 'NearByPlaceIndex';
export const handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const { lat, lng } = body;
        if (!lat || !lng) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: 'Missing required parameters: lat and lng',
                }),
            };
        }
        // Call Amazon Location Service
        const command = new SearchPlaceIndexForPositionCommand({
            IndexName: PLACE_INDEX_NAME,
            Position: [lng, lat], // Amazon Location uses [longitude, latitude] order
            MaxResults: 1,
        });
        const response = await locationClient.send(command);
        if (!response.Results || response.Results.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: 'No location found for the given coordinates',
                }),
            };
        }
        const place = response.Results[0].Place;
        // Extract location components
        const area = place?.Neighborhood ||
            place?.Municipality ||
            place?.SubRegion ||
            'Current Location';
        const city = place?.Municipality ||
            place?.SubRegion ||
            place?.Region ||
            'Unknown City';
        const state = place?.Region || '';
        const country = place?.Country || 'India';
        const formattedAddress = place?.Label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                area,
                city,
                state,
                country,
                formattedAddress,
            }),
        };
    }
    catch (error) {
        console.error('Reverse geocoding error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: 'Failed to reverse geocode location',
                message: error.message,
            }),
        };
    }
};
//# sourceMappingURL=reverseGeocode.js.map
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { response } from '../shared/response.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { lat, lng, radius = 5 } = event.queryStringParameters || {};

    if (!lat || !lng) {
      return response.error('Location (lat, lng) is required', 400, 'INVALID_INPUT');
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const searchRadius = parseFloat(radius as string);

    const OFFERS_TABLE = process.env.OFFERS_TABLE || 'nearby-backend-dev-offers';
    const now = Date.now();

    // Get all active offers
    const scanResult = await docClient.send(new ScanCommand({
      TableName: OFFERS_TABLE,
      FilterExpression: '#status = :active AND expiresAt > :now',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':active': 'active',
        ':now': now
      }
    }));

    const offers = scanResult.Items || [];

    // Filter by distance and add distance to each offer
    const nearbyOffers = offers
      .map(offer => {
        if (!offer.location?.lat || !offer.location?.lng) {
          return null;
        }

        const distance = calculateDistance(
          userLat,
          userLng,
          offer.location.lat,
          offer.location.lng
        );

        if (distance <= searchRadius) {
          return {
            ...offer,
            distance: Math.round(distance * 10) / 10
          };
        }

        return null;
      })
      .filter(offer => offer !== null)
      .sort((a, b) => a!.distance - b!.distance);

    console.log(`Found ${nearbyOffers.length} active offers within ${searchRadius}km`);

    return response.success({
      offers: nearbyOffers,
      count: nearbyOffers.length
    });
  } catch (error: any) {
    console.error('Error fetching active offers:', error);
    return response.error(
      'Failed to fetch offers',
      500,
      'INTERNAL_ERROR',
      { message: error.message }
    );
  }
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

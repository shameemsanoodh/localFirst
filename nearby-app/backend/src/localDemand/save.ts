import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { db, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';

interface LocalDemandEntry {
  query: string;
  detected_category: string;
  locality: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  user_id: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body: LocalDemandEntry = JSON.parse(event.body || '{}');
    const { query, detected_category, locality, coordinates, user_id } = body;

    if (!query || !detected_category || !locality || !coordinates) {
      return response.error('Missing required fields', 400, 'INVALID_INPUT');
    }

    const demandId = uuidv4();
    const now = new Date().toISOString();

    const demandEntry = {
      demandId,
      query,
      detected_category,
      locality,
      lat: coordinates.lat,
      lng: coordinates.lng,
      user_id: user_id || 'anonymous',
      timestamp: now,
      createdAt: now,
    };

    // Save to DynamoDB (you'll need to create a LOCAL_DEMAND table)
    // For now, we'll use a generic approach
    await db.put('nearby-backend-dev-local-demand', demandEntry);

    console.log(`Local demand saved: ${query} in ${locality} (${detected_category})`);

    return response.success({
      message: 'Local demand saved successfully',
      demandId
    }, 201);
  } catch (error) {
    console.error('Save local demand error:', error);
    // Don't fail the request if this fails - it's a background operation
    return response.success({
      message: 'Request processed (demand tracking failed)',
      error: 'TRACKING_FAILED'
    }, 200);
  }
};

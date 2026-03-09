import { APIGatewayProxyHandler } from 'aws-lambda';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const OFFERS_TABLE = process.env.OFFERS_TABLE || 'nearby-backend-dev-offers';

// GET /admin/offers - List all offers
export const listOffers: APIGatewayProxyHandler = async (event) => {
  console.log('List offers request received');

  try {
    const result = await dynamodb.scan({
      TableName: OFFERS_TABLE,
    }).promise();

    const offers = result.Items || [];

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(offers),
    };
  } catch (error) {
    console.error('Error listing offers:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        error: 'Failed to list offers',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// POST /admin/offers - Create global offer
export const createOffer: APIGatewayProxyHandler = async (event) => {
  console.log('Create offer request received');

  try {
    const body = JSON.parse(event.body || '{}');
    const { title, description, expiresAt } = body;

    if (!title || !description) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'Title and description are required' }),
      };
    }

    const offerId = uuidv4();
    const now = new Date().toISOString();

    const offer = {
      offerId,
      merchantId: 'global',
      title,
      description,
      status: 'active',
      isGlobal: true,
      createdAt: now,
      expiresAt: expiresAt || null,
    };

    await dynamodb.put({
      TableName: OFFERS_TABLE,
      Item: offer,
    }).promise();

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(offer),
    };
  } catch (error) {
    console.error('Error creating offer:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        error: 'Failed to create offer',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// PATCH /admin/offers/{id}/status - Update offer status
export const updateOfferStatus: APIGatewayProxyHandler = async (event) => {
  const offerId = event.pathParameters?.id;

  if (!offerId) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ error: 'Offer ID is required' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { status } = body;

    if (!status || !['active', 'paused', 'expired'].includes(status)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'Valid status is required (active, paused, expired)' }),
      };
    }

    await dynamodb.update({
      TableName: OFFERS_TABLE,
      Key: { offerId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
      },
    }).promise();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ success: true, message: 'Offer status updated' }),
    };
  } catch (error) {
    console.error('Error updating offer status:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        error: 'Failed to update offer status',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// DELETE /admin/offers/{id} - Delete offer
export const deleteOffer: APIGatewayProxyHandler = async (event) => {
  const offerId = event.pathParameters?.id;

  if (!offerId) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ error: 'Offer ID is required' }),
    };
  }

  try {
    await dynamodb.delete({
      TableName: OFFERS_TABLE,
      Key: { offerId },
    }).promise();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ success: true, message: 'Offer deleted' }),
    };
  } catch (error) {
    console.error('Error deleting offer:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        error: 'Failed to delete offer',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

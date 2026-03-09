import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const QUERIES_TABLE = process.env.QUERIES_TABLE || 'nearby-backend-prod-queries';

// POST /queries - Create a new query/feature request
export const createQuery = async (event: any) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { senderType, senderPhone, message } = body;

    if (!senderType || !senderPhone || !message) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: 'senderType, senderPhone, and message are required'
        })
      };
    }

    const queryId = uuidv4();
    const createdAt = new Date().toISOString();

    await docClient.send(new PutCommand({
      TableName: QUERIES_TABLE,
      Item: {
        queryId,
        senderType,
        senderPhone,
        message,
        status: 'pending',
        createdAt
      }
    }));

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        queryId
      })
    };
  } catch (error) {
    console.error('Error creating query:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to create query'
      })
    };
  }
};

// GET /admin/queries - List all queries
export const listQueries = async (event: any) => {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: QUERIES_TABLE
    }));

    const queries = result.Items || [];
    queries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        queries
      })
    };
  } catch (error) {
    console.error('Error listing queries:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to list queries'
      })
    };
  }
};

// DELETE /admin/queries/{id} - Delete a query
export const deleteQuery = async (event: any) => {
  try {
    const queryId = event.pathParameters?.id;

    if (!queryId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: 'queryId is required'
        })
      };
    }

    await docClient.send(new DeleteCommand({
      TableName: QUERIES_TABLE,
      Key: { queryId }
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Query deleted successfully'
      })
    };
  } catch (error) {
    console.error('Error deleting query:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to delete query'
      })
    };
  }
};

// PATCH /admin/queries/{id}/status - Update query status
export const updateQueryStatus = async (event: any) => {
  try {
    const queryId = event.pathParameters?.id;
    const body = JSON.parse(event.body || '{}');
    const { status } = body;

    if (!queryId || !status) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: 'queryId and status are required'
        })
      };
    }

    await docClient.send(new PutCommand({
      TableName: QUERIES_TABLE,
      Item: {
        queryId,
        status,
        updatedAt: new Date().toISOString()
      }
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Query status updated successfully'
      })
    };
  } catch (error) {
    console.error('Error updating query status:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to update query status'
      })
    };
  }
};

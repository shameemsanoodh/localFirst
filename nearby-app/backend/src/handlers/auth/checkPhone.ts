import { APIGatewayProxyHandler } from 'aws-lambda'
import AWS from 'aws-sdk';
const { DynamoDB } = AWS;

const dynamodb = new DynamoDB.DocumentClient()
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'nearby-users'

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const phone = event.pathParameters?.phone
    
    if (!phone) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'Phone number is required' })
      }
    }

    // Query DynamoDB for user by phone
    const result = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { phone }
    }).promise()

    if (result.Item) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          exists: true,
          role: result.Item.role
        })
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        exists: false,
        role: null
      })
    }
  } catch (error) {
    console.error('Error checking phone:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}

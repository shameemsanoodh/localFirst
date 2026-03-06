import { APIGatewayProxyHandler } from 'aws-lambda'
import AWS from 'aws-sdk';
const { DynamoDB } = AWS;
import { verifyToken } from '../../utils/jwt'

const dynamodb = new DynamoDB.DocumentClient()
const MERCHANTS_TABLE = process.env.DYNAMODB_MERCHANTS_TABLE || 'nearby-merchants'

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Extract token from Authorization header
    const token = event.headers.Authorization?.replace('Bearer ', '')
    
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'No authorization token provided' })
      }
    }

    // Verify token
    const decoded = verifyToken(token)

    // Get merchant profile
    const result = await dynamodb.get({
      TableName: MERCHANTS_TABLE,
      Key: { merchantId: decoded.merchantId }
    }).promise()

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'Merchant not found' })
      }
    }

    // Remove sensitive data
    const { passcode, ...merchantData } = result.Item

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(merchantData)
    }
  } catch (error) {
    console.error('Error getting merchant profile:', error)
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

import { APIGatewayProxyHandler } from 'aws-lambda'
import AWS from 'aws-sdk'
const { DynamoDB } = AWS
import { generateUniqueMerchantId } from '../../utils/generateMerchantId.js'
import { hashPasscode } from '../../utils/hashPassword.js'
import { generateToken } from '../../utils/jwt.js'

const dynamodb = new DynamoDB.DocumentClient()
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'nearby-users'
const MERCHANTS_TABLE = process.env.DYNAMODB_MERCHANTS_TABLE || 'nearby-merchants'

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    console.log('Merchant signup request received')
    const body = JSON.parse(event.body || '{}')
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const {
      phone,
      email,
      passcode,
      shopName,
      ownerName,
      description,
      address,
      majorCategory,
      subCategory,
      capabilities,
      location,
      timing,
      openTime,
      closeTime,
      whatsapp
    } = body

    // Validate required fields
    if (!phone || !email || !passcode || !shopName || !ownerName || !majorCategory || !subCategory || !description || !address) {
      console.log('Validation failed - missing required fields')
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    console.log('Checking if phone exists:', phone)
    // Check if phone already exists
    const existingUser = await dynamodb.query({
      TableName: USERS_TABLE,
      IndexName: 'phone-index',
      KeyConditionExpression: 'phone = :phone',
      ExpressionAttributeValues: {
        ':phone': phone
      }
    }).promise()

    console.log('Existing user query result:', existingUser.Items?.length || 0, 'items found')

    if (existingUser.Items && existingUser.Items.length > 0) {
      const user = existingUser.Items[0]
      console.log('Phone already exists with role:', user.role)
      return {
        statusCode: 409,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          error: user.role === 'customer'
            ? 'Phone registered as customer'
            : 'Phone already registered as merchant'
        })
      }
    }

    console.log('Generating merchant ID...')
    // Generate unique merchant ID
    const merchantId = await generateUniqueMerchantId()
    console.log('Generated merchant ID:', merchantId)

    console.log('Hashing passcode...')
    // Hash passcode
    const hashedPasscode = await hashPasscode(passcode)

    const timestamp = new Date().toISOString()

    console.log('Creating user entry...')
    // Create user entry
    await dynamodb.put({
      TableName: USERS_TABLE,
      Item: {
        phone,
        email,
        role: 'merchant',
        name: ownerName,
        merchantId,
        shopName,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    }).promise()
    console.log('User entry created successfully')

    console.log('Calculating geohash...')
    // Calculate geohash for location-based queries
    let locationGeohash = null;
    if (location?.lat && location?.lng) {
      const ngeohash = await import('ngeohash');
      locationGeohash = ngeohash.default.encode(location.lat, location.lng, 5);
      console.log('Geohash calculated:', locationGeohash)
    }

    console.log('Creating merchant entry...')
    // Create merchant entry
    await dynamodb.put({
      TableName: MERCHANTS_TABLE,
      Item: {
        merchantId,
        phone,
        email,
        passcode: hashedPasscode,
        shopName,
        ownerName,
        description,
        address,
        majorCategory,
        subCategory,
        capabilities: capabilities || [],
        capabilities_enabled: capabilities || [], // For broadcast matching
        location: location || {},
        location_geohash: locationGeohash,
        timing: timing || { openHour: 9, closeHour: 21 },
        openTime: openTime || '09:00',
        closeTime: closeTime || '21:00',
        whatsapp: whatsapp || phone,
        isOpen: false,
        is_live: false, // For broadcast matching
        isVerified: false,
        onboardingCompleted: true, // Mark onboarding as complete
        createdAt: timestamp,
        updatedAt: timestamp
      }
    }).promise()
    console.log('Merchant entry created successfully')

    console.log('Generating JWT token...')
    // Generate JWT token
    const token = generateToken({
      merchantId,
      email,
      role: 'merchant',
      phone
    })

    console.log('Signup completed successfully for merchant:', merchantId)
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: true,
        merchantId,
        token,
        merchant: {
          merchantId,
          shopName,
          email,
          phone,
          ownerName,
          majorCategory,
          subCategory,
          capabilities,
          onboardingCompleted: true
        }
      })
    }
  } catch (error: any) {
    console.error('Error in merchant signup:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    })
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}

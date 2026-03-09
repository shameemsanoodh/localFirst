import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nearby-app-secret-key-change-in-production';

// Hardcoded admin credentials (in production, use DynamoDB or Cognito)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@nearby.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// POST /admin/login - Admin login
export const adminLogin = async (event: any) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: 'Email and password are required'
        })
      };
    }

    // Verify credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: 'Invalid credentials'
        })
      };
    }

    // Generate JWT with admin role
    const token = jwt.sign(
      {
        email,
        role: 'admin',
        userId: 'admin-user'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        token,
        user: {
          email,
          role: 'admin'
        }
      })
    };
  } catch (error) {
    console.error('Error in admin login:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to login'
      })
    };
  }
};

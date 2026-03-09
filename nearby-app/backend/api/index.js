import express from 'express';
import cors from 'cors';

// Import all handlers
import { handler as merchantLogin } from '../dist/src/handlers/auth/merchantLogin.js';
import { handler as merchantSignup } from '../dist/src/handlers/auth/merchantSignup.js';
import { handler as merchantUpdateStatus } from '../dist/src/merchant/updateStatus.js';
import { handler as merchantTrackInteraction } from '../dist/src/merchant/trackInteraction.js';

import { handler as authRegister } from '../dist/src/auth/register.js';
import { handler as authLogin } from '../dist/src/auth/login.js';

import { handler as getCategories } from '../dist/src/categories/get.js';
import { handler as getNearbyShops } from '../dist/src/shops/getNearby.js';

import { handler as createBroadcast } from '../dist/src/broadcasts/create.js';
import { handler as getBroadcasts } from '../dist/src/broadcasts/get.js';
import { handler as respondToBroadcast } from '../dist/src/broadcasts/respond.js';

import { handler as getActiveOffers } from '../dist/src/offers/getActiveOffers.js';
import { handler as createMerchantOffer } from '../dist/src/offers/createMerchantOffer.js';
import { handler as updateOfferStatus } from '../dist/src/offers/updateOfferStatus.js';

import { handler as registerDevice } from '../dist/src/devices/registerDevice.js';
import { handler as broadcastStats } from '../dist/src/analytics/broadcastStats.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/dev/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Helper to convert Lambda handler to Express route
const lambdaToExpress = (handler) => async (req, res) => {
  try {
    const event = {
      body: JSON.stringify(req.body),
      headers: req.headers,
      pathParameters: req.params,
      queryStringParameters: req.query,
      requestContext: {
        authorizer: req.headers.authorization ? { claims: {} } : undefined
      }
    };

    const result = await handler(event);
    
    res.status(result.statusCode || 200)
      .set(result.headers || {})
      .send(result.body);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Merchant routes
app.post('/dev/merchants/login', lambdaToExpress(merchantLogin));
app.post('/dev/merchants/signup', lambdaToExpress(merchantSignup));
app.put('/dev/merchants/:merchantId/status', lambdaToExpress(merchantUpdateStatus));
app.post('/dev/merchants/:merchantId/interactions', lambdaToExpress(merchantTrackInteraction));

// Auth routes
app.post('/dev/auth/register', lambdaToExpress(authRegister));
app.post('/dev/auth/login', lambdaToExpress(authLogin));

// Categories
app.get('/dev/categories', lambdaToExpress(getCategories));

// Shops
app.get('/dev/shops/nearby', lambdaToExpress(getNearbyShops));

// Broadcasts
app.post('/dev/broadcasts', lambdaToExpress(createBroadcast));
app.get('/dev/broadcasts', lambdaToExpress(getBroadcasts));
app.post('/dev/broadcasts/:broadcastId/respond', lambdaToExpress(respondToBroadcast));

// Offers
app.get('/dev/offers/active', lambdaToExpress(getActiveOffers));
app.post('/dev/merchant/broadcast-offers', lambdaToExpress(createMerchantOffer));
app.put('/dev/offers/:offerId/status', lambdaToExpress(updateOfferStatus));

// Devices
app.post('/dev/devices/register', lambdaToExpress(registerDevice));

// Analytics
app.get('/dev/analytics/broadcasts', lambdaToExpress(broadcastStats));

export default app;

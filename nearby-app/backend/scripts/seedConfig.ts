import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'nearby-backend-prod-config';

async function seedConfig() {
  try {
    // Seed searchRadiusKm
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        configKey: 'searchRadiusKm',
        value: 3,
        updatedAt: new Date().toISOString()
      }
    }));
    console.log('✓ Seeded searchRadiusKm = 3');

    // Seed globalOffersEnabled
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        configKey: 'globalOffersEnabled',
        value: true,
        updatedAt: new Date().toISOString()
      }
    }));
    console.log('✓ Seeded globalOffersEnabled = true');

    console.log('\n✅ Config table seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding config:', error);
    process.exit(1);
  }
}

seedConfig();

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
export const docClient = DynamoDBDocumentClient.from(client);
// Use direct environment variables set in serverless.yml
export const Tables = {
    USERS: process.env.USERS_TABLE,
    MERCHANTS: process.env.MERCHANTS_TABLE,
    CATEGORIES: process.env.CATEGORIES_TABLE,
    OFFERS: process.env.OFFERS_TABLE,
    BROADCASTS: process.env.BROADCASTS_TABLE,
    ORDERS: process.env.ORDERS_TABLE,
    SHOPS: process.env.SHOPS_TABLE,
};
export const db = {
    get: async (tableName, key) => {
        const command = new GetCommand({ TableName: tableName, Key: key });
        const result = await docClient.send(command);
        return result.Item;
    },
    put: async (tableName, item) => {
        const command = new PutCommand({ TableName: tableName, Item: item });
        await docClient.send(command);
        return item;
    },
    query: async (params) => {
        const command = new QueryCommand(params);
        const result = await docClient.send(command);
        return result.Items || [];
    },
    scan: async (tableName) => {
        const command = new ScanCommand({ TableName: tableName });
        const result = await docClient.send(command);
        return result.Items || [];
    },
    update: async (tableName, key, updates) => {
        const updateExpression = 'SET ' + Object.keys(updates).map(k => `#${k} = :${k}`).join(', ');
        const expressionAttributeNames = Object.keys(updates).reduce((acc, k) => {
            acc[`#${k}`] = k;
            return acc;
        }, {});
        const expressionAttributeValues = Object.entries(updates).reduce((acc, [k, v]) => {
            acc[`:${k}`] = v;
            return acc;
        }, {});
        const command = new UpdateCommand({
            TableName: tableName,
            Key: key,
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
        });
        const result = await docClient.send(command);
        return result.Attributes;
    },
    delete: async (tableName, key) => {
        const command = new DeleteCommand({ TableName: tableName, Key: key });
        await docClient.send(command);
    },
};
//# sourceMappingURL=db.js.map
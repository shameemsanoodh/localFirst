import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
export declare const docClient: DynamoDBDocumentClient;
export declare const Tables: {
    USERS: string;
    MERCHANTS: string;
    CATEGORIES: string;
    OFFERS: string;
    BROADCASTS: string;
    ORDERS: string;
    SHOPS: string;
};
export declare const db: {
    get: (tableName: string, key: Record<string, unknown>) => Promise<Record<string, any>>;
    put: (tableName: string, item: Record<string, unknown>) => Promise<Record<string, unknown>>;
    query: (params: any) => Promise<Record<string, any>[]>;
    scan: (tableName: string) => Promise<Record<string, any>[]>;
    update: (tableName: string, key: Record<string, unknown>, updates: Record<string, unknown>) => Promise<Record<string, any> | undefined>;
    delete: (tableName: string, key: Record<string, unknown>) => Promise<void>;
};
//# sourceMappingURL=db.d.ts.map
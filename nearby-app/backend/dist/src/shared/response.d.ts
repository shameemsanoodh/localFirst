export declare const response: {
    success: (data: unknown, statusCode?: number) => {
        statusCode: number;
        headers: {
            'Content-Type': string;
            'Access-Control-Allow-Origin': string;
            'Access-Control-Allow-Headers': string;
            'Access-Control-Allow-Methods': string;
        };
        body: string;
    };
    error: (message: string, statusCode?: number, code?: string, details?: any) => {
        statusCode: number;
        headers: {
            'Content-Type': string;
            'Access-Control-Allow-Origin': string;
            'Access-Control-Allow-Headers': string;
            'Access-Control-Allow-Methods': string;
        };
        body: string;
    };
};
//# sourceMappingURL=response.d.ts.map
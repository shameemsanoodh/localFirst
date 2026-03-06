const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-User-Id',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

export const response = {
  success: (data: unknown, statusCode = 200) => ({
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    }),
  }),

  error: (message: string, statusCode = 400, code = 'ERROR') => ({
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({
      success: false,
      error: {
        code,
        message,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    }),
  }),
};

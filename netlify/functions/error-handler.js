// Centralized error handling utilities for Netlify functions

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
};

// Error types and their safe messages
const ERROR_TYPES = {
    VALIDATION: 'validation',
    AUTHENTICATION: 'authentication',
    AUTHORIZATION: 'authorization',
    NOT_FOUND: 'not_found',
    RATE_LIMIT: 'rate_limit',
    SERVER: 'server',
    CONFIG: 'configuration'
};

const SAFE_ERROR_MESSAGES = {
    [ERROR_TYPES.VALIDATION]: 'Invalid request data',
    [ERROR_TYPES.AUTHENTICATION]: 'Authentication required',
    [ERROR_TYPES.AUTHORIZATION]: 'Access denied',
    [ERROR_TYPES.NOT_FOUND]: 'Resource not found',
    [ERROR_TYPES.RATE_LIMIT]: 'Too many requests',
    [ERROR_TYPES.SERVER]: 'Internal server error',
    [ERROR_TYPES.CONFIG]: 'Service temporarily unavailable'
};

const HTTP_STATUS_CODES = {
    [ERROR_TYPES.VALIDATION]: 400,
    [ERROR_TYPES.AUTHENTICATION]: 401,
    [ERROR_TYPES.AUTHORIZATION]: 403,
    [ERROR_TYPES.NOT_FOUND]: 404,
    [ERROR_TYPES.RATE_LIMIT]: 429,
    [ERROR_TYPES.SERVER]: 500,
    [ERROR_TYPES.CONFIG]: 503
};

// Generate a unique request ID for tracking
const generateRequestId = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
};

// Determine error type from error object
const determineErrorType = (error) => {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid') || message.includes('validation') || 
        message.includes('required') || message.includes('must be')) {
        return ERROR_TYPES.VALIDATION;
    }
    
    if (message.includes('authentication') || message.includes('token') ||
        message.includes('login') || message.includes('credentials')) {
        return ERROR_TYPES.AUTHENTICATION;
    }
    
    if (message.includes('authorization') || message.includes('permission') ||
        message.includes('access denied') || message.includes('forbidden')) {
        return ERROR_TYPES.AUTHORIZATION;
    }
    
    if (message.includes('not found') || message.includes('missing') ||
        error.code === 404) {
        return ERROR_TYPES.NOT_FOUND;
    }
    
    if (message.includes('rate limit') || message.includes('too many')) {
        return ERROR_TYPES.RATE_LIMIT;
    }
    
    if (message.includes('configuration') || message.includes('missing required') ||
        message.includes('service account') || message.includes('environment')) {
        return ERROR_TYPES.CONFIG;
    }
    
    return ERROR_TYPES.SERVER;
};

// Safe logging that doesn't expose sensitive data
const safeLog = (level, message, error, context = {}) => {
    const timestamp = new Date().toISOString();
    const requestId = context.requestId || generateRequestId();
    
    // Basic log entry without sensitive data
    const logEntry = {
        timestamp,
        level,
        message,
        requestId,
        errorType: determineErrorType(error),
        userAgent: context.userAgent ? context.userAgent.substring(0, 100) : undefined,
        ip: context.ip,
        method: context.method,
        path: context.path
    };
    
    // Log to console with safe information only
    if (level === 'error') {
        console.error(`[${timestamp}] ERROR [${requestId}]: ${message}`);
        if (process.env.NODE_ENV === 'development') {
            console.error('Error details:', error.message);
        }
    } else {
        console.log(`[${timestamp}] ${level.toUpperCase()} [${requestId}]: ${message}`);
    }
    
    return requestId;
};

// Create standardized error response
const createErrorResponse = (error, context = {}) => {
    const requestId = context.requestId || generateRequestId();
    const errorType = determineErrorType(error);
    const statusCode = HTTP_STATUS_CODES[errorType];
    const safeMessage = SAFE_ERROR_MESSAGES[errorType];
    
    // Log the error safely
    safeLog('error', 'Request failed', error, { ...context, requestId });
    
    // Create response with minimal information exposure
    const response = {
        error: safeMessage,
        type: errorType,
        timestamp: new Date().toISOString(),
        requestId
    };
    
    // Only include detailed message for validation errors (safe to expose)
    if (errorType === ERROR_TYPES.VALIDATION && error.message) {
        response.details = error.message;
    }
    
    return {
        statusCode,
        headers,
        body: JSON.stringify(response)
    };
};

// Wrapper for handling async functions with error catching
const withErrorHandling = (handler) => {
    return async (event, context) => {
        const requestContext = {
            requestId: generateRequestId(),
            method: event.httpMethod,
            path: event.path,
            ip: event.headers['x-forwarded-for'] || event.headers['X-Forwarded-For'],
            userAgent: event.headers['user-agent'] || event.headers['User-Agent']
        };
        
        try {
            // Log request start
            safeLog('info', `Request started: ${event.httpMethod} ${event.path}`, null, requestContext);
            
            // Execute the handler
            const result = await handler(event, context, requestContext);
            
            // Log successful completion
            safeLog('info', `Request completed successfully`, null, requestContext);
            
            return result;
            
        } catch (error) {
            // Handle and format error response
            return createErrorResponse(error, requestContext);
        }
    };
};

// Validate common request patterns
const validateRequest = (event, options = {}) => {
    const { allowedMethods = ['GET'], requireAuth = false, requireBody = false } = options;
    
    // Check HTTP method
    if (!allowedMethods.includes(event.httpMethod)) {
        throw new Error(`Method ${event.httpMethod} not allowed`);
    }
    
    // Check for required body
    if (requireBody && (!event.body || event.body.trim() === '')) {
        throw new Error('Request body is required');
    }
    
    // Basic authentication check (if JWT token required)
    if (requireAuth) {
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Authentication token required');
        }
    }
    
    return true;
};

// Parse and validate JSON body
const parseJsonBody = (event) => {
    if (!event.body) {
        return {};
    }
    
    try {
        const parsed = JSON.parse(event.body);
        if (typeof parsed !== 'object' || parsed === null) {
            throw new Error('Request body must be a valid JSON object');
        }
        return parsed;
    } catch (error) {
        throw new Error('Invalid JSON in request body');
    }
};

module.exports = {
    ERROR_TYPES,
    headers,
    withErrorHandling,
    createErrorResponse,
    validateRequest,
    parseJsonBody,
    safeLog,
    generateRequestId
};
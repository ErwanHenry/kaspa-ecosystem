const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

// Admin credentials validation
const validateAdminCredentials = async (username, password) => {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    
    if (!adminUsername || !adminPasswordHash) {
        throw new Error('Admin credentials not configured');
    }
    
    if (username !== adminUsername) {
        return false;
    }
    
    return await bcrypt.compare(password, adminPasswordHash);
};

// Generate JWT token
const generateToken = (username) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT secret not configured');
    }
    
    return jwt.sign(
        { 
            username, 
            role: 'admin',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        },
        secret
    );
};

// Verify JWT token
const verifyToken = (token) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT secret not configured');
    }
    
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        return null;
    }
};

exports.handler = async (event, context) => {
    // Handle OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { action, username, password, token } = JSON.parse(event.body || '{}');

        switch (action) {
            case 'login':
                if (!username || !password) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ 
                            error: 'Missing credentials',
                            message: 'Username and password are required'
                        })
                    };
                }

                const isValid = await validateAdminCredentials(username, password);
                if (!isValid) {
                    // Add delay to prevent brute force attacks
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    return {
                        statusCode: 401,
                        headers,
                        body: JSON.stringify({ 
                            error: 'Invalid credentials',
                            message: 'Username or password is incorrect'
                        })
                    };
                }

                const authToken = generateToken(username);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        success: true,
                        token: authToken,
                        expiresIn: '24h'
                    })
                };

            case 'verify':
                if (!token) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ 
                            error: 'Missing token',
                            message: 'Token is required for verification'
                        })
                    };
                }

                const decoded = verifyToken(token);
                if (!decoded) {
                    return {
                        statusCode: 401,
                        headers,
                        body: JSON.stringify({ 
                            error: 'Invalid token',
                            message: 'Token is expired or invalid'
                        })
                    };
                }

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        valid: true,
                        username: decoded.username,
                        role: decoded.role
                    })
                };

            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        error: 'Invalid action',
                        message: 'Supported actions: login, verify'
                    })
                };
        }

    } catch (error) {
        console.error('Admin auth error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: 'Authentication service temporarily unavailable'
            })
        };
    }
};

// Export verification function for use in other functions
exports.verifyAdminToken = verifyToken;
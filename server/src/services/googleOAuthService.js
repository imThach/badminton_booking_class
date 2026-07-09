const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');

const GOOGLE_CALLBACK_PATH = '/api/v1/auth/google/callback';

const assertGoogleConfig = () => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        throw new AppError('Google OAuth is not configured', 500);
    }
};

const getRedirectUri = () =>
    process.env.GOOGLE_REDIRECT_URI ||
    `${String(process.env.SERVER_URL || 'http://localhost:3001').replace(/\/+$/, '')}${GOOGLE_CALLBACK_PATH}`;

exports.GOOGLE_CALLBACK_PATH = GOOGLE_CALLBACK_PATH;

exports.createState = () => crypto.randomBytes(32).toString('hex');

exports.getAuthUrl = (state) => {
    assertGoogleConfig();

    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: getRedirectUri(),
        response_type: 'code',
        scope: 'openid email profile',
        state,
        prompt: 'select_account',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

const exchangeCode = async (code) => {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: getRedirectUri(),
            grant_type: 'authorization_code',
        }),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) {
        throw new AppError('Could not exchange the Google authorization code', 401);
    }

    return tokens;
};

exports.getProfileFromCode = async (code) => {
    assertGoogleConfig();

    const tokens = await exchangeCode(code);
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.sub || !profile.email || !profile.email_verified) {
        throw new AppError('Google account email is not verified', 401);
    }

    return {
        googleId: profile.sub,
        email: profile.email,
        name: profile.name,
        avatar: profile.picture,
    };
};

exports.signPendingSignup = (profile) => jwt.sign(
    { ...profile, purpose: 'google-signup' },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
);

exports.verifyPendingSignup = (token) => {
    if (!token) {
        throw new AppError('Google signup request has expired', 401);
    }

    try {
        const profile = jwt.verify(token, process.env.JWT_SECRET);
        if (profile.purpose !== 'google-signup') throw new Error('Invalid purpose');
        return profile;
    } catch {
        throw new AppError('Google signup request has expired', 401);
    }
};

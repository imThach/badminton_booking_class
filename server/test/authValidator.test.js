const assert = require('node:assert/strict');
const test = require('node:test');
const {
    validateLoginPayload,
    validateResendOTPPayload,
    validateSignupPayload,
    validateVerifyOTPPayload,
    validatePhone,
} = require('../src/validators/authValidator');

test('validateSignupPayload accepts a valid user signup payload', () => {
    assert.doesNotThrow(() =>
        validateSignupPayload({
            name: 'Court Player',
            email: 'player@example.com',
            password: 'password123',
        })
    );
});

test('validateSignupPayload rejects invalid signup fields and values', () => {
    assert.throws(
        () => validateSignupPayload({ email: 'player@example.com', password: 'password123' }),
        /name is required/
    );

    assert.throws(
        () => validateSignupPayload({
            name: 'Court Player',
            email: 'invalid-email',
            password: 'password123',
        }),
        /email must be a valid email address/
    );

    assert.throws(
        () => validateSignupPayload({
            name: 'Court Player',
            email: 'player@example.com',
            password: 'short',
        }),
        /password must be at least 8 characters/
    );

    assert.throws(
        () => validateSignupPayload({
            name: 'Court Player',
            email: 'player@example.com',
            password: 'password123',
            isVerified: true,
        }),
        /isVerified is not allowed/
    );
});

test('validateSignupPayload requires invite code for admin signup', () => {
    assert.throws(
        () => validateSignupPayload({
            name: 'Admin Player',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin',
        }),
        /adminInviteCode is required/
    );
});

test('validateLoginPayload validates login body', () => {
    assert.doesNotThrow(() =>
        validateLoginPayload({
            email: 'player@example.com',
            password: 'password123',
        })
    );

    assert.throws(
        () => validateLoginPayload({ email: 'player@example.com' }),
        /password is required/
    );
});

test('OTP validators require valid email and 6-digit OTP', () => {
    assert.doesNotThrow(() =>
        validateVerifyOTPPayload({
            email: 'player@example.com',
            otp: '123456',
        })
    );

    assert.throws(
        () => validateVerifyOTPPayload({ email: 'player@example.com', otp: '12345' }),
        /otp must be a 6-digit code/
    );

    assert.doesNotThrow(() =>
        validateResendOTPPayload({
            email: 'player@example.com',
        })
    );
});

test('validatePhone accepts formatted numbers with 8 to 15 digits', () => {
    assert.doesNotThrow(() => validatePhone('+84 912 345 678'));
    assert.doesNotThrow(() => validatePhone('(028) 1234-5678'));
    assert.doesNotThrow(() => validatePhone(''));
});

test('validatePhone rejects malformed values and invalid digit counts', () => {
    assert.throws(() => validatePhone('1.......'), /8 to 15 digits/);
    assert.throws(() => validatePhone('1234567'), /8 to 15 digits/);
    assert.throws(() => validatePhone('1234567890123456'), /8 to 15 digits/);
    assert.throws(() => validatePhone('+84 abc 12345678'), /valid phone number format/);
    assert.throws(() => validatePhone('(028 1234-5678'), /valid phone number format/);
});

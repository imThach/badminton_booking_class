const assert = require('node:assert/strict');
const test = require('node:test');
const { validateObjectId } = require('../src/validators/enrollmentValidator');

test('validateObjectId accepts valid enrollment-related object ids', () => {
    assert.doesNotThrow(() => validateObjectId('507f1f77bcf86cd799439011', 'class id'));
});

test('validateObjectId rejects invalid enrollment-related object ids', () => {
    assert.throws(
        () => validateObjectId('not-an-id', 'class id'),
        /Invalid class id/
    );
});

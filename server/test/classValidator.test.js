const assert = require('node:assert/strict');
const test = require('node:test');
const {
    parsePagination,
    validateClassPayload,
    validateObjectId,
} = require('../src/validators/classValidator');

test('parsePagination normalizes invalid and oversized values', () => {
    assert.deepEqual(parsePagination({ limit: '500', page: '-2' }), {
        limit: 100,
        page: 1,
    });

    assert.deepEqual(parsePagination({ limit: '0', page: '3' }), {
        limit: 20,
        page: 3,
    });
});

test('validateObjectId rejects invalid ids', () => {
    assert.throws(
        () => validateObjectId('not-an-id', 'class id'),
        /Invalid class id/
    );
});

test('validateClassPayload requires fields on create', () => {
    assert.throws(
        () => validateClassPayload({ title: 'Only title' }),
        /description is required/
    );
});

test('validateClassPayload validates class domain values', () => {
    assert.throws(
        () => validateClassPayload({ level: 'expert' }, { partial: true }),
        /level must be beginner, intermediate, or advanced/
    );

    assert.throws(
        () => validateClassPayload({ maxStudents: 0 }, { partial: true }),
        /maxStudents must be a positive integer/
    );
});

test('validateClassPayload rejects mass assignment fields', () => {
    assert.throws(
        () => validateClassPayload({ createdBy: 'attacker-user-id' }, { partial: true }),
        /createdBy is not allowed/
    );

    assert.throws(
        () => validateClassPayload({ currentStudents: 99 }, { partial: true }),
        /currentStudents is not allowed/
    );
});

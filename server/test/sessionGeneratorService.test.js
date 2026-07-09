const assert = require('node:assert/strict');
const test = require('node:test');
const { parseSchedule } = require('../src/services/sessionGeneratorService');

test('parseSchedule accepts weekdays with an explicit time range', () => {
    const rule = parseSchedule('Tue/Thu/Sat 18:00-19:30');
    assert.deepEqual(rule.days, [2, 4, 6]);
    assert.equal(rule.start.label, '18:00');
    assert.equal(rule.end.label, '19:30');
});

test('parseSchedule derives daily times from the class date range', () => {
    const rule = parseSchedule('Tue/Thu/Sat', '2026-07-07T11:00:00.000Z', '2026-08-07T12:30:00.000Z');
    assert.deepEqual(rule.days, [2, 4, 6]);
    assert.equal(rule.start.label, '18:00');
    assert.equal(rule.end.label, '19:30');
});

test('parseSchedule supports the common sar typo and rejects invalid daily times', () => {
    assert.deepEqual(parseSchedule('tue/thu/sar', '2026-07-07T11:00:00.000Z', '2026-08-07T12:30:00.000Z').days, [2, 4, 6]);
    assert.equal(parseSchedule('Tue/Thu/Sat', '2026-07-07T13:00:00.000Z', '2026-08-07T11:00:00.000Z'), null);
});

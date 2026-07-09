const Class = require('../models/Class');
const ClassSession = require('../models/ClassSession');
const AppError = require('../utils/appError');

const TIMEZONE_OFFSET_MS = 7 * 60 * 60 * 1000;
const days = {
    sun: 0, sunday: 0, cn: 0,
    mon: 1, monday: 1, t2: 1,
    tue: 2, tuesday: 2, t3: 2,
    wed: 3, wednesday: 3, t4: 3,
    thu: 4, thursday: 4, t5: 4,
    fri: 5, friday: 5, t6: 5,
    sat: 6, sar: 6, saturday: 6, t7: 6,
};

const parseTime = (raw, period) => {
    const [rawHour, rawMinute = 0] = String(raw).split(':').map(Number);
    if (!Number.isInteger(rawHour) || !Number.isInteger(rawMinute) || rawMinute < 0 || rawMinute > 59) return null;
    if (period && (rawHour < 1 || rawHour > 12)) return null;
    if (!period && (rawHour < 0 || rawHour > 23)) return null;
    let hour = rawHour;
    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    return { hour, minute: rawMinute, label: `${String(hour).padStart(2, '0')}:${String(rawMinute).padStart(2, '0')}` };
};

const fallbackTime = (date) => {
    const local = new Date(new Date(date).getTime() + TIMEZONE_OFFSET_MS);
    return parseTime(`${local.getUTCHours()}:${local.getUTCMinutes()}`);
};

const parseSchedule = (value, fallbackStart, fallbackEnd) => {
    const text = String(value || '').trim().toLowerCase();
    const selectedDays = [...new Set(Object.entries(days)
        .filter(([key]) => new RegExp(`(^|[\\s/,;-])${key}(?=$|[\\s/,;-])`).test(text))
        .map(([, day]) => day))];
    if (!selectedDays.length) return null;

    const match = text.match(/(\d{1,2}(?::\d{2})?)\s*(am|pm)?\s*[-–]\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)?/);
    const start = match ? parseTime(match[1], match[2] || match[4]) : fallbackStart && fallbackTime(fallbackStart);
    const end = match ? parseTime(match[3], match[4]) : fallbackEnd && fallbackTime(fallbackEnd);
    if (!start || !end || end.label <= start.label) return null;
    return { days: selectedDays, start, end };
};

exports.parseSchedule = parseSchedule;

exports.generate = async (classId) => {
    const item = await Class.findById(classId);
    if (!item) throw new AppError('Class not found', 404);
    const rule = parseSchedule(item.schedule, item.startDate, item.endDate);
    if (!rule) throw new AppError('Schedule must contain valid weekdays and a valid daily time range', 400);

    const first = new Date(item.startDate.getTime() + TIMEZONE_OFFSET_MS);
    const courseEnd = new Date(item.endDate.getTime() + TIMEZONE_OFFSET_MS);
    const nowLocal = new Date(Date.now() + TIMEZONE_OFFSET_MS);
    const todayEnd = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate(), 23, 59, 59, 999));
    const last = courseEnd < todayEnd ? courseEnd : todayEnd;
    const operations = [];

    await ClassSession.deleteMany({ class: item._id, startDate: { $gt: new Date() }, origin: 'auto' });
    for (let date = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate())); date <= last; date.setUTCDate(date.getUTCDate() + 1)) {
        if (!rule.days.includes(date.getUTCDay())) continue;
        const startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), rule.start.hour - 7, rule.start.minute));
        const endDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), rule.end.hour - 7, rule.end.minute));
        operations.push({ updateOne: { filter: { class: item._id, startDate }, update: { $setOnInsert: { class: item._id, startDate, endDate, location: item.location, capacity: item.maxStudents, origin: 'auto' } }, upsert: true } });
    }
    if (operations.length) await ClassSession.bulkWrite(operations, { ordered: false });
    return ClassSession.find({ class: item._id, startDate: { $lte: new Date() } }).sort('startDate');
};

exports.projectUpcoming = (item, count = 14) => {
    const rule = parseSchedule(item.schedule, item.startDate, item.endDate);
    if (!rule) return [];
    const now = new Date(Date.now() + TIMEZONE_OFFSET_MS);
    const courseStart = new Date(item.startDate.getTime() + TIMEZONE_OFFSET_MS);
    const courseEnd = new Date(item.endDate.getTime() + TIMEZONE_OFFSET_MS);
    const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const limit = new Date(first.getTime() + (count - 1) * 86400000);
    const last = courseEnd < limit ? courseEnd : limit;
    const output = [];
    for (let date = first; date <= last; date = new Date(date.getTime() + 86400000)) {
        if (date < new Date(Date.UTC(courseStart.getUTCFullYear(), courseStart.getUTCMonth(), courseStart.getUTCDate())) || !rule.days.includes(date.getUTCDay())) continue;
        const startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), rule.start.hour - 7, rule.start.minute));
        const endDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), rule.end.hour - 7, rule.end.minute));
        output.push({ key: `${item._id}:${startDate.toISOString()}`, class: { _id: item._id, title: item.title, level: item.level }, startDate, endDate, capacity: item.maxStudents });
    }
    return output;
};

exports.generateDueSessions = async () => {
    const items = await Class.find({ startDate: { $lte: new Date() }, endDate: { $gte: new Date() } }).select('_id');
    for (const item of items) {
        try {
            await exports.generate(item._id);
        } catch (error) {
            console.error(`Session generation failed for ${item._id}:`, error.message);
        }
    }
};

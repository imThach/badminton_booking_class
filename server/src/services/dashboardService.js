const Payment = require('../models/Payment');
const User = require('../models/User');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');

const monthStart = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const addMonths = (date, amount) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
const monthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

exports.getOverview = async () => {
    const now = new Date();
    const currentMonth = monthStart(now);
    const rangeStart = addMonths(currentMonth, -5);
    const nextMonth = addMonths(currentMonth, 1);

    const [revenueRows, studentRows, totalRevenueRows, newStudents, upcomingClasses, capacityRows] = await Promise.all([
        Payment.aggregate([
            { $match: { status: 'paid', paidAt: { $gte: rangeStart } } },
            { $group: { _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } }, revenue: { $sum: '$amount' }, payments: { $sum: 1 } } },
        ]),
        User.aggregate([
            { $match: { role: 'user', createdAt: { $gte: rangeStart } } },
            { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, students: { $sum: 1 } } },
        ]),
        Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        User.countDocuments({ role: 'user', createdAt: { $gte: currentMonth, $lt: nextMonth } }),
        Class.find({ startDate: { $gte: now } })
            .sort({ startDate: 1 }).limit(6)
            .select('title coachName coach startDate schedule location maxStudents currentStudents')
            .populate('coach', 'name photo'),
        Class.aggregate([
            { $match: { startDate: { $gte: now } } },
            { $group: { _id: null, capacity: { $sum: '$maxStudents' } } },
        ]),
    ]);

    const classIds = await Class.find({ startDate: { $gte: now } }).distinct('_id');
    const activeEnrollments = await Enrollment.countDocuments({ class: { $in: classIds }, $or: [{ status: 'active' }, { status: { $exists: false } }] });
    const upcomingIds = upcomingClasses.map((item) => item._id);
    const upcomingCounts = await Enrollment.aggregate([
        { $match: { class: { $in: upcomingIds }, $or: [{ status: 'active' }, { status: { $exists: false } }] } },
        { $group: { _id: '$class', count: { $sum: 1 } } },
    ]);
    const countByClass = new Map(upcomingCounts.map((item) => [String(item._id), item.count]));
    const monthlyMap = new Map(revenueRows.map((row) => [`${row._id.year}-${String(row._id.month).padStart(2, '0')}`, row]));
    const studentMap = new Map(studentRows.map((row) => [`${row._id.year}-${String(row._id.month).padStart(2, '0')}`, row.students]));
    const monthly = Array.from({ length: 6 }, (_, index) => {
        const date = addMonths(rangeStart, index);
        const key = monthKey(date);
        const revenue = monthlyMap.get(key);
        return { month: key, revenue: revenue?.revenue || 0, payments: revenue?.payments || 0, newStudents: studentMap.get(key) || 0 };
    });
    const capacity = capacityRows[0]?.capacity || 0;

    return {
        summary: {
            totalRevenue: totalRevenueRows[0]?.total || 0,
            newStudents,
            upcomingClasses: await Class.countDocuments({ startDate: { $gte: now } }),
            occupancyRate: capacity ? Math.round((activeEnrollments / capacity) * 1000) / 10 : 0,
            activeEnrollments,
            totalCapacity: capacity,
        },
        monthly,
        upcomingClasses: upcomingClasses.map((item) => ({ ...item.toObject(), currentStudents: countByClass.get(String(item._id)) || 0 })),
    };
};

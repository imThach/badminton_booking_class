require('dotenv').config();
const connectDB = require('../src/config/db');
const Class = require('../src/models/Class');
const Enrollment = require('../src/models/Enrollment');

const syncClassCurrentStudents = async () => {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected.');

    console.log('Aggregating enrollment counts...');
    const counts = await Enrollment.aggregate([
        { $group: { _id: '$class', currentStudents: { $sum: 1 } } },
    ]);
    console.log(`Found enrollment data for ${counts.length} classes.`);

    const countByClassId = new Map(
        counts.map((item) => [item._id.toString(), item.currentStudents])
    );

    console.log('Fetching all classes to sync...');
    const classesToSync = await Class.find().select('_id');
    console.log(`Found ${classesToSync.length} total classes.`);

    if (classesToSync.length === 0) {
        console.log('No classes to sync. Exiting.');
        return;
    }

    const bulkOps = classesToSync.map((classItem) => ({
        updateOne: {
            filter: { _id: classItem._id },
            update: { $set: { currentStudents: countByClassId.get(classItem._id.toString()) || 0 } },
        },
    }));

    console.log('Executing bulk update...');
    const result = await Class.bulkWrite(bulkOps);
    console.log('Bulk update complete.');

    console.log(`Synced currentStudents for ${classesToSync.length} classes. Modified: ${result.modifiedCount}.`);
};

syncClassCurrentStudents()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('An error occurred during sync:', error);
        process.exit(1);
    });

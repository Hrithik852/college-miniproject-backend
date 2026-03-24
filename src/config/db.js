const mongoose = require('mongoose');

const connectToDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_ID);
        console.log("Connected to MongoDB Atlas");
    } catch (error) {
        console.error('[MongoDB] Connection failed:', error.message);
        console.error('[MongoDB] Please check:');
        console.error('  1. MongoDB Atlas IP Whitelist - Add your current IP at https://cloud.mongodb.com');
        console.error('  2. Database credentials in .env file');
        console.error('  3. Cluster is active and not paused');
        console.error('  4. Internet connection to reach MongoDB');
        process.exit(1);
    }
};

module.exports = connectToDb;

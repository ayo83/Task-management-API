const mongoose = require('mongoose');
require('dotenv').config();


const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected....');
    } catch (err) {
        console.error(err.message);

        //Exit process with failure
        process.exit(1);
    }
}

module.exports = connectDB;

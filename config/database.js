const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connectionString =
      process.env.NODE_ENV == 'local'
        ? process.env.LOCAL_DB_STRING
        : process.env.STAGING_DB_STRING;
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;

import app from './src/app.js';
import connectDB from './src/config/db.js';
import dotenv from 'dotenv'

dotenv.config();
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
};

start();

import * as dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env' });

async function run() {
  console.log('Starting admin bootstrap/reset...');

  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: This script should not be run in production to prevent accidental resets.');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI is not set in .env');
    process.exit(1);
  }

  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!password) {
    console.error('ERROR: INITIAL_ADMIN_PASSWORD is not set in .env');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('accenture');
    const adminCollection = db.collection('admin');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await adminCollection.updateOne(
      { username: 'admin' },
      {
        $set: {
          passwordHash,
          role: 'super_admin',
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log('Admin account successfully created.');
    } else {
      console.log('Admin account password successfully reset.');
    }
  } catch (error) {
    console.error('An error occurred during bootstrap:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();

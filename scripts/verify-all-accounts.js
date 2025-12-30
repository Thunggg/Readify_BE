/**
 * Script để verify tất cả accounts (update status từ 2 → 1)
 * Chạy: node scripts/verify-all-accounts.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is required. Please set it in your .env file.');
  process.exit(1);
}

async function verifyAllAccounts() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('Readify');
    const accountsCollection = db.collection('accounts');

    // Tìm tất cả accounts có status = 2
    const unverifiedAccounts = await accountsCollection.find({ status: 2 }).toArray();
    console.log(`\n📊 Found ${unverifiedAccounts.length} unverified accounts:`);
    
    unverifiedAccounts.forEach(acc => {
      console.log(`  - ${acc.email} (status: ${acc.status})`);
    });

    if (unverifiedAccounts.length === 0) {
      console.log('\n✅ All accounts are already verified!');
      return;
    }

    // Update tất cả accounts có status = 2 thành status = 1
    const result = await accountsCollection.updateMany(
      { status: 2 },
      { $set: { status: 1 } }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} accounts from status 2 → 1`);
    console.log(`\n🎉 All accounts are now verified! You can login now.`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

verifyAllAccounts();


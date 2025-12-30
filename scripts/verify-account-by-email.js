/**
 * Script để verify một account cụ thể theo email
 * Chạy: node scripts/verify-account-by-email.js <email>
 * Ví dụ: node scripts/verify-account-by-email.js testuser@example.com
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tptai1314_db_user:J8OBdXqjDh2nSTzU@Readify.dyrbkjw.mongodb.net/Readify?retryWrites=true&w=majority&tls=true';

async function verifyAccountByEmail(email) {
  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node scripts/verify-account-by-email.js <email>');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('Readify');
    const accountsCollection = db.collection('accounts');

    // Tìm account
    const account = await accountsCollection.findOne({ email: email.toLowerCase().trim() });

    if (!account) {
      console.error(`❌ Account with email "${email}" not found`);
      process.exit(1);
    }

    console.log(`\n📊 Found account:`);
    console.log(`  - Email: ${account.email}`);
    console.log(`  - Current status: ${account.status}`);
    console.log(`  - Role: ${account.role}`);

    if (account.status === 1) {
      console.log('\n✅ Account is already verified!');
      return;
    }

    // Update status
    const result = await accountsCollection.updateOne(
      { email: email.toLowerCase().trim() },
      { $set: { status: 1 } }
    );

    if (result.modifiedCount === 1) {
      console.log(`\n✅ Successfully verified account "${email}"`);
      console.log(`   Status updated: ${account.status} → 1`);
      console.log(`\n🎉 You can now login with this account!`);
    } else {
      console.log(`\n⚠️  Account was not updated (might already be verified)`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

const email = process.argv[2];
verifyAccountByEmail(email);


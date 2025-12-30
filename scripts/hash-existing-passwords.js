// Script để hash lại password cho các account hiện có trong database
// Chạy: node scripts/hash-existing-passwords.js

const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tptai1314_db_user:J8OBdXqjDh2nSTzU@Readify.dyrbkjw.mongodb.net/Readify?retryWrites=true&w=majority&tls=true';
const SALT_ROUNDS = 10;

async function hashExistingPasswords() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('Readify');
    const accountsCollection = db.collection('accounts');

    // Lấy tất cả accounts có password chưa được hash (plain text)
    // Password đã hash thường bắt đầu bằng $2a$ hoặc $2b$
    const accounts = await accountsCollection.find({
      password: { $not: { $regex: /^\$2[ab]\$/ } },
      isDeleted: { $ne: true },
    }).toArray();

    console.log(`📊 Found ${accounts.length} accounts with plain text passwords`);

    if (accounts.length === 0) {
      console.log('✅ All passwords are already hashed');
      return;
    }

    let updated = 0;
    let skipped = 0;

    for (const account of accounts) {
      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(account.password, SALT_ROUNDS);

        // Update account
        await accountsCollection.updateOne(
          { _id: account._id },
          { $set: { password: hashedPassword } }
        );

        console.log(`✅ Hashed password for: ${account.email}`);
        updated++;
      } catch (error) {
        console.error(`❌ Error hashing password for ${account.email}:`, error.message);
        skipped++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⚠️  Skipped: ${skipped}`);
    console.log(`\n✅ Done!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

hashExistingPasswords();


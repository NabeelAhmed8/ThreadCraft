import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ThreadCraft";

const targetEmail = process.argv[2];

async function run() {
  console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  const usersCollection = db.collection("users");

  let user;
  if (targetEmail) {
    user = await usersCollection.findOne({ email: targetEmail.toLowerCase().trim() });
    if (!user) {
      console.error(`User with email "${targetEmail}" was not found in the database.`);
      process.exit(1);
    }
  } else {
    user = await usersCollection.findOne({}, { sort: { createdAt: -1 } });
    if (!user) {
      console.error("No users found in database. Please register an account first.");
      process.exit(1);
    }
  }

  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { role: "admin", isVerified: true } }
  );

  console.log(`SUCCESS: User "${user.name}" (${user.email}) has been granted the ADMIN role.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

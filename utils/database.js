import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("Please set MONGO_URI in your .env file");
}

let client;
let db;

export async function connectDb() {
  if (db) return db;

  client = new MongoClient(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  db = client.db(); // Default database from URI
  console.log("✅ MongoDB connected");

  return db;
}

export async function getDb() {
  if (!db) {
    return await connectDb();
  }
  return db;
}

import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const client = new MongoClient(process.env.DB_URL);

export async function getDb() {
  if (!client.isConnected()) await client.connect();
  return client.db("color_predict_game");
}

import { getGlobalStats } from '../utils/database.js';

export default function handler(req, res) {
  const stats = getGlobalStats();
  res.status(200).json(stats);
}

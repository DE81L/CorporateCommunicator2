import { pool } from "./db";
import { InsertRequest } from "@shared/schema";

export async function getUserRequests(userId: number) {
  const { rows } = await pool.query(
    `SELECT * FROM requests 
     WHERE sender_id = $1 OR receiver_subdivision_id = $1 
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function createRequest(req: InsertRequest) {
  const {
    creatorId, receiverSubdivisionId, cabinet, phone,
    taskId, customTitle, comment
  } = req;

  const { rows } = await pool.query(
    `INSERT INTO requests 
      (sender_id, receiver_subdivision_id, cabinet, phone,
       task_id, custom_title, comment, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'новая',NOW())
     RETURNING *`,
    [creatorId, receiverSubdivisionId, cabinet, phone,
     taskId, customTitle, comment]
  );
  return rows[0];
}

export async function updateRequestComplete(id: number) {
  const { rows } = await pool.query(
    `UPDATE requests 
       SET status = 'finished', finished_at = NOW()
     WHERE id = $1 
     RETURNING *`,
    [id]
  );
  return rows[0];
}

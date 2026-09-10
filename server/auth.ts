import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { queryOne, runQuery } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "adarsha_mess_room_code_jwt_secret_2026";

export interface TokenPayload {
  userId: string;
  messId: string;
  phone: string;
  role: "SUPER_ADMIN" | "MANAGER" | "STUDENT";
  name: string;
  roomCode?: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "90d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    mess_id: string;
    name: string;
    phone: string;
    role: "SUPER_ADMIN" | "MANAGER" | "STUDENT";
    approved: number;
    active: number;
    isMonthManager?: boolean;
  };
  messId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // Check header x-mess-id
  const headerMessId = req.headers["x-mess-id"] as string;
  if (headerMessId) {
    req.messId = headerMessId;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return next();
  }

  if (decoded.messId) {
    req.messId = decoded.messId;
  }

  const user = queryOne<any>(
    "SELECT id, mess_id, name, phone, role, approved, active FROM users WHERE id = ?",
    [decoded.userId]
  );

  if (user && user.active === 1 && user.approved === 1) {
    req.user = user;
    if (!req.messId) {
      req.messId = user.mess_id;
    }
  }
  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "অননুমোদিত অনুরোধ। অনুগ্রহ করে মেসে যোগ দিন বা নতুন মেস তৈরি করুন।" });
  }
  next();
}

export function requireManagerOrAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "অননুমোদিত অনুরোধ। অনুমতি প্রয়োজন।" });
  }
  if (req.user.role === "SUPER_ADMIN") {
    return next();
  }
  if (req.user.role === "MANAGER") {
    return next();
  }

  // Check if assigned as manager for this month
  const monthId = req.params.monthId || req.body.month_id || req.query.month_id;
  if (monthId) {
    const isAssigned = queryOne(
      "SELECT id FROM manager_assignments WHERE user_id = ? AND month_id = ?",
      [req.user.id, monthId]
    );
    if (isAssigned) {
      return next();
    }
  }

  return res.status(403).json({ error: "আপনার এই কার্যক্রম সম্পন্ন করার ম্যানেজার বা সুপার এডমিন অনুমতি নেই।" });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "শুধুমাত্র সুপার এডমিন (যিনি মেস তৈরি করেছেন) এই পরিবর্তন করতে পারবেন।" });
  }
  next();
}

export function recordAuditLog(
  messId: string | null,
  userId: string | null,
  userName: string | null,
  action: string,
  tableName: string,
  recordId: string | null,
  oldValue: any,
  newValue: any
) {
  try {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    runQuery(
      `INSERT INTO audit_logs (id, mess_id, user_id, user_name, action, table_name, record_id, old_value, new_value, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        messId,
        userId,
        userName,
        action,
        tableName,
        recordId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        now,
      ]
    );
  } catch (e) {
    console.error("Failed to record audit log:", e);
  }
}

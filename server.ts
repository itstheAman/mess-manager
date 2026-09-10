import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  getDb,
  queryAll,
  queryOne,
  runQuery,
  generateUniqueRoomCode,
  clearMessTransactions,
} from "./server/db";
import { calculateMonthSummary } from "./server/calculations";
import {
  authMiddleware,
  generateToken,
  requireAdmin,
  requireAuth,
  requireManagerOrAdmin,
  recordAuditLog,
  AuthRequest,
} from "./server/auth";

const PORT = 3000;

async function startServer() {
  // Ensure DB initialized
  await getDb();

  const app = express();
  app.use(express.json());
  app.use(authMiddleware);

  // ----------------------------------------------------
  // Health check
  // ----------------------------------------------------
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "আদর্শ মেস - Adarsha Mess", time: new Date().toISOString() });
  });

  // ----------------------------------------------------
  // MESS & ROOM-CODE ROUTES (No traditional register/login)
  // ----------------------------------------------------

  // 1. Create a Mess (Generates unique 6-digit Room Code, Creator is Super Admin)
  app.post("/api/mess/create", (req, res) => {
    const { messName, creatorName, phone } = req.body;
    if (!messName || !creatorName || !phone) {
      return res.status(400).json({ error: "মেসের নাম, আপনার নাম এবং মোবাইল নম্বর আবশ্যক।" });
    }

    const cleanMessName = messName.trim();
    const cleanCreatorName = creatorName.trim();
    const cleanPhone = phone.trim();

    if (cleanMessName.length < 2) {
      return res.status(400).json({ error: "মেসের নাম কমপক্ষে ২ অক্ষরের হতে হবে।" });
    }
    if (cleanCreatorName.length < 2) {
      return res.status(400).json({ error: "আপনার নাম কমপক্ষে ২ অক্ষরের হতে হবে।" });
    }
    if (cleanPhone.length < 6) {
      return res.status(400).json({ error: "সঠিক মোবাইল নম্বর প্রদান করুন।" });
    }

    // Generate unique 6-digit room code
    const roomCode = generateUniqueRoomCode();
    const messId = `mess_${Date.now()}`;
    const creatorId = `u_${Date.now()}`;
    const now = new Date().toISOString();

    // 1. Create Mess
    runQuery(
      `INSERT INTO messes (id, name, code, creator_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [messId, cleanMessName, roomCode, creatorId, now, now]
    );

    // 2. Create Creator User (SUPER_ADMIN)
    runQuery(
      `INSERT INTO users (id, mess_id, name, phone, role, approved, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'SUPER_ADMIN', 1, 1, ?, ?)`,
      [creatorId, messId, cleanCreatorName, cleanPhone, now, now]
    );

    // 3. Create initial month (Current Month)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthNum = currentDate.getMonth() + 1; // 1-12
    const bengaliMonthNames = [
      "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
      "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
    ];
    const bengaliNumerals = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    const toBengaliNumber = (num: number) =>
      num.toString().split("").map((d) => bengaliNumerals[parseInt(d, 10)] || d).join("");

    const monthName = `${bengaliMonthNames[currentMonthNum - 1]} ${toBengaliNumber(currentYear)}`;
    const monthId = `month_${messId}_${currentYear}_${currentMonthNum < 10 ? "0" + currentMonthNum : currentMonthNum}`;

    runQuery(
      `INSERT INTO monthly_periods (
        id, mess_id, name, month, year, status, active_student_count, fixed_curry_meals,
        morning_meal_value, lunch_meal_value, dinner_meal_value,
        include_bran_in_rice_calculation, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'OPEN', 1, 56.0, 0.5, 1.0, 1.0, 0, ?, ?)`,
      [monthId, messId, monthName, currentMonthNum, currentYear, now, now]
    );

    // 4. Default Settings
    const defaultSettings = [
      ["mess_name", cleanMessName],
      ["currency", "৳"],
      ["default_fixed_curry_meals", "56"],
      ["default_morning_meal", "0.5"],
      ["default_lunch_meal", "1.0"],
      ["default_dinner_meal", "1.0"],
      ["include_bran_default", "0"],
    ];

    for (const [k, v] of defaultSettings) {
      runQuery(
        `INSERT OR REPLACE INTO system_settings (mess_id, key, value) VALUES (?, ?, ?)`,
        [messId, k, v]
      );
    }

    // 5. Initial Audit Log
    recordAuditLog(
      messId,
      creatorId,
      cleanCreatorName,
      "MESS_CREATE",
      "messes",
      messId,
      null,
      { messName: cleanMessName, roomCode, creator: cleanCreatorName }
    );

    // 6. Generate Token
    const token = generateToken({
      userId: creatorId,
      messId,
      phone: cleanPhone,
      role: "SUPER_ADMIN",
      name: cleanCreatorName,
      roomCode,
    });

    const mess = {
      id: messId,
      name: cleanMessName,
      code: roomCode,
      creator_id: creatorId,
    };

    const user = {
      id: creatorId,
      mess_id: messId,
      name: cleanCreatorName,
      phone: cleanPhone,
      role: "SUPER_ADMIN",
      approved: 1,
      active: 1,
    };

    res.json({
      success: true,
      mess,
      user,
      token,
      message: `অভিনন্দন! আপনার মেস সফলভাবে তৈরি হয়েছে। রুম কোড: ${roomCode}`,
    });
  });

  // 2. Join a Mess (Enter Name, Phone, and 6-Digit Room Code)
  app.post("/api/mess/join", (req, res) => {
    const { name, phone, roomCode } = req.body;
    if (!name || !phone || !roomCode) {
      return res.status(400).json({ error: "আপনার নাম, মোবাইল নম্বর এবং ৬ ডিজিটের রুম কোড আবশ্যক।" });
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanCode = roomCode.toString().trim().toUpperCase();

    if (cleanName.length < 2) {
      return res.status(400).json({ error: "আপনার নাম সঠিকভাবে লিখুন।" });
    }
    if (cleanPhone.length < 6) {
      return res.status(400).json({ error: "সঠিক মোবাইল নম্বর প্রদান করুন।" });
    }

    // Lookup mess by 6-digit room code
    const mess = queryOne<any>("SELECT * FROM messes WHERE code = ?", [cleanCode]);
    if (!mess) {
      return res.status(404).json({
        error: "প্রদত্ত ৬ ডিজিটের রুম কোডটি সঠিক নয় বা এই কোডে কোনো মেস খুঁজে পাওয়া যায়নি। কোডটি পুনরায় যাচাই করুন।",
      });
    }

    const now = new Date().toISOString();

    // Check if user with this phone already exists in this mess
    let user = queryOne<any>(
      "SELECT * FROM users WHERE mess_id = ? AND phone = ?",
      [mess.id, cleanPhone]
    );

    if (user) {
      // User exists! Update name if provided
      if (user.name !== cleanName) {
        runQuery("UPDATE users SET name = ?, updated_at = ? WHERE id = ?", [cleanName, now, user.id]);
        user.name = cleanName;
      }
      if (user.active === 0) {
        runQuery("UPDATE users SET active = 1, updated_at = ? WHERE id = ?", [now, user.id]);
        user.active = 1;
      }
    } else {
      // New member joining this mess!
      // Check if this phone belongs to the creator
      let role = "STUDENT";
      if (mess.creator_id) {
        const creatorUser = queryOne<any>("SELECT phone FROM users WHERE id = ?", [mess.creator_id]);
        if (creatorUser && creatorUser.phone === cleanPhone) {
          role = "SUPER_ADMIN";
        }
      }

      const newUserId = `u_${Date.now()}`;
      runQuery(
        `INSERT INTO users (id, mess_id, name, phone, role, approved, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)`,
        [newUserId, mess.id, cleanName, cleanPhone, role, now, now]
      );

      user = {
        id: newUserId,
        mess_id: mess.id,
        name: cleanName,
        phone: cleanPhone,
        role,
        approved: 1,
        active: 1,
      };

      // Record audit log
      recordAuditLog(
        mess.id,
        newUserId,
        cleanName,
        "MEMBER_JOIN",
        "users",
        newUserId,
        null,
        { name: cleanName, phone: cleanPhone, roomCode: cleanCode }
      );
    }

    // Generate Token
    const token = generateToken({
      userId: user.id,
      messId: mess.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
      roomCode: mess.code,
    });

    res.json({
      success: true,
      mess: {
        id: mess.id,
        name: mess.name,
        code: mess.code,
        creator_id: mess.creator_id,
      },
      user: {
        id: user.id,
        mess_id: mess.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        approved: user.approved,
        active: user.active,
      },
      token,
      message: `সফলভাবে "${mess.name}" মেসে প্রবেশ করেছেন!`,
    });
  });

  // Get current user & mess profile
  app.get("/api/auth/me", requireAuth, (req: AuthRequest, res) => {
    const user = req.user!;
    const messId = user.mess_id;

    const mess = queryOne<any>("SELECT id, name, code, creator_id FROM messes WHERE id = ?", [messId]);
    if (!mess) {
      return res.status(404).json({ error: "মেস পাওয়া যায়নি।" });
    }

    // Check manager assignments
    const managerMonths = queryAll<{ month_id: string }>(
      "SELECT month_id FROM manager_assignments WHERE user_id = ? AND mess_id = ?",
      [user.id, messId]
    );

    res.json({
      user: {
        ...user,
        isManager: user.role === "MANAGER" || user.role === "SUPER_ADMIN" || managerMonths.length > 0,
        managerMonthIds: managerMonths.map((m) => m.month_id),
      },
      mess,
    });
  });

  // ----------------------------------------------------
  // MONTHLY PERIODS (Scoped to mess_id)
  // ----------------------------------------------------

  // Get all months of current mess
  app.get("/api/months", requireAuth, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const months = queryAll(
      "SELECT * FROM monthly_periods WHERE mess_id = ? ORDER BY year DESC, month DESC",
      [messId]
    );
    res.json(months);
  });

  // Create new month (Super Admin only)
  app.post("/api/months", requireAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { name, month, year, fixed_curry_meals, active_student_count } = req.body;
    if (!name || !month || !year) {
      return res.status(400).json({ error: "মাসের নাম, মাস এবং বছর আবশ্যক।" });
    }

    const id = `month_${messId}_${year}_${month < 10 ? "0" + month : month}`;
    const existing = queryOne("SELECT id FROM monthly_periods WHERE id = ?", [id]);
    if (existing) {
      return res.status(400).json({ error: "এই মাসের হিসাব ইতিমধ্যে তৈরি করা আছে।" });
    }

    const now = new Date().toISOString();
    runQuery(
      `INSERT INTO monthly_periods (
        id, mess_id, name, month, year, status, active_student_count, fixed_curry_meals,
        morning_meal_value, lunch_meal_value, dinner_meal_value,
        include_bran_in_rice_calculation, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'OPEN', ?, ?, 0.5, 1.0, 1.0, 0, ?, ?)`,
      [
        id,
        messId,
        name,
        parseInt(month, 10),
        parseInt(year, 10),
        parseInt(active_student_count || 15, 10),
        parseFloat(fixed_curry_meals || 56.0),
        now,
        now,
      ]
    );

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "MONTH_CREATE",
      "monthly_periods",
      id,
      null,
      { id, name, month, year }
    );

    res.json({ success: true, id, message: "নতুন মাস সফলভাবে তৈরি হয়েছে।" });
  });

  // Change month status (Super Admin only)
  app.put("/api/months/:id/status", requireAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id } = req.params;
    const { status } = req.body;

    if (!["OPEN", "CLOSED", "ARCHIVED"].includes(status)) {
      return res.status(400).json({ error: "অবৈধ স্ট্যাটাস।" });
    }

    const month = queryOne("SELECT * FROM monthly_periods WHERE id = ? AND mess_id = ?", [id, messId]);
    if (!month) {
      return res.status(404).json({ error: "মাস পাওয়া যায়নি।" });
    }

    const now = new Date().toISOString();
    runQuery("UPDATE monthly_periods SET status = ?, updated_at = ? WHERE id = ? AND mess_id = ?", [
      status,
      now,
      id,
      messId,
    ]);

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "MONTH_STATUS_UPDATE",
      "monthly_periods",
      id,
      { status: month.status },
      { status }
    );

    res.json({ success: true, message: `মাসের স্ট্যাটাস "${status}" করা হয়েছে।` });
  });

  // Update month parameters (Super Admin only)
  app.put("/api/months/:id/config", requireAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id } = req.params;
    const {
      fixed_curry_meals,
      morning_meal_value,
      lunch_meal_value,
      dinner_meal_value,
      include_bran_in_rice_calculation,
    } = req.body;

    const month = queryOne("SELECT * FROM monthly_periods WHERE id = ? AND mess_id = ?", [id, messId]);
    if (!month) {
      return res.status(404).json({ error: "মাস পাওয়া যায়নি।" });
    }

    const now = new Date().toISOString();
    runQuery(
      `UPDATE monthly_periods SET 
        fixed_curry_meals = ?,
        morning_meal_value = ?,
        lunch_meal_value = ?,
        dinner_meal_value = ?,
        include_bran_in_rice_calculation = ?,
        updated_at = ?
       WHERE id = ? AND mess_id = ?`,
      [
        fixed_curry_meals !== undefined ? parseFloat(fixed_curry_meals) : month.fixed_curry_meals,
        morning_meal_value !== undefined ? parseFloat(morning_meal_value) : month.morning_meal_value,
        lunch_meal_value !== undefined ? parseFloat(lunch_meal_value) : month.lunch_meal_value,
        dinner_meal_value !== undefined ? parseFloat(dinner_meal_value) : month.dinner_meal_value,
        include_bran_in_rice_calculation !== undefined ? (include_bran_in_rice_calculation ? 1 : 0) : month.include_bran_in_rice_calculation,
        now,
        id,
        messId,
      ]
    );

    res.json({ success: true, message: "কনফিগারেশন সফলভাবে আপডেট করা হয়েছে।" });
  });

  // ----------------------------------------------------
  // CALCULATIONS & SUMMARY
  // ----------------------------------------------------

  app.get("/api/months/:id/summary", requireAuth, (req: AuthRequest, res) => {
    try {
      const summary = calculateMonthSummary(req.params.id);
      res.json(summary);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "হিসাব বের করতে সমস্যা হয়েছে।" });
    }
  });

  app.get("/api/months/:id/monthly-accounts", requireAuth, (req: AuthRequest, res) => {
    try {
      const summary = calculateMonthSummary(req.params.id);
      res.json({
        monthId: summary.monthId,
        monthName: summary.monthName,
        monthStatus: summary.monthStatus,
        curryRate: summary.curryRate,
        riceRate: summary.riceRate,
        fixedCurryMeals: summary.fixedCurryMealsPerStudent,
        studentExtraCost: summary.studentExtraCost,
        totalMessExpense: summary.totalMessExpense,
        totalDeposits: summary.totalDeposits,
        netMessBalance: summary.netMessBalance,
        students: summary.students,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "হিসাব বের করতে সমস্যা হয়েছে।" });
    }
  });

  // Single student account
  app.get("/api/months/:id/student/:studentId", requireAuth, (req: AuthRequest, res) => {
    const { id: monthId, studentId } = req.params;
    const currentUser = req.user!;

    if (currentUser.role === "STUDENT" && currentUser.id !== studentId) {
      return res.status(403).json({ error: "অন্য ছাত্রের হিসাব দেখার অনুমতি নেই।" });
    }

    try {
      const summary = calculateMonthSummary(monthId);
      const studentCalc = summary.students.find((s) => s.studentId === studentId);
      if (!studentCalc) {
        return res.status(404).json({ error: "এই মাসে ছাত্রের হিসাব পাওয়া যায়নি।" });
      }

      // Meal breakdown
      const meals = queryAll(
        "SELECT date, morning, lunch, dinner, total, note FROM meal_records WHERE month_id = ? AND student_id = ? ORDER BY date ASC",
        [monthId, studentId]
      );

      // Deposits
      const deposits = queryAll(
        "SELECT id, date, amount, note, created_at FROM deposits WHERE month_id = ? AND student_id = ? ORDER BY date DESC",
        [monthId, studentId]
      );

      res.json({
        month: {
          id: summary.monthId,
          name: summary.monthName,
          status: summary.monthStatus,
          curryRate: summary.curryRate,
          riceRate: summary.riceRate,
          fixedCurryMeals: summary.fixedCurryMealsPerStudent,
          studentExtraCost: summary.studentExtraCost,
        },
        student: studentCalc,
        meals,
        deposits,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "হিসাব বের করতে সমস্যা হয়েছে।" });
    }
  });

  // ----------------------------------------------------
  // MEALS MANAGEMENT
  // ----------------------------------------------------

  app.get("/api/months/:id/meals", requireAuth, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId } = req.params;
    const month = queryOne<any>("SELECT * FROM monthly_periods WHERE id = ? AND mess_id = ?", [monthId, messId]);
    if (!month) {
      return res.status(404).json({ error: "মাস পাওয়া যায়নি।" });
    }

    const students = queryAll(
      "SELECT id, name, phone, role FROM users WHERE mess_id = ? AND active = 1 AND approved = 1 ORDER BY created_at ASC",
      [messId]
    );

    const mealRecords = queryAll<any>(
      `SELECT mr.*, u.name as student_name
       FROM meal_records mr
       JOIN users u ON mr.student_id = u.id
       WHERE mr.month_id = ? AND mr.mess_id = ?
       ORDER BY mr.date ASC, u.name ASC`,
      [monthId, messId]
    );

    res.json({
      month,
      students,
      records: mealRecords,
    });
  });

  app.get("/api/months/:id/meals/daily", requireAuth, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId } = req.params;
    const date = (req.query.date as string) || new Date().toISOString().split("T")[0];

    const students = queryAll(
      "SELECT id, name, phone, role FROM users WHERE mess_id = ? AND active = 1 AND approved = 1 ORDER BY created_at ASC",
      [messId]
    );

    const records = queryAll(
      "SELECT student_id, morning, lunch, dinner, total, note FROM meal_records WHERE month_id = ? AND mess_id = ? AND date = ?",
      [monthId, messId, date]
    );

    const recordMap = new Map<string, any>();
    for (const r of records) {
      recordMap.set(r.student_id, r);
    }

    const list = students.map((s) => {
      const rec = recordMap.get(s.id);
      return {
        student_id: s.id,
        student_name: s.name,
        phone: s.phone,
        role: s.role,
        morning: rec ? rec.morning : 1,
        lunch: rec ? rec.lunch : 1,
        dinner: rec ? rec.dinner : 1,
        total: rec ? rec.total : 2.5,
        note: rec?.note || "",
      };
    });

    res.json({ date, month_id: monthId, students: list });
  });

  // Save daily meals
  app.post("/api/months/:id/meals/daily", requireManagerOrAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId } = req.params;
    const { date, entries } = req.body;

    if (!date || !Array.isArray(entries)) {
      return res.status(400).json({ error: "তারিখ এবং মিল তালিকা আবশ্যক।" });
    }

    const month = queryOne<any>("SELECT * FROM monthly_periods WHERE id = ? AND mess_id = ?", [monthId, messId]);
    if (!month) {
      return res.status(404).json({ error: "মাস পাওয়া যায়নি।" });
    }

    if (month.status === "CLOSED") {
      return res.status(400).json({ error: "এই মাসটি বন্ধ। নতুন এন্ট্রি করা সম্ভব নয়।" });
    }

    const morningWeight = month.morning_meal_value || 0.5;
    const lunchWeight = month.lunch_meal_value || 1.0;
    const dinnerWeight = month.dinner_meal_value || 1.0;
    const now = new Date().toISOString();

    for (const entry of entries) {
      const { student_id, morning, lunch, dinner, note } = entry;
      const m = morning ? 1 : 0;
      const l = lunch ? 1 : 0;
      const d = dinner ? 1 : 0;
      const total = m * morningWeight + l * lunchWeight + d * dinnerWeight;

      const recordId = `meal_${monthId}_${student_id}_${date}`;

      runQuery(
        `INSERT INTO meal_records (
          id, mess_id, month_id, student_id, date, morning, lunch, dinner, total, note,
          created_by, updated_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(month_id, student_id, date) DO UPDATE SET
          morning = excluded.morning,
          lunch = excluded.lunch,
          dinner = excluded.dinner,
          total = excluded.total,
          note = excluded.note,
          updated_by = excluded.updated_by,
          updated_at = excluded.updated_at`,
        [
          recordId,
          messId,
          monthId,
          student_id,
          date,
          m,
          l,
          d,
          total,
          note || "",
          req.user!.id,
          req.user!.id,
          now,
          now,
        ]
      );
    }

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "MEALS_DAILY_SAVE",
      "meal_records",
      date,
      null,
      { count: entries.length, date }
    );

    res.json({ success: true, message: `${date} তারিখের মিল সফলভাবে সংরক্ষণ করা হয়েছে।` });
  });

  // ----------------------------------------------------
  // DEPOSITS (জমা)
  // ----------------------------------------------------

  app.get("/api/months/:id/deposits", requireAuth, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId } = req.params;
    const studentId = req.query.student_id as string;

    let sql = `
      SELECT d.*, u.name as student_name, u.phone as student_phone
      FROM deposits d
      JOIN users u ON d.student_id = u.id
      WHERE d.month_id = ? AND d.mess_id = ?
    `;
    const params: any[] = [monthId, messId];

    if (studentId) {
      sql += " AND d.student_id = ?";
      params.push(studentId);
    }

    sql += " ORDER BY d.date DESC, d.created_at DESC";
    const deposits = queryAll(sql, params);
    res.json(deposits);
  });

  app.post("/api/months/:id/deposits", requireManagerOrAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId } = req.params;
    const { student_id, date, amount, note } = req.body;

    if (!student_id || !date || amount === undefined || isNaN(Number(amount))) {
      return res.status(400).json({ error: "ছাত্রের নাম, তারিখ এবং সঠিক জমার পরিমাণ প্রদান করুন।" });
    }

    const month = queryOne<any>("SELECT status FROM monthly_periods WHERE id = ? AND mess_id = ?", [monthId, messId]);
    if (month?.status === "CLOSED") {
      return res.status(400).json({ error: "বন্ধ মাসে জমা যোগ করা যাবে না।" });
    }

    const id = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    runQuery(
      `INSERT INTO deposits (id, mess_id, month_id, student_id, date, amount, note, created_by, updated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, messId, monthId, student_id, date, parseFloat(amount), note || "", req.user!.id, req.user!.id, now, now]
    );

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "DEPOSIT_ADD",
      "deposits",
      id,
      null,
      { student_id, amount, date }
    );

    res.json({ success: true, id, message: "জমা সফলভাবে যোগ করা হয়েছে।" });
  });

  app.delete("/api/months/:id/deposits/:depositId", requireManagerOrAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId, depositId } = req.params;

    const existing = queryOne("SELECT * FROM deposits WHERE id = ? AND month_id = ? AND mess_id = ?", [
      depositId,
      monthId,
      messId,
    ]);
    if (!existing) {
      return res.status(404).json({ error: "জমার তথ্য পাওয়া যায়নি।" });
    }

    runQuery("DELETE FROM deposits WHERE id = ? AND mess_id = ?", [depositId, messId]);

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "DEPOSIT_DELETE",
      "deposits",
      depositId,
      existing,
      null
    );

    res.json({ success: true, message: "জমার রেকর্ড মুছে ফেলা হয়েছে।" });
  });

  // ----------------------------------------------------
  // CURRY / BAZAR EXPENSES (বাজার খরচ)
  // ----------------------------------------------------

  app.get("/api/months/:id/curry-expenses", requireAuth, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId } = req.params;
    const category = req.query.category as string;

    let sql = `
      SELECT c.*, u.name as person_name
      FROM curry_expenses c
      LEFT JOIN users u ON c.person_id = u.id
      WHERE c.month_id = ? AND c.mess_id = ?
    `;
    const params: any[] = [monthId, messId];

    if (category && category !== "সব") {
      sql += " AND c.category = ?";
      params.push(category);
    }

    sql += " ORDER BY c.date DESC, c.created_at DESC";
    const list = queryAll(sql, params);
    res.json(list);
  });

  app.post("/api/months/:id/curry-expenses", requireManagerOrAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId } = req.params;
    const { date, person_id, category, amount, description } = req.body;

    if (!date || !person_id || !category || amount === undefined || isNaN(Number(amount))) {
      return res.status(400).json({ error: "তারিখ, বাজারকারী, ক্যাটাগরি এবং খরচের পরিমাণ আবশ্যক।" });
    }

    const month = queryOne<any>("SELECT status FROM monthly_periods WHERE id = ? AND mess_id = ?", [monthId, messId]);
    if (month?.status === "CLOSED") {
      return res.status(400).json({ error: "বন্ধ মাসে খরচ যোগ করা যাবে না।" });
    }

    const id = `curry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    runQuery(
      `INSERT INTO curry_expenses (id, mess_id, month_id, date, person_id, category, amount, description, created_by, updated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        messId,
        monthId,
        date,
        person_id,
        category,
        parseFloat(amount),
        description || "",
        req.user!.id,
        req.user!.id,
        now,
        now,
      ]
    );

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "CURRY_EXPENSE_ADD",
      "curry_expenses",
      id,
      null,
      { category, amount, date }
    );

    res.json({ success: true, id, message: "বাজার খরচ সফলভাবে যোগ করা হয়েছে।" });
  });

  app.delete("/api/months/:id/curry-expenses/:expenseId", requireManagerOrAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId, expenseId } = req.params;

    const existing = queryOne("SELECT * FROM curry_expenses WHERE id = ? AND month_id = ? AND mess_id = ?", [
      expenseId,
      monthId,
      messId,
    ]);
    if (!existing) {
      return res.status(404).json({ error: "খরচের তথ্য পাওয়া যায়নি।" });
    }

    runQuery("DELETE FROM curry_expenses WHERE id = ? AND mess_id = ?", [expenseId, messId]);

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "CURRY_EXPENSE_DELETE",
      "curry_expenses",
      expenseId,
      existing,
      null
    );

    res.json({ success: true, message: "বাজার খরচ মুছে ফেলা হয়েছে।" });
  });

  // ----------------------------------------------------
  // RICE & BRAN EXPENSES (চাল ও ভুষি খরচ)
  // ----------------------------------------------------

  app.get("/api/months/:id/rice-expenses", requireAuth, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId } = req.params;
    const sql = `
      SELECT r.*, u.name as person_name
      FROM rice_expenses r
      LEFT JOIN users u ON r.person_id = u.id
      WHERE r.month_id = ? AND r.mess_id = ?
      ORDER BY r.date DESC, r.created_at DESC
    `;
    const list = queryAll(sql, [monthId, messId]);
    res.json(list);
  });

  app.post("/api/months/:id/rice-expenses", requireManagerOrAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId } = req.params;
    const { date, person_id, rice_amount, bran_amount, note } = req.body;

    if (!date || !person_id || rice_amount === undefined || isNaN(Number(rice_amount))) {
      return res.status(400).json({ error: "তারিখ, ক্রেতার নাম এবং চালের সঠিক পরিমাণ প্রদান করুন।" });
    }

    const month = queryOne<any>("SELECT status FROM monthly_periods WHERE id = ? AND mess_id = ?", [monthId, messId]);
    if (month?.status === "CLOSED") {
      return res.status(400).json({ error: "বন্ধ মাসে খরচ যোগ করা যাবে না।" });
    }

    const id = `rice_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    runQuery(
      `INSERT INTO rice_expenses (id, mess_id, month_id, date, person_id, rice_amount, bran_amount, note, created_by, updated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        messId,
        monthId,
        date,
        person_id,
        parseFloat(rice_amount),
        parseFloat(bran_amount || 0),
        note || "",
        req.user!.id,
        req.user!.id,
        now,
        now,
      ]
    );

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "RICE_EXPENSE_ADD",
      "rice_expenses",
      id,
      null,
      { rice_amount, bran_amount, date }
    );

    res.json({ success: true, id, message: "চাল ও ভুষি খরচ সংরক্ষণ করা হয়েছে।" });
  });

  app.delete("/api/months/:id/rice-expenses/:expenseId", requireManagerOrAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId, expenseId } = req.params;

    const existing = queryOne("SELECT * FROM rice_expenses WHERE id = ? AND month_id = ? AND mess_id = ?", [
      expenseId,
      monthId,
      messId,
    ]);
    if (!existing) {
      return res.status(404).json({ error: "খরচের তথ্য পাওয়া যায়নি।" });
    }

    runQuery("DELETE FROM rice_expenses WHERE id = ? AND mess_id = ?", [expenseId, messId]);

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "RICE_EXPENSE_DELETE",
      "rice_expenses",
      expenseId,
      existing,
      null
    );

    res.json({ success: true, message: "চালের খরচের রেকর্ড মুছে ফেলা হয়েছে।" });
  });

  // ----------------------------------------------------
  // EXTRA EXPENSES (অতিরিক্ত খরচ - গ্যাস, ওয়াইফাই, পেপার ইত্যাদি)
  // ----------------------------------------------------

  app.get("/api/months/:id/extra-expenses", requireAuth, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId } = req.params;
    const sql = `
      SELECT e.*, u.name as person_name
      FROM extra_expenses e
      LEFT JOIN users u ON e.person_id = u.id
      WHERE e.month_id = ? AND e.mess_id = ?
      ORDER BY e.date DESC, e.created_at DESC
    `;
    const list = queryAll(sql, [monthId, messId]);
    res.json(list);
  });

  app.post("/api/months/:id/extra-expenses", requireManagerOrAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId } = req.params;
    const { date, person_id, description, amount } = req.body;

    if (!date || !description || amount === undefined || isNaN(Number(amount))) {
      return res.status(400).json({ error: "তারিখ, খরচের বিবরণ এবং টাকার পরিমাণ আবশ্যক।" });
    }

    const month = queryOne<any>("SELECT status FROM monthly_periods WHERE id = ? AND mess_id = ?", [monthId, messId]);
    if (month?.status === "CLOSED") {
      return res.status(400).json({ error: "বন্ধ মাসে খরচ যোগ করা যাবে না।" });
    }

    const id = `extra_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    runQuery(
      `INSERT INTO extra_expenses (id, mess_id, month_id, date, person_id, description, amount, created_by, updated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        messId,
        monthId,
        date,
        person_id || null,
        description,
        parseFloat(amount),
        req.user!.id,
        req.user!.id,
        now,
        now,
      ]
    );

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "EXTRA_EXPENSE_ADD",
      "extra_expenses",
      id,
      null,
      { description, amount, date }
    );

    res.json({ success: true, id, message: "অতিরিক্ত খরচ সফলভাবে যোগ করা হয়েছে।" });
  });

  app.delete("/api/months/:id/extra-expenses/:expenseId", requireManagerOrAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId, expenseId } = req.params;

    const existing = queryOne("SELECT * FROM extra_expenses WHERE id = ? AND month_id = ? AND mess_id = ?", [
      expenseId,
      monthId,
      messId,
    ]);
    if (!existing) {
      return res.status(404).json({ error: "খরচের তথ্য পাওয়া যায়নি।" });
    }

    runQuery("DELETE FROM extra_expenses WHERE id = ? AND mess_id = ?", [expenseId, messId]);

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "EXTRA_EXPENSE_DELETE",
      "extra_expenses",
      expenseId,
      existing,
      null
    );

    res.json({ success: true, message: "খরচটি মুছে ফেলা হয়েছে।" });
  });

  // ----------------------------------------------------
  // ALL TRANSACTIONS
  // ----------------------------------------------------

  app.get("/api/months/:id/transactions", requireAuth, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId } = req.params;

    const deposits = queryAll<any>(
      `SELECT d.id, d.date, d.amount, d.note as description, 'জমা' as type, u.id as student_id, u.name as person_name
       FROM deposits d
       JOIN users u ON d.student_id = u.id
       WHERE d.month_id = ? AND d.mess_id = ?`,
      [monthId, messId]
    );

    const curry = queryAll<any>(
      `SELECT c.id, c.date, c.amount, (c.category || ': ' || COALESCE(c.description, '')) as description, 'বাজার খরচ' as type, c.person_id as student_id, u.name as person_name
       FROM curry_expenses c
       LEFT JOIN users u ON c.person_id = u.id
       WHERE c.month_id = ? AND c.mess_id = ?`,
      [monthId, messId]
    );

    const rice = queryAll<any>(
      `SELECT r.id, r.date, r.rice_amount as amount, ('চাল ক্রয় ' || COALESCE(r.note, '')) as description, 'চাল খরচ' as type, r.person_id as student_id, u.name as person_name
       FROM rice_expenses r
       LEFT JOIN users u ON r.person_id = u.id
       WHERE r.month_id = ? AND r.mess_id = ?`,
      [monthId, messId]
    );

    const bran = queryAll<any>(
      `SELECT (r.id || '_b') as id, r.date, r.bran_amount as amount, ('ভুষি ক্রয় ' || COALESCE(r.note, '')) as description, 'ভুষি খরচ' as type, r.person_id as student_id, u.name as person_name
       FROM rice_expenses r
       LEFT JOIN users u ON r.person_id = u.id
       WHERE r.month_id = ? AND r.mess_id = ? AND r.bran_amount > 0`,
      [monthId, messId]
    );

    const extra = queryAll<any>(
      `SELECT e.id, e.date, e.amount, e.description, 'অতিরিক্ত খরচ' as type, e.person_id as student_id, u.name as person_name
       FROM extra_expenses e
       LEFT JOIN users u ON e.person_id = u.id
       WHERE e.month_id = ? AND e.mess_id = ?`,
      [monthId, messId]
    );

    const all = [...deposits, ...curry, ...rice, ...bran, ...extra];
    all.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));

    res.json(all);
  });

  // ----------------------------------------------------
  // USERS / STUDENTS MANAGEMENT (Super Admin Ultimate Access)
  // ----------------------------------------------------

  app.get("/api/users", requireAuth, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const users = queryAll(
      `SELECT id, mess_id, name, phone, role, approved, active, room_number, created_at, updated_at
       FROM users
       WHERE mess_id = ?
       ORDER BY created_at ASC`,
      [messId]
    );
    res.json(users);
  });

  // Super Admin adds student manually
  app.post("/api/users", requireAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { name, phone, role, room_number } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "নাম এবং মোবাইল নম্বর আবশ্যক।" });
    }

    const cleanPhone = phone.trim();
    const existing = queryOne("SELECT id FROM users WHERE mess_id = ? AND phone = ?", [messId, cleanPhone]);
    if (existing) {
      return res.status(400).json({ error: "এই মেসের তালিকায় এই মোবাইল নম্বরের সদস্য ইতিমধ্যে আছেন।" });
    }

    const id = `u_${Date.now()}`;
    const now = new Date().toISOString();
    const userRole = role === "MANAGER" ? "MANAGER" : "STUDENT";

    runQuery(
      `INSERT INTO users (id, mess_id, name, phone, role, approved, active, room_number, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?)`,
      [id, messId, name.trim(), cleanPhone, userRole, room_number || "", now, now]
    );

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "STUDENT_MANUAL_ADD",
      "users",
      id,
      null,
      { name, phone, role: userRole }
    );

    res.json({ success: true, id, message: "নতুন সদস্য সফলভাবে যোগ করা হয়েছে।" });
  });

  // Super Admin edits student info or promotes to Manager
  app.put("/api/users/:id", requireAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id } = req.params;
    const { name, phone, role, room_number, active, approved } = req.body;

    const existing = queryOne<any>("SELECT * FROM users WHERE id = ? AND mess_id = ?", [id, messId]);
    if (!existing) {
      return res.status(404).json({ error: "সদস্য পাওয়া যায়নি।" });
    }

    // Do not demote creator unless done explicitly
    const now = new Date().toISOString();
    runQuery(
      `UPDATE users SET 
        name = ?,
        phone = ?,
        role = ?,
        room_number = ?,
        active = ?,
        approved = ?,
        updated_at = ?
       WHERE id = ? AND mess_id = ?`,
      [
        name !== undefined ? name.trim() : existing.name,
        phone !== undefined ? phone.trim() : existing.phone,
        role !== undefined ? role : existing.role,
        room_number !== undefined ? room_number : existing.room_number,
        active !== undefined ? (active ? 1 : 0) : existing.active,
        approved !== undefined ? (approved ? 1 : 0) : existing.approved,
        now,
        id,
        messId,
      ]
    );

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "USER_UPDATE",
      "users",
      id,
      existing,
      { name, phone, role, active, approved }
    );

    res.json({ success: true, message: "সদস্যের তথ্য সফলভাবে আপডেট করা হয়েছে।" });
  });

  // Super Admin deletes/deactivates a student
  app.delete("/api/users/:id", requireAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id } = req.params;

    if (id === req.user!.id) {
      return res.status(400).json({ error: "সুপার এডমিন নিজের অ্যাকাউন্ট মুছে ফেলতে পারবেন না।" });
    }

    const existing = queryOne("SELECT * FROM users WHERE id = ? AND mess_id = ?", [id, messId]);
    if (!existing) {
      return res.status(404).json({ error: "সদস্য পাওয়া যায়নি।" });
    }

    runQuery("DELETE FROM users WHERE id = ? AND mess_id = ?", [id, messId]);

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "USER_DELETE",
      "users",
      id,
      existing,
      null
    );

    res.json({ success: true, message: "সদস্যকে সফলভাবে মেস থেকে বাদ দেওয়া হয়েছে।" });
  });

  // ----------------------------------------------------
  // MANAGER ASSIGNMENTS (মাসিক ম্যানেজার নিয়োগ)
  // ----------------------------------------------------

  app.get("/api/months/:id/managers", requireAuth, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId } = req.params;
    const managers = queryAll(
      `SELECT ma.id, ma.user_id, ma.month_id, u.name, u.phone, u.role
       FROM manager_assignments ma
       JOIN users u ON ma.user_id = u.id
       WHERE ma.month_id = ? AND ma.mess_id = ?`,
      [monthId, messId]
    );
    res.json(managers);
  });

  app.post("/api/months/:id/managers", requireAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "ম্যানেজার নির্বাচন করুন।" });
    }

    const id = `ma_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const now = new Date().toISOString();

    runQuery(
      `INSERT OR IGNORE INTO manager_assignments (id, mess_id, user_id, month_id, assigned_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, messId, user_id, monthId, req.user!.id, now]
    );

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "MANAGER_ASSIGN",
      "manager_assignments",
      id,
      null,
      { user_id, month_id: monthId }
    );

    res.json({ success: true, message: "ম্যানেজার নিয়োগ সফল হয়েছে।" });
  });

  app.delete("/api/months/:id/managers/:userId", requireAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { id: monthId, userId } = req.params;

    runQuery(
      "DELETE FROM manager_assignments WHERE user_id = ? AND month_id = ? AND mess_id = ?",
      [userId, monthId, messId]
    );

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "MANAGER_REMOVE",
      "manager_assignments",
      userId,
      null,
      { user_id: userId, month_id: monthId }
    );

    res.json({ success: true, message: "ম্যানেজার পদ থেকে অব্যাহতি দেওয়া হয়েছে।" });
  });

  // ----------------------------------------------------
  // SYSTEM SETTINGS & MAINTENANCE (Super Admin)
  // ----------------------------------------------------

  app.get("/api/settings", requireAuth, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const rows = queryAll<{ key: string; value: string }>(
      "SELECT key, value FROM system_settings WHERE mess_id = ?",
      [messId]
    );
    const obj: Record<string, string> = {};
    for (const r of rows) {
      obj[r.key] = r.value;
    }

    // Attach current mess info
    const mess = queryOne<any>("SELECT * FROM messes WHERE id = ?", [messId]);
    if (mess) {
      obj.mess_name = mess.name;
      obj.room_code = mess.code;
    }

    res.json(obj);
  });

  app.put("/api/settings", requireAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const { mess_name, currency, default_fixed_curry_meals, default_morning_meal, default_lunch_meal, default_dinner_meal, include_bran_default } = req.body;

    if (mess_name) {
      runQuery("UPDATE messes SET name = ?, updated_at = ? WHERE id = ?", [
        mess_name.trim(),
        new Date().toISOString(),
        messId,
      ]);
      runQuery(
        "INSERT OR REPLACE INTO system_settings (mess_id, key, value) VALUES (?, 'mess_name', ?)",
        [messId, mess_name.trim()]
      );
    }

    const map: Record<string, any> = {
      currency,
      default_fixed_curry_meals,
      default_morning_meal,
      default_lunch_meal,
      default_dinner_meal,
      include_bran_default,
    };

    for (const [k, v] of Object.entries(map)) {
      if (v !== undefined) {
        runQuery(
          "INSERT OR REPLACE INTO system_settings (mess_id, key, value) VALUES (?, ?, ?)",
          [messId, k, v.toString()]
        );
      }
    }

    res.json({ success: true, message: "সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে।" });
  });

  // Clear all transactions for this mess (Super Admin only)
  app.post("/api/settings/clear-transactions", requireAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    clearMessTransactions(messId);

    recordAuditLog(
      messId,
      req.user!.id,
      req.user!.name,
      "CLEAR_TRANSACTIONS",
      "system",
      messId,
      null,
      { note: "সুপার এডমিন কর্তৃক এই মেসের সকল লেনদেন ও মিল ডাটা রিসেট করা হয়েছে।" }
    );

    res.json({
      success: true,
      message: "এই মেসের সকল মিল, বাজার খরচ, চাল খরচ এবং জমার ডাটা সফলভাবে মুছে ফেলা হয়েছে।",
    });
  });

  // Audit Logs for this mess (Super Admin only)
  app.get("/api/audit-logs", requireAdmin, (req: AuthRequest, res) => {
    const messId = req.user!.mess_id;
    const logs = queryAll(
      "SELECT * FROM audit_logs WHERE mess_id = ? ORDER BY created_at DESC LIMIT 100",
      [messId]
    );
    res.json(logs);
  });

  // ----------------------------------------------------
  // VITE MIDDLEWARE (for dev and SPA fallback)
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

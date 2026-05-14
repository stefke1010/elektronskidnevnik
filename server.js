const express = require("express");
const session = require("express-session");
const { Pool } = require("pg");

const app = express();

/* ===================================================
   CONFIG
=================================================== */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "EDNEVNIK_SECRET",
    resave: false,
    saveUninitialized: false
  })
);

/* ===================================================
   DATABASE
=================================================== */

const pool = new Pool({
  connectionString: postgresql://postgres:vyjPY4wcoRMQg47l@db.xpgcmjqzbqplnmdkljpt.supabase.co:5432/postgres,
  ssl: {
    rejectUnauthorized: false
  }
});

/* ===================================================
   ERROR HANDLERS
=================================================== */

process.on("uncaughtException", (err) => {
  console.log(err);
});

process.on("unhandledRejection", (err) => {
  console.log(err);
});

/* ===================================================
   HELPERS
=================================================== */

function safe(v) {
  try {
    return JSON.parse(v || "[]");
  } catch {
    return [];
  }
}

function avg(grades = []) {
  const arr = grades.filter(
    (g) => g.value && !isNaN(g.value)
  );

  if (!arr.length) return "0.00";

  return (
    arr.reduce(
      (a, b) => a + Number(b.value),
      0
    ) / arr.length
  ).toFixed(2);
}

function finalGrade(grades = []) {
  const a = Number(avg(grades));

  if (a >= 4.5) return 5;
  if (a >= 3.5) return 4;
  if (a >= 2.5) return 3;
  if (a >= 1.5) return 2;

  return 1;
}

function auth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  next();
}

/* ===================================================
   INIT DATABASE
=================================================== */

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS students(
      id SERIAL PRIMARY KEY,
      name TEXT,
      classroom TEXT,
      grades TEXT
    )
  `);

  const admin = await pool.query(
    "SELECT * FROM users WHERE username='admin'"
  );

  if (!admin.rows.length) {
    await pool.query(
      `
      INSERT INTO users(username,password)
      VALUES('admin','admin123')
    `
    );

    console.log("✅ ADMIN CREATED");
  }
}

/* ===================================================
   UI
=================================================== */

function layout(title, content) {
  return `
  <!DOCTYPE html>

  <html lang="sr">

  <head>

  <meta charset="UTF-8">

  <meta name="viewport"
  content="width=device-width, initial-scale=1.0">

  <title>${title}</title>

  <link rel="preconnect"
  href="https://fonts.googleapis.com">

  <link href="
  https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap
  " rel="stylesheet">

  <style>

  *{
  margin:0;
  padding:0;
  box-sizing:border-box;
  font-family:Inter;
  }

  body{
  background:
  linear-gradient(
  135deg,
  #0f172a,
  #111827,
  #1e293b
  );

  color:white;
  min-height:100vh;
  padding:30px;
  }

  .top{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:30px;
  }

  .logo{
  font-size:35px;
  font-weight:900;
  background:linear-gradient(
  90deg,
  #60a5fa,
  #a78bfa
  );

  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  }

  .nav{
  display:flex;
  gap:15px;
  flex-wrap:wrap;
  }

  .nav a{
  text-decoration:none;
  color:white;
  background:#1e293b;
  padding:12px 18px;
  border-radius:15px;
  transition:0.3s;
  }

  .nav a:hover{
  transform:translateY(-3px);
  background:#2563eb;
  }

  .card{
  background:
  rgba(255,255,255,0.05);

  backdrop-filter:blur(15px);

  border:1px solid rgba(255,255,255,0.1);

  padding:25px;

  border-radius:25px;

  margin-bottom:25px;

  box-shadow:
  0 10px 40px rgba(0,0,0,0.3);
  }

  .grid{
  display:grid;
  grid-template-columns:
  repeat(auto-fit,minmax(250px,1fr));

  gap:20px;
  }

  .stat{
  padding:30px;
  border-radius:25px;

  background:
  linear-gradient(
  135deg,
  #2563eb,
  #7c3aed
  );
  }

  .stat h1{
  font-size:50px;
  }

  input,textarea{
  width:100%;
  padding:15px;
  margin-top:12px;
  border:none;
  border-radius:15px;
  background:#0f172a;
  color:white;
  font-size:15px;
  }

  button{
  padding:14px 20px;
  margin-top:15px;
  border:none;
  border-radius:15px;
  background:
  linear-gradient(
  90deg,
  #2563eb,
  #7c3aed
  );

  color:white;
  font-weight:700;
  cursor:pointer;
  transition:0.3s;
  }

  button:hover{
  transform:scale(1.03);
  }

  .student{
  padding:20px;
  border-radius:20px;
  background:#111827;
  margin-top:15px;
  }

  .grade{
  padding:15px;
  border-radius:15px;
  background:#0f172a;
  margin-top:10px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  }

  .avg{
  font-size:18px;
  color:#60a5fa;
  }

  a{
  color:white;
  text-decoration:none;
  }

  .danger{
  background:#dc2626;
  }

  </style>

  </head>

  <body>

  <div class="top">

  <div class="logo">
  📘 E-DNEVNIK PRO
  </div>

  <div class="nav">
  <a href="/">🏠 Dashboard</a>
  <a href="/students">👨‍🎓 Students</a>
  <a href="/logout">🚪 Logout</a>
  </div>

  </div>

  ${content}

  </body>

  </html>
  `;
}

/* ===================================================
   LOGIN
=================================================== */

app.get("/login", (req, res) => {
  res.send(`
  <!DOCTYPE html>

  <html>

  <head>

  <style>

  body{
  margin:0;
  background:
  linear-gradient(
  135deg,
  #0f172a,
  #1e293b
  );

  display:flex;
  justify-content:center;
  align-items:center;
  height:100vh;
  font-family:Inter;
  }

  .box{
  width:380px;

  background:
  rgba(255,255,255,0.05);

  backdrop-filter:blur(15px);

  border-radius:30px;

  padding:40px;

  color:white;

  box-shadow:
  0 10px 40px rgba(0,0,0,0.4);
  }

  input{
  width:100%;
  padding:15px;
  margin-top:15px;
  border:none;
  border-radius:15px;
  background:#0f172a;
  color:white;
  }

  button{
  width:100%;
  padding:15px;
  margin-top:20px;
  border:none;
  border-radius:15px;

  background:
  linear-gradient(
  90deg,
  #2563eb,
  #7c3aed
  );

  color:white;
  font-weight:700;
  cursor:pointer;
  }

  h1{
  text-align:center;
  }

  </style>

  </head>

  <body>

  <form class="box" method="POST">

  <h1>📘 E-DNEVNIK</h1>

  <input
  name="username"
  placeholder="Username">

  <input
  type="password"
  name="password"
  placeholder="Password">

  <button>
  LOGIN
  </button>

  </form>

  </body>

  </html>
  `);
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const { rows } = await pool.query(
      `
      SELECT * FROM users
      WHERE username=$1
      AND password=$2
    `,
      [username, password]
    );

    if (!rows.length) {
      return res.send("❌ Wrong login");
    }

    req.session.user = rows[0];

    res.redirect("/");
  } catch (err) {
    res.send(err.toString());
  }
});

/* ===================================================
   DASHBOARD
=================================================== */

app.get("/", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM students ORDER BY id DESC"
    );

    let totalGrades = 0;

    rows.forEach((s) => {
      totalGrades += safe(s.grades).length;
    });

    res.send(
      layout(
        "Dashboard",
        `
        <div class="grid">

        <div class="stat">
        <h1>${rows.length}</h1>
        <p>Students</p>
        </div>

        <div class="stat">
        <h1>${totalGrades}</h1>
        <p>Grades</p>
        </div>

        </div>

        <br>

        ${rows
          .map((s) => {
            const grades = safe(s.grades);

            return `
            <div class="student">

            <h2>${s.name}</h2>

            <br>

            <div class="avg">
            📊 Average:
            ${avg(grades)}
            </div>

            <br>

            <div class="avg">
            🏁 Final:
            ${finalGrade(grades)}
            </div>

            <br>

            <a href="/student/${s.id}">
            <button>
            Open profile
            </button>
            </a>

            </div>
            `;
          })
          .join("")}
        `
      )
    );
  } catch (err) {
    res.send(err.toString());
  }
});

/* ===================================================
   STUDENTS
=================================================== */

app.get("/students", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM students ORDER BY id DESC"
    );

    res.send(
      layout(
        "Students",
        `
        <div class="card">

        <h2>➕ Add Student</h2>

        <form method="POST"
        action="/students/add">

        <input
        name="name"
        placeholder="Student name">

        <input
        name="classroom"
        placeholder="Classroom">

        <button>
        Add Student
        </button>

        </form>

        </div>

        ${rows
          .map(
            (s) => `
          <div class="student">

          <h2>${s.name}</h2>

          <br>

          <p>
          📚 ${s.classroom || "-"}
          </p>

          <br>

          <a href="/student/${s.id}">
          <button>
          Open
          </button>
          </a>

          </div>
        `
          )
          .join("")}
        `
      )
    );
  } catch (err) {
    res.send(err.toString());
  }
});

/* ===================================================
   ADD STUDENT
=================================================== */

app.post(
  "/students/add",
  auth,
  async (req, res) => {
    try {
      await pool.query(
        `
        INSERT INTO students
        (
          name,
          classroom,
          grades
        )
        VALUES
        (
          $1,
          $2,
          '[]'
        )
      `,
        [
          req.body.name,
          req.body.classroom
        ]
      );

      res.redirect("/students");
    } catch (err) {
      res.send(err.toString());
    }
  }
);

/* ===================================================
   STUDENT PROFILE
=================================================== */

app.get(
  "/student/:id",
  auth,
  async (req, res) => {
    try {
      const { rows } = await pool.query(
        `
        SELECT * FROM students
        WHERE id=$1
      `,
        [req.params.id]
      );

      if (!rows.length) {
        return res.send(
          "❌ Student not found"
        );
      }

      const s = rows[0];

      const grades = safe(s.grades);

      res.send(
        layout(
          s.name,
          `
          <div class="grid">

          <div class="stat">
          <h1>${avg(grades)}</h1>
          <p>Average</p>
          </div>

          <div class="stat">
          <h1>${finalGrade(grades)}</h1>
          <p>Final Grade</p>
          </div>

          </div>

          <br>

          <div class="card">

          <h2>➕ Add Grade</h2>

          <form method="POST"
          action="/student/${s.id}/grade">

          <input
          name="subject"
          placeholder="Subject">

          <input
          name="value"
          placeholder="Grade">

          <button>
          Add Grade
          </button>

          </form>

          </div>

          <div class="card">

          <h2>📚 Grades</h2>

          ${grades
            .map(
              (g, i) => `
            <div class="grade">

            <div>

            <h3>
            ${g.subject}
            </h3>

            <br>

            <p>
            Grade:
            ${g.value}
            </p>

            </div>

            <form method="POST"
            action="/student/${s.id}/delete-grade/${i}">

            <button class="danger">
            Delete
            </button>

            </form>

            </div>
          `
            )
            .join("")}

          </div>
          `
        )
      );
    } catch (err) {
      res.send(err.toString());
    }
  }
);

/* ===================================================
   ADD GRADE
=================================================== */

app.post(
  "/student/:id/grade",
  auth,
  async (req, res) => {
    try {
      const { rows } = await pool.query(
        `
        SELECT grades FROM students
        WHERE id=$1
      `,
        [req.params.id]
      );

      let grades = safe(rows[0].grades);

      grades.push({
        subject: req.body.subject,
        value: Number(req.body.value)
      });

      await pool.query(
        `
        UPDATE students
        SET grades=$1
        WHERE id=$2
      `,
        [
          JSON.stringify(grades),
          req.params.id
        ]
      );

      res.redirect(
        "/student/" + req.params.id
      );
    } catch (err) {
      res.send(err.toString());
    }
  }
);

/* ===================================================
   DELETE GRADE
=================================================== */

app.post(
  "/student/:id/delete-grade/:index",
  auth,
  async (req, res) => {
    try {
      const { rows } = await pool.query(
        `
        SELECT grades FROM students
        WHERE id=$1
      `,
        [req.params.id]
      );

      let grades = safe(rows[0].grades);

      grades.splice(req.params.index, 1);

      await pool.query(
        `
        UPDATE students
        SET grades=$1
        WHERE id=$2
      `,
        [
          JSON.stringify(grades),
          req.params.id
        ]
      );

      res.redirect(
        "/student/" + req.params.id
      );
    } catch (err) {
      res.send(err.toString());
    }
  }
);

/* ===================================================
   LOGOUT
=================================================== */

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

/* ===================================================
   START
=================================================== */

const PORT = process.env.PORT || 5000;

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(
      "🚀 E-DNEVNIK PRO ONLINE ON PORT " +
        PORT
    );
  });
});

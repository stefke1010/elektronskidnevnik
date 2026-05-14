const express = require("express");
const { Pool } = require("pg");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();

/* =========================
   CONFIG
========================= */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "ednevnik_secret",
    resave: false,
    saveUninitialized: false
  })
);

/* =========================
   DATABASE
========================= */

const pool = new Pool({
  connectionString: postgresql://postgres:vyjPY4wcoRMQg47l@db.xpgcmjqzbqplnmdkljpt.supabase.co:5432/postgres,
  ssl: {
    rejectUnauthorized: false
  }
});

/* =========================
   HELPERS
========================= */

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

  if (!arr.length) return 0;

  return (
    arr.reduce(
      (a, b) => a + Number(b.value),
      0
    ) / arr.length
  ).toFixed(2);
}

/* =========================
   AUTH
========================= */

function auth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  next();
}

/* =========================
   UI
========================= */

function layout(title, content) {
  return `
  <!DOCTYPE html>

  <html>

  <head>

  <meta charset="UTF-8">

  <meta name="viewport"
  content="width=device-width, initial-scale=1.0">

  <title>${title}</title>

  <style>

  *{
  margin:0;
  padding:0;
  box-sizing:border-box;
  font-family:Arial;
  }

  body{
  background:#0f172a;
  color:white;
  padding:20px;
  }

  .card{
  background:#111827;
  padding:20px;
  border-radius:20px;
  margin-bottom:20px;
  }

  input,textarea{
  width:100%;
  padding:12px;
  margin-top:10px;
  border:none;
  border-radius:10px;
  }

  button{
  padding:12px 18px;
  border:none;
  border-radius:10px;
  margin-top:10px;
  cursor:pointer;
  background:#2563eb;
  color:white;
  }

  a{
  color:#60a5fa;
  text-decoration:none;
  }

  </style>

  </head>

  <body>

  <h1>${title}</h1>

  <br>

  ${content}

  </body>

  </html>
  `;
}

/* =========================
   LOGIN
========================= */

app.get("/login", (req, res) => {
  res.send(`
  <html>

  <body style="
  background:#020617;
  display:flex;
  justify-content:center;
  align-items:center;
  height:100vh;
  font-family:Arial;
  ">

  <form method="POST"
  style="
  width:350px;
  background:#111827;
  padding:30px;
  border-radius:20px;
  ">

  <h1 style="color:white">
  📘 E-DNEVNIK
  </h1>

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
      "SELECT * FROM users WHERE username=$1",
      [username]
    );

    if (!rows.length) {
      return res.send("❌ User not found");
    }

    const user = rows[0];

    const valid = await bcrypt.compare(
      password,
      user.password
    );

    if (!valid) {
      return res.send("❌ Wrong password");
    }

    req.session.user = user;

    res.redirect("/");
  } catch (err) {
    res.send(err.toString());
  }
});

/* =========================
   DASHBOARD
========================= */

app.get("/", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM students ORDER BY id DESC"
    );

    res.send(
      layout(
        "Dashboard",
        `
        <a href="/students">
        👨‍🎓 Students
        </a>

        <br><br>

        <a href="/logout">
        🚪 Logout
        </a>

        <br><br>

        ${rows
          .map((s) => {
            const grades = safe(s.grades);

            return `
            <div class="card">

            <h2>${s.name}</h2>

            <p>
            📊 Average:
            ${avg(grades)}
            </p>

            <a href="/student/${s.id}">
            Open profile
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

/* =========================
   STUDENTS
========================= */

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

        <form method="POST"
        action="/students/add">

        <input
        name="name"
        placeholder="Student name">

        <button>
        Add student
        </button>

        </form>

        </div>

        ${rows
          .map((s) => {
            return `
            <div class="card">

            <h2>${s.name}</h2>

            <a href="/student/${s.id}">
            Open
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

/* =========================
   ADD STUDENT
========================= */

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
          grades
        )
        VALUES
        (
          $1,
          '[]'
        )
      `,
        [req.body.name]
      );

      res.redirect("/students");
    } catch (err) {
      res.send(err.toString());
    }
  }
);

/* =========================
   STUDENT PROFILE
========================= */

app.get(
  "/student/:id",
  auth,
  async (req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT * FROM students WHERE id=$1",
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
          <div class="card">

          <h2>${s.name}</h2>

          <p>
          📊 Average:
          ${avg(grades)}
          </p>

          </div>

          <div class="card">

          <form method="POST"
          action="/student/${s.id}/grade">

          <input
          name="subject"
          placeholder="Subject">

          <input
          name="value"
          placeholder="Grade">

          <button>
          Add grade
          </button>

          </form>

          </div>

          ${grades
            .map(
              (g, i) => `
            <div class="card">

            <h3>
            ${g.subject}
            </h3>

            <p>
            Grade:
            ${g.value}
            </p>

            <form method="POST"
            action="/student/${s.id}/delete-grade/${i}">

            <button>
            Delete
            </button>

            </form>

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
  }
);

/* =========================
   ADD GRADE
========================= */

app.post(
  "/student/:id/grade",
  auth,
  async (req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT grades FROM students WHERE id=$1",
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

/* =========================
   DELETE GRADE
========================= */

app.post(
  "/student/:id/delete-grade/:index",
  auth,
  async (req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT grades FROM students WHERE id=$1",
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

/* =========================
   LOGOUT
========================= */

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

/* =========================
   START
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    "🚀 SERVER ONLINE ON PORT " + PORT
  );
});

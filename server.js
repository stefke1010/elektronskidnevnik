/* =========================================================
   🚀 E-DNEVNIK X PRO MAX ULTRA
   FULL SERVER.JS
   ========================================================= */

const express = require("express");
const { Pool } = require("pg");
const session = require("express-session");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const app = express();

/* =========================================================
   CONFIG
   ========================================================= */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.use(
  session({
    secret: "EDNEVNIK_SECRET_ULTRA",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

/* =========================================================
   DATABASE
   ========================================================= */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/* =========================================================
   HELPERS
   ========================================================= */

const today = () =>
  new Date().toLocaleDateString("sr-RS");

const safe = (v) => {
  try {
    return Array.isArray(v)
      ? v
      : JSON.parse(v || "[]");
  } catch {
    return [];
  }
};

const avg = (grades = []) => {
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
};

const finalGrade = (grades = []) => {
  const a = Number(avg(grades));

  if (a >= 4.75) return 5;
  if (a >= 3.75) return 4;
  if (a >= 2.75) return 3;
  if (a >= 1.75) return 2;

  return 1;
};

const randomId = () =>
  crypto.randomBytes(5).toString("hex");

const auth = (req, res, next) => {
  if (!req.session.user)
    return res.redirect("/login");

  next();
};

/* =========================================================
   UI LAYOUT
   ========================================================= */

const layout = (title, content, user = "") => `
<!DOCTYPE html>

<html lang="sr">

<head>

<meta charset="UTF-8">

<title>${title}</title>

<link rel="preconnect" href="https://fonts.googleapis.com">

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
font-family:Inter;
}

body{
background:#0f172a;
color:white;
}

.sidebar{
position:fixed;
left:0;
top:0;
width:250px;
height:100vh;
background:#111827;
padding:20px;
border-right:1px solid #1e293b;
}

.logo{
font-size:28px;
font-weight:900;
margin-bottom:30px;
}

.nav a{
display:block;
padding:12px;
margin-bottom:10px;
border-radius:12px;
text-decoration:none;
color:white;
background:#1e293b;
transition:0.2s;
}

.nav a:hover{
background:#2563eb;
transform:translateX(5px);
}

.main{
margin-left:250px;
padding:30px;
}

.top{
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:25px;
}

.card{
background:#111827;
padding:20px;
border-radius:20px;
margin-bottom:20px;
box-shadow:0 0 30px rgba(0,0,0,0.3);
border:1px solid #1e293b;
}

.grid{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
gap:20px;
}

.stat{
padding:25px;
border-radius:20px;
background:linear-gradient(135deg,#2563eb,#7c3aed);
}

.stat h1{
font-size:40px;
}

input,textarea,select{
width:100%;
padding:14px;
margin-top:10px;
background:#0f172a;
border:1px solid #334155;
border-radius:12px;
color:white;
}

button{
padding:12px 18px;
border:none;
border-radius:12px;
background:#2563eb;
color:white;
font-weight:700;
cursor:pointer;
margin-top:10px;
transition:0.2s;
}

button:hover{
transform:scale(1.03);
}

.grade{
display:flex;
justify-content:space-between;
align-items:center;
padding:15px;
margin-top:10px;
background:#0f172a;
border-radius:14px;
}

.red{
background:#dc2626;
}

.green{
background:#16a34a;
}

.orange{
background:#f59e0b;
}

.table{
width:100%;
border-collapse:collapse;
margin-top:20px;
}

.table th,.table td{
padding:14px;
border-bottom:1px solid #1e293b;
text-align:left;
}

.badge{
padding:6px 12px;
border-radius:999px;
font-size:12px;
font-weight:700;
background:#16a34a;
}

</style>

</head>

<body>

<div class="sidebar">

<div class="logo">
📘 E-DNEVNIK
</div>

<div class="nav">
<a href="/">🏠 Dashboard</a>
<a href="/students">👨‍🎓 Učenici</a>
<a href="/teachers">👨‍🏫 Profesori</a>
<a href="/analytics">📊 Analitika</a>
<a href="/schedule">🕒 Raspored</a>
<a href="/messages">💬 Poruke</a>
<a href="/settings">⚙️ Podešavanja</a>
<a href="/logout">🚪 Logout</a>
</div>

</div>

<div class="main">

<div class="top">
<h1>${title}</h1>
<div>
👤 ${user}
</div>
</div>

${content}

</div>

</body>
</html>
`;

/* =========================================================
   LOGIN
   ========================================================= */

app.get("/login", (req, res) => {
  res.send(`
  <html>
  <body style="
  background:#020617;
  display:flex;
  align-items:center;
  justify-content:center;
  height:100vh;
  font-family:Inter;
  ">
  
  <form method="POST" style="
  width:400px;
  background:#111827;
  padding:40px;
  border-radius:25px;
  color:white;
  ">
  
  <h1 style="margin-bottom:20px">
  📘 E-DNEVNIK
  </h1>

  <input name="username" placeholder="Username">
  <input type="password" name="password" placeholder="Password">

  <button>
  LOGIN
  </button>

  </form>
  </body>
  </html>
  `);
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const { rows } = await pool.query(
    "SELECT * FROM users WHERE username=$1",
    [username]
  );

  if (!rows.length)
    return res.send("❌ USER NOT FOUND");

  const user = rows[0];

  const valid = await bcrypt.compare(
    password,
    user.password
  );

  if (!valid)
    return res.send("❌ WRONG PASSWORD");

  req.session.user = user;

  res.redirect("/");
});

/* =========================================================
   DASHBOARD
   ========================================================= */

app.get("/", auth, async (req, res) => {
  const students = await pool.query(
    "SELECT * FROM students"
  );

  const users = await pool.query(
    "SELECT * FROM users"
  );

  let totalGrades = 0;

  students.rows.forEach((s) => {
    totalGrades += safe(s.grades).length;
  });

  res.send(
    layout(
      "Dashboard",
      `
      <div class="grid">

      <div class="stat">
      <h1>${students.rows.length}</h1>
      <p>Učenika</p>
      </div>

      <div class="stat">
      <h1>${users.rows.length}</h1>
      <p>Profesora</p>
      </div>

      <div class="stat">
      <h1>${totalGrades}</h1>
      <p>Ocena</p>
      </div>

      </div>

      <div class="card">
      <h2>🔥 Sistem Online</h2>
      <p>
      E-DNEVNIK X PRO MAX radi savršeno.
      </p>
      </div>
      `,
      req.session.user.username
    )
  );
});

/* =========================================================
   STUDENTS
   ========================================================= */

app.get("/students", auth, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM students ORDER BY id DESC"
  );

  res.send(
    layout(
      "Učenici",
      `
      <div class="card">

      <form method="POST" action="/students/add">

      <input name="name" placeholder="Ime učenika">

      <input name="classroom" placeholder="Odeljenje">

      <button>
      ➕ Dodaj učenika
      </button>

      </form>

      </div>

      ${rows
        .map((s) => {
          const grades = safe(s.grades);

          return `
          <div class="card">

          <h2>${s.name}</h2>

          <p>
          📚 Odeljenje: ${s.classroom || "-"}
          </p>

          <p>
          📊 Prosek: ${avg(grades)}
          </p>

          <p>
          🏁 Zaključna: ${finalGrade(grades)}
          </p>

          <br>

          <a href="/student/${s.id}">
          <button>
          Otvori profil
          </button>
          </a>

          <form method="POST" action="/student/${s.id}/delete">
          <button class="red">
          Obriši
          </button>
          </form>

          </div>
          `;
        })
        .join("")}
      `,
      req.session.user.username
    )
  );
});

/* =========================================================
   ADD STUDENT
   ========================================================= */

app.post("/students/add", auth, async (req, res) => {
  await pool.query(
    `
    INSERT INTO students
    (
      name,
      classroom,
      grades,
      absences,
      notes,
      behavior
    )
    VALUES
    (
      $1,
      $2,
      '[]',
      '[]',
      '[]',
      '[]'
    )
  `,
    [req.body.name, req.body.classroom]
  );

  res.redirect("/students");
});

/* =========================================================
   STUDENT PROFILE
   ========================================================= */

app.get("/student/:id", auth, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM students WHERE id=$1",
    [req.params.id]
  );

  const s = rows[0];

  if (!s)
    return res.send("❌ Student not found");

  s.grades = safe(s.grades);
  s.notes = safe(s.notes);
  s.absences = safe(s.absences);

  res.send(
    layout(
      s.name,
      `
      <div class="grid">

      <div class="stat">
      <h1>${avg(s.grades)}</h1>
      <p>Prosek</p>
      </div>

      <div class="stat">
      <h1>${finalGrade(s.grades)}</h1>
      <p>Zaključna</p>
      </div>

      <div class="stat">
      <h1>${s.absences.length}</h1>
      <p>Izostanci</p>
      </div>

      </div>

      <div class="card">

      <h2>➕ Dodaj ocenu</h2>

      <form method="POST" action="/student/${s.id}/grade">

      <input name="subject" placeholder="Predmet">

      <input name="value" placeholder="Ocena">

      <textarea name="note" placeholder="Napomena"></textarea>

      <button class="green">
      Dodaj ocenu
      </button>

      </form>

      </div>

      <div class="card">

      <h2>📚 Ocene</h2>

      ${s.grades
        .map(
          (g, i) => `
        <div class="grade">

        <div>
        <h3>${g.subject}</h3>
        <p>
        Ocena: ${g.value}
        </p>
        <small>
        ${g.date}
        </small>
        </div>

        <div>

        <form method="POST" action="/student/${s.id}/grade/${i}/delete">

        <button class="red">
        Obriši
        </button>

        </form>

        </div>

        </div>
      `
        )
        .join("")}

      </div>

      <div class="card">

      <h2>📝 Beleške</h2>

      <form method="POST" action="/student/${s.id}/note">

      <textarea name="text"></textarea>

      <button>
      Dodaj belešku
      </button>

      </form>

      ${s.notes
        .map(
          (n) => `
        <div class="grade">
        <div>
        ${n.text}
        <br>
        <small>${n.date}</small>
        </div>
        </div>
      `
        )
        .join("")}

      </div>

      `,
      req.session.user.username
    )
  );
});

/* =========================================================
   ADD GRADE
   ========================================================= */

app.post(
  "/student/:id/grade",
  auth,
  async (req, res) => {
    const { rows } = await pool.query(
      "SELECT grades FROM students WHERE id=$1",
      [req.params.id]
    );

    let grades = safe(rows[0].grades);

    grades.push({
      id: randomId(),
      subject: req.body.subject,
      value: Number(req.body.value),
      note: req.body.note,
      date: today()
    });

    await pool.query(
      "UPDATE students SET grades=$1 WHERE id=$2",
      [
        JSON.stringify(grades),
        req.params.id
      ]
    );

    res.redirect(
      "/student/" + req.params.id
    );
  }
);

/* =========================================================
   DELETE GRADE
   ========================================================= */

app.post(
  "/student/:id/grade/:index/delete",
  auth,
  async (req, res) => {
    const { rows } = await pool.query(
      "SELECT grades FROM students WHERE id=$1",
      [req.params.id]
    );

    let grades = safe(rows[0].grades);

    grades.splice(req.params.index, 1);

    await pool.query(
      "UPDATE students SET grades=$1 WHERE id=$2",
      [
        JSON.stringify(grades),
        req.params.id
      ]
    );

    res.redirect(
      "/student/" + req.params.id
    );
  }
);

/* =========================================================
   NOTES
   ========================================================= */

app.post(
  "/student/:id/note",
  auth,
  async (req, res) => {
    const { rows } = await pool.query(
      "SELECT notes FROM students WHERE id=$1",
      [req.params.id]
    );

    let notes = safe(rows[0].notes);

    notes.push({
      text: req.body.text,
      date: today()
    });

    await pool.query(
      "UPDATE students SET notes=$1 WHERE id=$2",
      [
        JSON.stringify(notes),
        req.params.id
      ]
    );

    res.redirect(
      "/student/" + req.params.id
    );
  }
);

/* =========================================================
   DELETE STUDENT
   ========================================================= */

app.post(
  "/student/:id/delete",
  auth,
  async (req, res) => {
    await pool.query(
      "DELETE FROM students WHERE id=$1",
      [req.params.id]
    );

    res.redirect("/students");
  }
);

/* =========================================================
   TEACHERS PAGE
   ========================================================= */

app.get("/teachers", auth, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM users"
  );

  res.send(
    layout(
      "Profesori",
      `
      <div class="card">

      <form method="POST" action="/teachers/add">

      <input name="username" placeholder="Username">

      <input name="password" placeholder="Password">

      <select name="role">
      <option>teacher</option>
      <option>admin</option>
      </select>

      <button>
      Dodaj profesora
      </button>

      </form>

      </div>

      <table class="table">

      <tr>
      <th>ID</th>
      <th>Username</th>
      <th>Role</th>
      </tr>

      ${rows
        .map(
          (u) => `
        <tr>
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>
        <span class="badge">
        ${u.role}
        </span>
        </td>
        </tr>
      `
        )
        .join("")}

      </table>
      `,
      req.session.user.username
    )
  );
});

/* =========================================================
   ADD TEACHER
   ========================================================= */

app.post(
  "/teachers/add",
  auth,
  async (req, res) => {
    const hash = await bcrypt.hash(
      req.body.password,
      10
    );

    await pool.query(
      `
      INSERT INTO users
      (
        username,
        password,
        role
      )
      VALUES
      (
        $1,
        $2,
        $3
      )
    `,
      [
        req.body.username,
        hash,
        req.body.role
      ]
    );

    res.redirect("/teachers");
  }
);

/* =========================================================
   ANALYTICS
   ========================================================= */

app.get("/analytics", auth, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM students"
  );

  let averages = [];

  rows.forEach((s) => {
    averages.push(Number(avg(safe(s.grades))));
  });

  const schoolAvg =
    averages.reduce((a, b) => a + b, 0) /
    (averages.length || 1);

  res.send(
    layout(
      "Analitika",
      `
      <div class="grid">

      <div class="stat">
      <h1>${schoolAvg.toFixed(2)}</h1>
      <p>Prosek škole</p>
      </div>

      <div class="stat">
      <h1>${rows.length}</h1>
      <p>Ukupno učenika</p>
      </div>

      </div>

      <div class="card">
      <h2>📊 Napredna statistika</h2>
      <p>
      AI analiza uspeha učenika.
      </p>
      </div>
      `,
      req.session.user.username
    )
  );
});

/* =========================================================
   MESSAGES
   ========================================================= */

app.get("/messages", auth, async (req, res) => {
  res.send(
    layout(
      "Poruke",
      `
      <div class="card">

      <h2>💬 School Chat</h2>

      <p>
      LIVE CHAT SYSTEM COMING SOON
      </p>

      </div>
      `,
      req.session.user.username
    )
  );
});

/* =========================================================
   SETTINGS
   ========================================================= */

app.get("/settings", auth, async (req, res) => {
  res.send(
    layout(
      "Podešavanja",
      `
      <div class="card">

      <h2>⚙️ Sistem</h2>

      <p>
      Verzija: X PRO MAX
      </p>

      <p>
      Dark mode: ON
      </p>

      <p>
      Security: ENABLED
      </p>

      </div>
      `,
      req.session.user.username
    )
  );
});

/* =========================================================
   LOGOUT
   ========================================================= */

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

/* =========================================================
   START
   ========================================================= */

app.listen(5000, () => {
  console.log(`
  
███████╗██████╗ ███╗   ██╗███████╗██╗   ██╗██╗  ██╗
██╔════╝██╔══██╗████╗  ██║██╔════╝██║   ██║██║ ██╔╝
█████╗  ██║  ██║██╔██╗ ██║█████╗  ██║   ██║█████╔╝ 
██╔══╝  ██║  ██║██║╚██╗██║██╔══╝  ╚██╗ ██╔╝██╔═██╗ 
███████╗██████╔╝██║ ╚████║███████╗ ╚████╔╝ ██║  ██╗
╚══════╝╚═════╝ ╚═╝  ╚═══╝╚══════╝  ╚═══╝  ╚═╝  ╚═╝

🚀 E-DNEVNIK X PRO MAX ONLINE
  `);
});

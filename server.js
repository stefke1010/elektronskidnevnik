
/**
 * **************************************************************************
 * E-DNEVNIK ELITE PRO v10.0 - ULTRA EDITION
 * Autor: Stefan Mihajlović
 * **************************************************************************
 */

const express = require("express");
const { Pool } = require("pg");

const app = express();

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json());

let sessions = new Set();

const pool = new Pool({
  connectionString:
    "postgresql://postgres.xpgcmjqzbqplnmdkljpt:DDpGfUtsUvJEjdsn@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});

const getAvg = (g) =>
  g.length
    ? (
        g.reduce((a, b) => a + parseFloat(b.value || 0), 0) / g.length
      ).toFixed(2)
    : "0.00";

const getD = () => new Date().toLocaleDateString("sr-RS");

const suggestFinalGrade = (grades) => {
  if (!grades.length) return 1;

  const avg =
    grades.reduce((a, b) => a + Number(b.value || 0), 0) / grades.length;

  if (avg >= 4.5) return 5;
  if (avg >= 3.5) return 4;
  if (avg >= 2.5) return 3;
  if (avg >= 1.5) return 2;

  return 1;
};

/* -------------------------------------------------------------------------- */
/*                                   LAYOUT                                   */
/* -------------------------------------------------------------------------- */

const layout = (title, content) => `
<!DOCTYPE html>
<html lang="sr">
<head>
<meta charset="UTF-8">

<title>${title}</title>

<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">

<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<style>

:root{
    --bg:#0f172a;
    --card:#111827;
    --card2:#1e293b;
    --border:#334155;
    --primary:#3b82f6;
    --green:#10b981;
    --red:#ef4444;
    --yellow:#f59e0b;
    --purple:#8b5cf6;
    --text:#f8fafc;
    --muted:#94a3b8;
}

*{
    box-sizing:border-box;
}

body{
    margin:0;
    background:linear-gradient(135deg,#020617,#0f172a,#111827);
    color:var(--text);
    font-family:'Plus Jakarta Sans',sans-serif;
    display:flex;
    min-height:100vh;
}

/* SIDEBAR */

aside{
    width:270px;
    background:rgba(15,23,42,0.8);
    backdrop-filter:blur(20px);
    border-right:1px solid rgba(255,255,255,0.08);
    padding:30px 20px;
    position:fixed;
    height:100vh;
}

.logo{
    font-size:26px;
    font-weight:800;
    text-align:center;
    margin-bottom:35px;
    background:linear-gradient(to right,#3b82f6,#8b5cf6);
    -webkit-background-clip:text;
    -webkit-text-fill-color:transparent;
}

aside a{
    display:flex;
    align-items:center;
    gap:12px;
    text-decoration:none;
    color:#cbd5e1;
    padding:15px;
    border-radius:14px;
    margin-bottom:8px;
    transition:0.25s;
    font-weight:700;
}

aside a:hover{
    background:rgba(255,255,255,0.08);
    transform:translateX(5px);
    color:white;
}

.logout{
    margin-top:auto;
    color:#fb7185 !important;
}

/* MAIN */

main{
    flex:1;
    margin-left:270px;
    padding:40px;
}

h1{
    font-size:34px;
    margin-bottom:30px;
    font-weight:800;
}

/* CARDS */

.card{
    background:rgba(17,24,39,0.8);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:24px;
    padding:22px;
    margin-bottom:18px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    backdrop-filter:blur(20px);
    transition:0.3s;
}

.card:hover{
    transform:translateY(-4px);
    box-shadow:0 15px 30px rgba(0,0,0,0.3);
}

/* BUTTONS */

.btn{
    border:none;
    padding:12px 18px;
    border-radius:12px;
    cursor:pointer;
    font-weight:800;
    text-decoration:none;
    display:inline-flex;
    align-items:center;
    gap:8px;
    transition:0.2s;
}

.btn:hover{
    transform:scale(1.04);
}

.btn-primary{
    background:linear-gradient(to right,#2563eb,#3b82f6);
    color:white;
}

.btn-red{
    background:#7f1d1d;
    color:white;
}

.btn-green{
    background:#064e3b;
    color:white;
}

.btn-yellow{
    background:#78350f;
    color:white;
}

.btn-purple{
    background:#581c87;
    color:white;
}

.btn-gray{
    background:#334155;
    color:white;
}

/* INPUTS */

input,textarea,select{
    width:100%;
    background:#0f172a;
    color:white;
    border:1px solid #334155;
    padding:14px;
    border-radius:14px;
    margin-bottom:12px;
    font-family:inherit;
}

/* BADGE */

.badge{
    padding:5px 10px;
    border-radius:10px;
    font-size:11px;
    font-weight:800;
}

/* SCROLL */

::-webkit-scrollbar{
    width:10px;
}

::-webkit-scrollbar-thumb{
    background:#334155;
    border-radius:20px;
}

.grade-btns{
    display:grid;
    grid-template-columns:repeat(5,1fr);
    gap:8px;
    margin-bottom:15px;
}

.grade-btn{
    padding:12px;
    border:none;
    border-radius:12px;
    font-weight:800;
    cursor:pointer;
    color:white;
    font-size:16px;
}

.g5{background:#166534;}
.g4{background:#15803d;}
.g3{background:#ca8a04;}
.g2{background:#ea580c;}
.g1{background:#dc2626;}

.activity-grid{
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:10px;
    margin-bottom:15px;
}

.activity-btn{
    border:none;
    border-radius:16px;
    padding:16px;
    font-size:28px;
    cursor:pointer;
    background:#1e293b;
    transition:0.2s;
}

.activity-btn:hover{
    transform:scale(1.08);
}

.final-box{
    background:rgba(59,130,246,0.1);
    border:1px solid rgba(59,130,246,0.3);
    padding:20px;
    border-radius:20px;
    margin-bottom:20px;
}

.top-actions{
    display:flex;
    gap:10px;
    margin-bottom:20px;
    flex-wrap:wrap;
}

</style>
</head>

<body>

<aside>

<div class="logo">
E-DNEVNIK
</div>

<a href="/dashboard">
<i class="fas fa-home"></i>
Дашборд
</a>

<a href="/students">
<i class="fas fa-users"></i>
Ученици
</a>

<a href="/lesson/new">
<i class="fas fa-book"></i>
Нови час
</a>

<a href="/history">
<i class="fas fa-clock-rotate-left"></i>
Историја
</a>

<a href="/students/random">
<i class="fas fa-shuffle"></i>
Случајни ученик
</a>

<a href="/logout" class="logout">
<i class="fas fa-power-off"></i>
Одјава
</a>

</aside>

<main>
<h1>${title}</h1>
${content}
</main>

</body>
</html>
`;

/* -------------------------------------------------------------------------- */
/*                                   LOGIN                                    */
/* -------------------------------------------------------------------------- */

app.get("/login", (req, res) => {
  res.send(`
    <html>
    <head>

    <meta charset="UTF-8">

    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap" rel="stylesheet">

    <style>

    body{
        margin:0;
        height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        background:url('/pozadina dnevnik.jpg') center/cover no-repeat;
        font-family:'Plus Jakarta Sans',sans-serif;
    }

    .login{
        width:420px;
        padding:50px;
        border-radius:30px;
        background:rgba(255,255,255,0.1);
        backdrop-filter:blur(25px);
        border:1px solid rgba(255,255,255,0.2);
        box-shadow:0 20px 50px rgba(0,0,0,0.3);
    }

    h1{
        color:white;
        text-align:center;
        font-size:34px;
        margin-bottom:30px;
    }

    input{
        width:100%;
        padding:18px;
        border:none;
        border-radius:16px;
        margin-bottom:16px;
        font-size:15px;
    }

    button{
        width:100%;
        padding:18px;
        border:none;
        border-radius:16px;
        background:#2563eb;
        color:white;
        font-size:16px;
        font-weight:800;
        cursor:pointer;
    }

    </style>

    </head>

    <body>

    <div class="login">

    <h1>ПРИЈАВА</h1>

    <form method="POST">

    <input name="user" placeholder="Корисничко име" required>

    <input type="password" name="pass" placeholder="Лозинка" required>

    <button>
    УЂИ У ДНЕВНИК
    </button>

    </form>

    </div>

    </body>
    </html>
  `);
});

app.post("/login", (req, res) => {
  if (
    req.body.user === "stefanmihajlovic" &&
    req.body.pass === "stefanmihajloviccc"
  ) {
    sessions.add("admin");
    return res.redirect("/dashboard");
  }

  res.send(`
    <script>
    alert("Погрешни подаци!");
    location="/login";
    </script>
  `);
});

/* -------------------------------------------------------------------------- */
/*                                 DASHBOARD                                  */
/* -------------------------------------------------------------------------- */

app.get("/dashboard", async (req, res) => {
  const danas = getD();

  const { rows } = await pool.query(
    "SELECT * FROM lessons WHERE date = $1 ORDER BY id DESC",
    [danas]
  );

  const html = rows
    .map(
      (l) => `
    <div class="card">

    <div>
    <small style="color:#94a3b8">${l.date}</small>

    <h3>
    ${l.subject} (${l.period}. час)
    </h3>

    <p style="color:#94a3b8">
    ${l.topic}
    </p>
    </div>

    <form method="POST" action="/lesson/delete/${l.id}">
    <button class="btn btn-red">
    <i class="fas fa-trash"></i>
    </button>
    </form>

    </div>
  `
    )
    .join("");

  res.send(layout("Данас", html || "<div class='card'>Нема часова.</div>"));
});

/* -------------------------------------------------------------------------- */
/*                                  STUDENTS                                  */
/* -------------------------------------------------------------------------- */

app.get("/students", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM students ORDER BY name ASC"
  );

  const list = rows
    .map(
      (s) => `
    <div class="card">

    <div>
        <h3 style="margin:0">${s.name}</h3>

        <small style="color:#94a3b8">
        Просек: ${getAvg(s.grades)}
        </small>
    </div>

    <div style="display:flex; gap:10px">

        <a href="/student/${s.id}" class="btn btn-primary">
        ПРОФИЛ
        </a>

        <form method="POST" action="/student/${s.id}/delete">
        <button class="btn btn-red">
        <i class="fas fa-trash"></i>
        </button>
        </form>

    </div>

    </div>
  `
    )
    .join("");

  res.send(
    layout(
      "Ученици",

      `
      <div class="card">

      <form method="POST" action="/students/add" style="width:100%; display:flex; gap:10px;">

      <input name="name" placeholder="Име ученика">

      <button class="btn btn-primary">
      ДОДАЈ
      </button>

      </form>

      </div>

      ${list}
    `
    )
  );
});

/* -------------------------------------------------------------------------- */
/*                              RANDOM STUDENT                                */
/* -------------------------------------------------------------------------- */

app.get("/students/random", async (req, res) => {
  const { rows } = await pool.query("SELECT id FROM students");

  if (!rows.length) return res.redirect("/students");

  const random = rows[Math.floor(Math.random() * rows.length)];

  res.redirect("/student/" + random.id);
});

/* -------------------------------------------------------------------------- */
/*                               STUDENT PROFILE                              */
/* -------------------------------------------------------------------------- */

app.get("/student/:id", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM students WHERE id = $1",
    [req.params.id]
  );

  const s = rows[0];

  if (!s) return res.redirect("/students");

  const avg = getAvg(s.grades);
  const suggested = suggestFinalGrade(s.grades);

  const history = [
    ...s.grades.map((i) => ({
      ...i,
      color: "#2563eb",
      icon: "🎓",
    })),

    ...s.activity.map((i) => ({
      ...i,
      color: "#10b981",
      icon: "⚡",
    })),

    ...s.behavior.map((i) => ({
      ...i,
      color: "#8b5cf6",
      icon: "📘",
    })),
  ].reverse();

  const html = `
  
  <div class="top-actions">

  <a href="/students/random" class="btn btn-purple">
  <i class="fas fa-shuffle"></i>
  Случајни ученик
  </a>

  <form method="POST" action="/student/${s.id}/delete">
  <button class="btn btn-red">
  <i class="fas fa-trash"></i>
  Обриши ученика
  </button>
  </form>

  </div>

  <div class="final-box">

  <h2 style="margin-top:0">
  Закључна оцена
  </h2>

  <p>
  Предлог дневника:
  <b style="font-size:28px">${suggested}</b>
  </p>

  <form method="POST" action="/student/${s.id}/final-grade">

  <input
  type="number"
  min="1"
  max="5"
  name="final_grade"
  value="${s.final_grade || suggested}"
  >

  <button class="btn btn-primary">
  Сачувај закључну
  </button>

  </form>

  </div>

  <div style="display:grid; grid-template-columns:340px 1fr; gap:25px;">

  <div>

  <div class="card" style="display:block">

  <h2>Брзи унос оцена</h2>

  <form method="POST" action="/student/${s.id}/quick-grade">

  <input name="subject" placeholder="Предмет" required>

  <div class="grade-btns">

  <button class="grade-btn g5" name="value" value="5">5</button>
  <button class="grade-btn g4" name="value" value="4">4</button>
  <button class="grade-btn g3" name="value" value="3">3</button>
  <button class="grade-btn g2" name="value" value="2">2</button>
  <button class="grade-btn g1" name="value" value="1">1</button>

  </div>

  </form>

  </div>

  <div class="card" style="display:block">

  <h2>Владање</h2>

  <div style="display:flex; flex-direction:column; gap:10px">

  <form method="POST" action="/student/${s.id}/behavior">
  <input type="hidden" name="type" value="Напомена">
  <button class="btn btn-yellow" style="width:100%">
  Напомена
  </button>
  </form>

  <form method="POST" action="/student/${s.id}/behavior">
  <input type="hidden" name="type" value="Опомена">
  <button class="btn btn-red" style="width:100%">
  Опомена
  </button>
  </form>

  <form method="POST" action="/student/${s.id}/behavior">
  <input type="hidden" name="type" value="Укор">
  <button class="btn btn-purple" style="width:100%">
  Укор
  </button>
  </form>

  </div>

  </div>

  <div class="card" style="display:block">

  <h2>Активност</h2>

  <div class="activity-grid">

  <form method="POST" action="/student/${s.id}/activity">
  <input type="hidden" name="value" value="😄">
  <button class="activity-btn">😄</button>
  </form>

  <form method="POST" action="/student/${s.id}/activity">
  <input type="hidden" name="value" value="😐">
  <button class="activity-btn">😐</button>
  </form>

  <form method="POST" action="/student/${s.id}/activity">
  <input type="hidden" name="value" value="😢">
  <button class="activity-btn">😢</button>
  </form>

  </div>

  </div>

  </div>

  <div>

  ${history
    .map(
      (i) => `
    
    <div class="card" style="border-left:6px solid ${i.color}">

    <div>

    <small style="color:#94a3b8">
    ${i.date}
    </small>

    <h3>

    ${i.icon}

    ${i.subject || i.behavior_type || "Активност"}

    </h3>

    <p style="color:#94a3b8">
    ${i.note || "/"}
    </p>

    </div>

    <div style="font-size:28px; font-weight:800">
    ${i.value || i.behavior_type}
    </div>

    </div>

  `
    )
    .join("")}

  </div>

  </div>
  `;

  res.send(layout(s.name, html));
});

/* -------------------------------------------------------------------------- */
/*                                   ADDING                                   */
/* -------------------------------------------------------------------------- */

app.post("/students/add", async (req, res) => {
  await pool.query("INSERT INTO students (name) VALUES ($1)", [
    req.body.name,
  ]);

  res.redirect("/students");
});

/* QUICK GRADE */

app.post("/student/:id/quick-grade", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT grades FROM students WHERE id = $1",
    [req.params.id]
  );

  const grades = rows[0].grades || [];

  grades.push({
    subject: req.body.subject,
    value: req.body.value,
    note: "",
    date: getD(),
  });

  await pool.query("UPDATE students SET grades = $1 WHERE id = $2", [
    JSON.stringify(grades),
    req.params.id,
  ]);

  res.redirect("/student/" + req.params.id);
});

/* BEHAVIOR */

app.post("/student/:id/behavior", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT behavior FROM students WHERE id = $1",
    [req.params.id]
  );

  const behavior = rows[0].behavior || [];

  behavior.push({
    behavior_type: req.body.type,
    value: req.body.type,
    note: "",
    date: getD(),
  });

  await pool.query("UPDATE students SET behavior = $1 WHERE id = $2", [
    JSON.stringify(behavior),
    req.params.id,
  ]);

  res.redirect("/student/" + req.params.id);
});

/* ACTIVITY */

app.post("/student/:id/activity", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT activity FROM students WHERE id = $1",
    [req.params.id]
  );

  const activity = rows[0].activity || [];

  activity.push({
    value: req.body.value,
    note: "",
    date: getD(),
  });

  await pool.query("UPDATE students SET activity = $1 WHERE id = $2", [
    JSON.stringify(activity),
    req.params.id,
  ]);

  res.redirect("/student/" + req.params.id);
});

/* FINAL GRADE */

app.post("/student/:id/final-grade", async (req, res) => {
  await pool.query(
    "UPDATE students SET final_grade = $1 WHERE id = $2",
    [req.body.final_grade, req.params.id]
  );

  res.redirect("/student/" + req.params.id);
});

/* DELETE STUDENT */

app.post("/student/:id/delete", async (req, res) => {
  await pool.query("DELETE FROM students WHERE id = $1", [req.params.id]);

  res.redirect("/students");
});

/* -------------------------------------------------------------------------- */
/*                                   LESSONS                                  */
/* -------------------------------------------------------------------------- */

app.get("/lesson/new", async (req, res) => {
  res.send(
    layout(
      "Нови час",

      `
      <div class="card" style="display:block; max-width:700px; margin:auto">

      <form method="POST" action="/lesson/save">

      <input name="sub" placeholder="Предмет" required>

      <input name="top" placeholder="Наставна јединица" required>

      <input name="per" type="number" placeholder="Број часа" required>

      <button class="btn btn-primary">
      УПИШИ ЧАС
      </button>

      </form>

      </div>
    `
    )
  );
});

app.post("/lesson/save", async (req, res) => {
  await pool.query(
    "INSERT INTO lessons(subject,topic,period,date) VALUES($1,$2,$3,$4)",
    [req.body.sub, req.body.top, req.body.per, getD()]
  );

  res.redirect("/dashboard");
});

/* -------------------------------------------------------------------------- */
/*                                   HISTORY                                  */
/* -------------------------------------------------------------------------- */

app.get("/history", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM lessons ORDER BY id DESC"
  );

  const html = rows
    .map(
      (l) => `
    <div class="card">

    <div>

    <small style="color:#94a3b8">
    ${l.date}
    </small>

    <h3>
    ${l.subject}
    </h3>

    <p style="color:#94a3b8">
    ${l.topic}
    </p>

    </div>

    </div>
  `
    )
    .join("");

  res.send(layout("Архива", html));
});

/* -------------------------------------------------------------------------- */
/*                                   DELETE                                   */
/* -------------------------------------------------------------------------- */

app.post("/lesson/delete/:id", async (req, res) => {
  await pool.query("DELETE FROM lessons WHERE id = $1", [req.params.id]);

  res.redirect("/dashboard");
});

/* -------------------------------------------------------------------------- */
/*                                   LOGOUT                                   */
/* -------------------------------------------------------------------------- */

app.get("/logout", (req, res) => {
  sessions.delete("admin");

  res.redirect("/login");
});

app.get("/", (req, res) => {
  res.redirect("/dashboard");
});

/* -------------------------------------------------------------------------- */
/*                                   SERVER                                   */
/* -------------------------------------------------------------------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 E-DNEVNIK ONLINE NA PORTU " + PORT);
});

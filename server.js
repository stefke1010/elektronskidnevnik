/**
 * ============================================================================
 * E-DNEVNIK ELITE PRO MAX
 * FULL WORKING SERVER.JS
 * ============================================================================
 */

const express = require("express");
const { Pool } = require("pg");

const app = express();

/* ============================================================================
   MIDDLEWARE
============================================================================ */

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* ============================================================================
   DATABASE
============================================================================ */

const pool = new Pool({
  connectionString:
    "postgresql://postgres.xpgcmjqzbqplnmdkljpt:DDpGfUtsUvJEjdsn@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false,
  },
});

/* ============================================================================
   HELPERS
============================================================================ */

const getDate = () =>
  new Date().toLocaleDateString("sr-RS");

const average = (grades = []) => {
  if (!grades.length) return "0.00";

  const valid = grades.filter(
    (g) => !isNaN(Number(g.value))
  );

  if (!valid.length) return "0.00";

  return (
    valid.reduce((a, b) => a + Number(b.value), 0) /
    valid.length
  ).toFixed(2);
};

const suggestedFinal = (grades = []) => {
  const avg = Number(average(grades));

  if (avg >= 4.5) return 5;
  if (avg >= 3.5) return 4;
  if (avg >= 2.5) return 3;
  if (avg >= 1.5) return 2;

  return 1;
};

/* ============================================================================
   LAYOUT
============================================================================ */

const layout = (title, content) => `
<!DOCTYPE html>
<html lang="sr">

<head>

<meta charset="UTF-8">

<title>${title}</title>

<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap" rel="stylesheet">

<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">

<style>

*{
    box-sizing:border-box;
}

body{
    margin:0;
    font-family:'Plus Jakarta Sans',sans-serif;
    background:
    radial-gradient(circle at top left,#2563eb33,transparent 30%),
    radial-gradient(circle at bottom right,#7c3aed33,transparent 30%),
    #020617;
    color:white;
    display:flex;
    min-height:100vh;
}

/* SIDEBAR */

aside{
    width:270px;
    background:rgba(15,23,42,0.85);
    backdrop-filter:blur(20px);
    border-right:1px solid rgba(255,255,255,0.08);
    padding:30px 20px;
    position:fixed;
    height:100vh;
    overflow:auto;
}

.logo{
    font-size:28px;
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
    margin-bottom:10px;
    transition:0.2s;
    font-weight:700;
}

aside a:hover{
    background:rgba(255,255,255,0.08);
    transform:translateX(4px);
    color:white;
}

/* MAIN */

main{
    flex:1;
    margin-left:270px;
    padding:40px;
}

h1{
    margin-top:0;
    font-size:36px;
}

/* CARDS */

.card{
    background:rgba(15,23,42,0.7);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:24px;
    padding:24px;
    margin-bottom:20px;
    backdrop-filter:blur(20px);
    transition:0.2s;
}

.card:hover{
    transform:translateY(-4px);
    box-shadow:0 15px 35px rgba(0,0,0,0.35);
}

/* BUTTONS */

.btn{
    border:none;
    padding:12px 18px;
    border-radius:14px;
    cursor:pointer;
    font-weight:800;
    color:white;
    transition:0.2s;
}

.btn:hover{
    transform:scale(1.05);
}

.blue{
    background:#2563eb;
}

.green{
    background:#059669;
}

.red{
    background:#dc2626;
}

.orange{
    background:#ea580c;
}

.purple{
    background:#7c3aed;
}

.gray{
    background:#475569;
}

/* INPUTS */

input,textarea,select{
    width:100%;
    background:#0f172a;
    border:1px solid #334155;
    color:white;
    padding:14px;
    border-radius:14px;
    margin-bottom:12px;
    font-family:inherit;
}

/* FLEX */

.flex{
    display:flex;
    gap:10px;
    flex-wrap:wrap;
}

.grid{
    display:grid;
    grid-template-columns:350px 1fr;
    gap:20px;
}

.small{
    font-size:13px;
    color:#94a3b8;
}

.big{
    font-size:28px;
    font-weight:800;
}

/* BADGE */

.badge{
    display:inline-block;
    padding:6px 10px;
    border-radius:10px;
    font-size:12px;
    font-weight:800;
}

/* SCROLLBAR */

::-webkit-scrollbar{
    width:10px;
}

::-webkit-scrollbar-thumb{
    background:#334155;
    border-radius:20px;
}

</style>

</head>

<body>

<aside>

<div class="logo">
E-DNEVNIK
</div>

<a href="/dashboard">
<i class="fas fa-house"></i>
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
<i class="fas fa-clock"></i>
Историја
</a>

<a href="/student/random">
<i class="fas fa-dice"></i>
Случајни ученик
</a>

</aside>

<main>

<h1>${title}</h1>

${content}

</main>

</body>
</html>
`;

/* ============================================================================
   LOGIN
============================================================================ */

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
      justify-content:center;
      align-items:center;
      background:url('/pozadina dnevnik.jpg') center/cover no-repeat;
      font-family:'Plus Jakarta Sans',sans-serif;
  }

  .box{
      width:420px;
      padding:50px;
      border-radius:30px;
      background:rgba(255,255,255,0.12);
      backdrop-filter:blur(20px);
      box-shadow:0 20px 40px rgba(0,0,0,0.35);
  }

  h1{
      color:white;
      text-align:center;
      margin-bottom:30px;
  }

  input{
      width:100%;
      padding:18px;
      border:none;
      border-radius:16px;
      margin-bottom:15px;
  }

  button{
      width:100%;
      padding:18px;
      border:none;
      border-radius:16px;
      background:#2563eb;
      color:white;
      font-weight:800;
      cursor:pointer;
  }

  </style>

  </head>

  <body>

  <div class="box">

  <h1>ПРИЈАВА</h1>

  <form method="POST">

  <input
  name="user"
  placeholder="Корисничко име"
  required
  >

  <input
  type="password"
  name="pass"
  placeholder="Лозинка"
  required
  >

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
    return res.redirect("/dashboard");
  }

  res.send(`
  <script>
  alert("Погрешни подаци!");
  location="/login";
  </script>
  `);
});

/* ============================================================================
   DASHBOARD
============================================================================ */

app.get("/dashboard", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM lessons ORDER BY id DESC"
  );

  const html =
    rows
      .map(
        (l) => `
      <div class="card">

      <div class="small">
      ${l.date}
      </div>

      <h2>
      ${l.subject}
      </h2>

      <div>
      ${l.topic}
      </div>

      </div>
    `
      )
      .join("") || `<div class="card">Нема часова.</div>`;

  res.send(layout("Дашборд", html));
});

/* ============================================================================
   STUDENTS
============================================================================ */

app.get("/students", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM students ORDER BY name ASC"
  );

  const html = `
  
  <div class="card">

  <form method="POST" action="/students/add">

  <input
  name="name"
  placeholder="Име ученика"
  required
  >

  <button class="btn blue">
  ДОДАЈ УЧЕНИКА
  </button>

  </form>

  </div>

  ${rows
    .map(
      (s) => `
    
    <div class="card">

    <div>

    <h2 style="margin:0;">
    ${s.name}
    </h2>

    <div class="small">
    Просек: ${average(s.grades || [])}
    </div>

    </div>

    <div class="flex">

    <a href="/student/${s.id}">
    <button class="btn blue">
    ПРОФИЛ
    </button>
    </a>

    <form method="POST" action="/student/${s.id}/delete">

    <button class="btn red">
    <i class="fas fa-trash"></i>
    </button>

    </form>

    </div>

    </div>
  `
    )
    .join("")}
  `;

  res.send(layout("Ученици", html));
});

/* ADD STUDENT */

app.post("/students/add", async (req, res) => {
  await pool.query(
    `
    INSERT INTO students
    (name, grades, behavior, activity, absences)
    VALUES ($1, '[]', '[]', '[]', '[]')
  `,
    [req.body.name]
  );

  res.redirect("/students");
});

/* RANDOM STUDENT */

app.get("/student/random", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id FROM students"
  );

  if (!rows.length) {
    return res.redirect("/students");
  }

  const random =
    rows[Math.floor(Math.random() * rows.length)];

  res.redirect("/student/" + random.id);
});

/* DELETE STUDENT */

app.post("/student/:id/delete", async (req, res) => {
  await pool.query(
    "DELETE FROM students WHERE id=$1",
    [req.params.id]
  );

  res.redirect("/students");
});

/* ============================================================================
   STUDENT PROFILE
============================================================================ */

app.get("/student/:id", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM students WHERE id=$1",
    [req.params.id]
  );

  const s = rows[0];

  if (!s) {
    return res.redirect("/students");
  }

  s.grades = s.grades || [];
  s.behavior = s.behavior || [];
  s.activity = s.activity || [];
  s.absences = s.absences || [];

  const history = [
    ...s.grades.map((g) => ({
      title: g.subject,
      value: g.value,
      note: g.note,
      date: g.date,
      color: "#2563eb",
    })),

    ...s.behavior.map((b) => ({
      title: b.behavior_type,
      value: "📘",
      note: b.note,
      date: b.date,
      color: "#7c3aed",
    })),

    ...s.activity.map((a) => ({
      title: "Активност",
      value: a.value,
      note: a.note,
      date: a.date,
      color: "#10b981",
    })),
  ].reverse();

  const html = `
  
  <div class="card">

  <h2>
  ${s.name}
  </h2>

  <div class="small">
  Просек: ${average(s.grades)}
  </div>

  <div class="big">
  Предложена закључна: ${suggestedFinal(
    s.grades
  )}
  </div>

  <form method="POST" action="/student/${s.id}/final">

  <input
  type="number"
  name="final_grade"
  min="1"
  max="5"
  value="${
    s.final_grade || suggestedFinal(s.grades)
  }"
  >

  <button class="btn blue">
  САЧУВАЈ ЗАКЉУЧНУ
  </button>

  </form>

  </div>

  <div class="grid">

  <div>

  <!-- OCENE -->

  <div class="card">

  <h2>Оцене</h2>

  <form method="POST" action="/student/${s.id}/grade">

  <input
  name="subject"
  placeholder="Предмет"
  required
  >

  <textarea
  name="note"
  placeholder="Белешка"
  required
  ></textarea>

  <div class="flex">

  <button class="btn green" name="value" value="5">
  5
  </button>

  <button class="btn green" name="value" value="4">
  4
  </button>

  <button class="btn orange" name="value" value="3">
  3
  </button>

  <button class="btn red" name="value" value="2">
  2
  </button>

  <button class="btn red" name="value" value="1">
  1
  </button>

  </div>

  </form>

  </div>

  <!-- VLADANJE -->

  <div class="card">

  <h2>Владање</h2>

  <form method="POST" action="/student/${s.id}/behavior">

  <textarea
  name="note"
  placeholder="Обавезна белешка"
  required
  ></textarea>

  <div class="flex">

  <button
  class="btn orange"
  name="type"
  value="Напомена"
  >
  Напомена
  </button>

  <button
  class="btn red"
  name="type"
  value="Опомена"
  >
  Опомена
  </button>

  <button
  class="btn purple"
  name="type"
  value="Укор"
  >
  Укор
  </button>

  </div>

  </form>

  </div>

  <!-- AKTIVNOST -->

  <div class="card">

  <h2>Активност</h2>

  <form method="POST" action="/student/${s.id}/activity">

  <textarea
  name="note"
  placeholder="Белешка"
  required
  ></textarea>

  <div class="flex">

  <button
  class="btn green"
  name="value"
  value="😄"
  >
  😄
  </button>

  <button
  class="btn gray"
  name="value"
  value="😐"
  >
  😐
  </button>

  <button
  class="btn red"
  name="value"
  value="😢"
  >
  😢
  </button>

  </div>

  </form>

  </div>

  </div>

  <!-- HISTORY -->

  <div>

  ${history
    .map(
      (h) => `
    
    <div
    class="card"
    style="border-left:6px solid ${h.color}"
    >

    <div>

    <div class="small">
    ${h.date}
    </div>

    <h2>
    ${h.title}
    </h2>

    <div>
    ${h.note}
    </div>

    </div>

    <div class="big">
    ${h.value}
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

/* ============================================================================
   ADD GRADE
============================================================================ */

app.post("/student/:id/grade", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT grades FROM students WHERE id=$1",
    [req.params.id]
  );

  const grades = rows[0].grades || [];

  grades.push({
    subject: req.body.subject,
    value: req.body.value,
    note: req.body.note,
    date: getDate(),
  });

  await pool.query(
    "UPDATE students SET grades=$1 WHERE id=$2",
    [JSON.stringify(grades), req.params.id]
  );

  res.redirect("/student/" + req.params.id);
});

/* ============================================================================
   ADD BEHAVIOR
============================================================================ */

app.post("/student/:id/behavior", async (req, res) => {
  if (!req.body.note) {
    return res.send(`
    <script>
    alert("Мораш унети белешку!");
    history.back();
    </script>
    `);
  }

  const { rows } = await pool.query(
    "SELECT behavior FROM students WHERE id=$1",
    [req.params.id]
  );

  const behavior = rows[0].behavior || [];

  behavior.push({
    behavior_type: req.body.type,
    note: req.body.note,
    date: getDate(),
  });

  await pool.query(
    "UPDATE students SET behavior=$1 WHERE id=$2",
    [JSON.stringify(behavior), req.params.id]
  );

  res.redirect("/student/" + req.params.id);
});

/* ============================================================================
   ADD ACTIVITY
============================================================================ */

app.post("/student/:id/activity", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT activity FROM students WHERE id=$1",
    [req.params.id]
  );

  const activity = rows[0].activity || [];

  activity.push({
    value: req.body.value,
    note: req.body.note,
    date: getDate(),
  });

  await pool.query(
    "UPDATE students SET activity=$1 WHERE id=$2",
    [JSON.stringify(activity), req.params.id]
  );

  res.redirect("/student/" + req.params.id);
});

/* ============================================================================
   FINAL GRADE
============================================================================ */

app.post("/student/:id/final", async (req, res) => {
  await pool.query(
    "UPDATE students SET final_grade=$1 WHERE id=$2",
    [req.body.final_grade, req.params.id]
  );

  res.redirect("/student/" + req.params.id);
});

/* ============================================================================
   LESSONS
============================================================================ */

app.get("/lesson/new", (req, res) => {
  res.send(
    layout(
      "Нови час",

      `
      <div class="card">

      <form method="POST" action="/lesson/save">

      <input
      name="subject"
      placeholder="Предмет"
      required
      >

      <input
      name="topic"
      placeholder="Наставна јединица"
      required
      >

      <input
      type="number"
      name="period"
      placeholder="Број часа"
      required
      >

      <button class="btn blue">
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
    `
    INSERT INTO lessons
    (subject, topic, period, date)
    VALUES ($1, $2, $3, $4)
  `,
    [
      req.body.subject,
      req.body.topic,
      req.body.period,
      getDate(),
    ]
  );

  res.redirect("/dashboard");
});

/* ============================================================================
   HISTORY
============================================================================ */

app.get("/history", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM lessons ORDER BY id DESC"
  );

  const html =
    rows
      .map(
        (l) => `
      <div class="card">

      <div class="small">
      ${l.date}
      </div>

      <h2>
      ${l.subject}
      </h2>

      <div>
      ${l.topic}
      </div>

      </div>
    `
      )
      .join("") || `<div class="card">Празно.</div>`;

  res.send(layout("Историја", html));
});

/* ============================================================================
   ROOT
============================================================================ */

app.get("/", (req, res) => {
  res.redirect("/dashboard");
});

/* ============================================================================
   ERROR
============================================================================ */

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).send(`
  <h1>SERVER ERROR</h1>
  <pre>${err}</pre>
  `);
});

/* ============================================================================
   SERVER
============================================================================ */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 SERVER ONLINE NA PORTU " + PORT);
});

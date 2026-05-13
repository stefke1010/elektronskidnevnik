const express = require("express");
const { Pool } = require("pg");
const session = require("express-session");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

app.use(session({
  secret: "dnevnik-secret",
  resave: false,
  saveUninitialized: true
}));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:9SoDlCttj9lF76TZ",
  ssl: { rejectUnauthorized: false }
});

/* ================= HELPERS ================= */

const today = () => new Date().toLocaleDateString("sr-RS");

const safe = (x) => {
  try {
    return Array.isArray(x) ? x : JSON.parse(x || "[]");
  } catch {
    return [];
  }
};

const avg = (arr = []) => {
  const g = arr.filter(x => x?.value && !isNaN(x.value));
  if (!g.length) return 0;
  return (g.reduce((a,b)=>a+Number(b.value),0)/g.length).toFixed(2);
};

const suggest = (grades = []) => {
  const a = Number(avg(grades));
  if (a >= 4.5) return 5;
  if (a >= 3.5) return 4;
  if (a >= 2.5) return 3;
  if (a >= 1.5) return 2;
  return 1;
};

/* ================= LOGIN ================= */

app.get("/login", (req,res)=>{
res.send(`
<html>
<body style="background:#0f172a;color:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial">
<form method="POST" style="background:#111827;padding:30px;border-radius:20px;width:300px">
<h2>LOGIN</h2>
<input name="u" placeholder="user" style="width:100%;padding:10px;margin:10px 0">
<input name="p" type="password" placeholder="pass" style="width:100%;padding:10px;margin:10px 0">
<button style="width:100%;padding:10px">LOGIN</button>
</form>
</body>
</html>
`);
});

app.post("/login",(req,res)=>{
if(req.body.u==="admin" && req.body.p==="admin"){
req.session.user=true;
return res.redirect("/students");
}
res.send("wrong");
});

const auth = (req,res,next)=>{
if(!req.session.user) return res.redirect("/login");
next();
};

/* ================= UI ================= */

const layout = (title, content) => `
<html>
<head>
<meta charset="UTF-8">
<style>
body{margin:0;font-family:Arial;background:#0b1220;color:white}
main{padding:20px}
.card{background:#111827;padding:15px;border-radius:15px;margin-bottom:10px}
.btn{padding:8px 12px;border:none;border-radius:10px;cursor:pointer}
.blue{background:#2563eb;color:white}
.red{background:#dc2626;color:white}
.green{background:#16a34a;color:white}
.flex{display:flex;gap:10px;flex-wrap:wrap}
input,textarea{width:100%;padding:10px;margin:5px 0;border-radius:10px;border:none}
small{color:#94a3b8}
</style>
</head>
<body>
<main>
<h1>${title}</h1>
${content}
</main>
</body>
</html>
`;

/* ================= ROUTES ================= */

app.get("/", (req,res)=>res.redirect("/students"));

/* ================= STUDENTS ================= */

app.get("/students", auth, async (req,res)=>{
const { rows } = await pool.query("SELECT * FROM students ORDER BY id DESC");

res.send(layout("Učenici", `
<div class="card">
<form method="POST" action="/students/add">
<input name="name" placeholder="ime">
<button class="btn blue">Dodaj</button>
</form>
</div>

<a href="/random"><button class="btn green">🎲 Random učenik</button></a>

${rows.map(s=>`
<div class="card">
<h3>${s.name}</h3>
<small>Prosek: ${avg(safe(s.grades))}</small>
<div class="flex">
<a href="/student/${s.id}"><button class="btn blue">Profil</button></a>
<form method="POST" action="/student/${s.id}/delete">
<button class="btn red">Obriši</button>
</form>
</div>
</div>
`).join("")}
`));
});

app.post("/students/add", auth, async (req,res)=>{
await pool.query(
"INSERT INTO students(name,grades,behavior,activity,absences) VALUES($1,'[]','[]','[]','[]')",
[req.body.name]
);
res.redirect("/students");
});

app.post("/student/:id/delete", auth, async (req,res)=>{
await pool.query("DELETE FROM students WHERE id=$1",[req.params.id]);
res.redirect("/students");
});

/* ================= RANDOM ================= */

app.get("/random", auth, async (req,res)=>{
const { rows } = await pool.query("SELECT id FROM students");
if(!rows.length) return res.redirect("/students");
const r = rows[Math.floor(Math.random()*rows.length)];
res.redirect("/student/"+r.id);
});

/* ================= STUDENT ================= */

app.get("/student/:id", auth, async (req,res)=>{
const { rows } = await pool.query("SELECT * FROM students WHERE id=$1",[req.params.id]);
const s = rows[0];

s.grades = safe(s.grades);
s.behavior = safe(s.behavior);
s.activity = safe(s.activity);

res.send(layout(s.name, `

<div class="card">
<h2>${s.name}</h2>
<p>Prosek: ${avg(s.grades)}</p>
<h3>Zaključna predlog: ${suggest(s.grades)}</h3>
</div>

<!-- OCENE -->
<div class="card">
<h3>Ocene</h3>
<form method="POST" action="/student/${s.id}/grade">
<input name="subject" placeholder="predmet">
<input name="value" placeholder="ocena">
<textarea name="note" placeholder="beleška"></textarea>
<button class="btn green">Dodaj</button>
</form>

${s.grades.map((g,i)=>`
<div class="card">
<b>${g.subject}</b> - ${g.value}
<p>${g.note}</p>
<form method="POST" action="/student/${s.id}/delete-grade/${i}">
<button class="btn red">Obriši</button>
</form>
</div>
`).join("")}
</div>

<!-- VLADANJE -->
<div class="card">
<h3>Vladanje</h3>
<form method="POST" action="/student/${s.id}/behavior">
<textarea name="note" required></textarea>
<button class="btn blue">Napomena</button>
<button class="btn red" name="type" value="Opomena">Opomena</button>
</form>

${s.behavior.map((b,i)=>`
<div class="card">
${b.type || "Napomena"} - ${b.note}
<form method="POST" action="/student/${s.id}/delete-behavior/${i}">
<button class="btn red">Obriši</button>
</form>
</div>
`).join("")}
</div>

<!-- AKTIVNOST -->
<div class="card">
<h3>Aktivnost</h3>
<form method="POST" action="/student/${s.id}/activity">
<textarea name="note"></textarea>
<button class="btn green" name="value" value="😀">😀</button>
<button class="btn red" name="value" value="😢">😢</button>
</form>

${s.activity.map((a,i)=>`
<div class="card">
${a.value} ${a.note}
<form method="POST" action="/student/${s.id}/delete-activity/${i}">
<button class="btn red">Obriši</button>
</form>
</div>
`).join("")}
</div>

`));
});

/* ================= ACTIONS ================= */

app.post("/student/:id/grade", auth, async (req,res)=>{
const { rows } = await pool.query("SELECT grades FROM students WHERE id=$1",[req.params.id]);
let g = safe(rows[0].grades);

g.push({
subject:req.body.subject,
value:req.body.value,
note:req.body.note,
date:today()
});

await pool.query("UPDATE students SET grades=$1 WHERE id=$2",[JSON.stringify(g),req.params.id]);
res.redirect("/student/"+req.params.id);
});

app.post("/student/:id/behavior", auth, async (req,res)=>{
const { rows } = await pool.query("SELECT behavior FROM students WHERE id=$1",[req.params.id]);
let b = safe(rows[0].behavior);

b.push({
type:req.body.type || "Napomena",
note:req.body.note,
date:today()
});

await pool.query("UPDATE students SET behavior=$1 WHERE id=$2",[JSON.stringify(b),req.params.id]);
res.redirect("/student/"+req.params.id);
});

app.post("/student/:id/activity", auth, async (req,res)=>{
const { rows } = await pool.query("SELECT activity FROM students WHERE id=$1",[req.params.id]);
let a = safe(rows[0].activity);

a.push({
value:req.body.value,
note:req.body.note,
date:today()
});

await pool.query("UPDATE students SET activity=$1 WHERE id=$2",[JSON.stringify(a),req.params.id]);
res.redirect("/student/"+req.params.id);
});

/* ================= DELETE ITEMS ================= */

app.post("/student/:id/delete-grade/:i", auth, async (req,res)=>{
const { rows } = await pool.query("SELECT grades FROM students WHERE id=$1",[req.params.id]);
let g = safe(rows[0].grades);
g.splice(req.params.i,1);
await pool.query("UPDATE students SET grades=$1 WHERE id=$2",[JSON.stringify(g),req.params.id]);
res.redirect("/student/"+req.params.id);
});

app.post("/student/:id/delete-behavior/:i", auth, async (req,res)=>{
const { rows } = await pool.query("SELECT behavior FROM students WHERE id=$1",[req.params.id]);
let b = safe(rows[0].behavior);
b.splice(req.params.i,1);
await pool.query("UPDATE students SET behavior=$1 WHERE id=$2",[JSON.stringify(b),req.params.id]);
res.redirect("/student/"+req.params.id);
});

app.post("/student/:id/delete-activity/:i", auth, async (req,res)=>{
const { rows } = await pool.query("SELECT activity FROM students WHERE id=$1",[req.params.id]);
let a = safe(rows[0].activity);
a.splice(req.params.i,1);
await pool.query("UPDATE students SET activity=$1 WHERE id=$2",[JSON.stringify(a),req.params.id]);
res.redirect("/student/"+req.params.id);
});

/* ================= START ================= */

app.listen(5000, ()=>console.log("MAX UPGRADE 2 RUNNING"));

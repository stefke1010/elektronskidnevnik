const express = require("express");
const { Pool } = require("pg");
const session = require("express-session");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

app.use(session({
  secret: "edu-secret-final",
  resave: false,
  saveUninitialized: true
}));

/* ================= DATABASE ================= */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/* ================= HELPERS ================= */

const today = () => new Date().toLocaleDateString("sr-RS");

const safe = (v) => {
  try { return Array.isArray(v) ? v : JSON.parse(v || "[]"); }
  catch { return []; }
};

const avg = (arr=[]) => {
  const g = arr.filter(x => x?.value && !isNaN(x.value));
  if(!g.length) return 0;
  return (g.reduce((a,b)=>a+Number(b.value),0)/g.length).toFixed(2);
};

const finalGrade = (grades=[]) => {
  const a = Number(avg(grades));
  if(a >= 4.75) return 5;
  if(a >= 3.75) return 4;
  if(a >= 2.75) return 3;
  if(a >= 1.75) return 2;
  return 1;
};

/* ================= RANDOM CREDENTIALS ================= */

const genUsername = () =>
  "user_" + Math.random().toString(36).substring(2, 8);

const genPassword = () =>
  Math.random().toString(36).substring(2, 10);

/* ================= AUTH ================= */

app.get("/login",(req,res)=>{
res.send(`
<html>
<body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#f1f5f9;font-family:Arial">
<form method="POST" style="background:white;padding:30px;border-radius:15px;box-shadow:0 10px 30px rgba(0,0,0,0.1)">
<h2>📘 E-DNEVNIK</h2>
<input name="u" placeholder="username" style="width:100%;padding:10px;margin:5px 0">
<input name="p" type="password" placeholder="password" style="width:100%;padding:10px;margin:5px 0">
<button style="width:100%;padding:10px;background:#2563eb;color:white;border:none;border-radius:10px">Login</button>
</form>
</body>
</html>
`);
});

/* LOGIN FROM DB */

app.post("/login", async (req,res)=>{
const {rows}=await pool.query(
"SELECT * FROM users WHERE username=$1 AND password=$2",
[req.body.u,req.body.p]
);

if(rows.length){
req.session.user=rows[0];
return res.redirect("/students");
}

res.send("❌ pogresan login");
});

const auth=(req,res,next)=>{
if(!req.session.user) return res.redirect("/login");
next();
};

/* ================= UI ================= */

const layout=(title,content)=>`
<html>
<head>
<style>
body{margin:0;font-family:Arial;background:linear-gradient(135deg,#e0f2fe,#f8fafc);color:#0f172a}
header{
display:flex;
justify-content:space-between;
padding:15px 20px;
background:white;
box-shadow:0 2px 10px rgba(0,0,0,0.05);
}
main{padding:25px;max-width:1100px;margin:auto}
.card{
background:white;
padding:15px;
border-radius:16px;
margin-bottom:10px;
box-shadow:0 10px 25px rgba(0,0,0,0.05);
}
.btn{padding:8px 12px;border:none;border-radius:10px;cursor:pointer;font-weight:600}
.blue{background:#2563eb;color:white}
.green{background:#16a34a;color:white}
.red{background:#dc2626;color:white}
input,textarea{
width:100%;
padding:10px;
margin:5px 0;
border-radius:10px;
border:1px solid #ddd;
}
.flex{display:flex;gap:10px;flex-wrap:wrap}
small{color:#64748b}
</style>
</head>
<body>

<header>
<h3>📘 E-DNEVNIK ULTIMATE</h3>
<a href="/logout">logout</a>
</header>

<main>
<h1>${title}</h1>
${content}
</main>

</body>
</html>
`;

/* ================= STUDENTS ================= */

app.get("/",(req,res)=>res.redirect("/students"));

app.get("/students",auth,async(req,res)=>{
const {rows}=await pool.query("SELECT * FROM students ORDER BY id DESC");

res.send(layout("Učenici",`
<div class="card">
<form method="POST" action="/students/add">
<input name="name" placeholder="ime učenika">
<button class="btn blue">Dodaj</button>
</form>
</div>

<form method="POST" action="/users/add" class="card">
<button class="btn green">👤 Dodaj profil</button>
</form>

<a href="/random"><button class="btn green">🎲 Random učenik</button></a>

${rows.map(s=>`
<div class="card">
<h3>${s.name}</h3>
<small>Prosek: ${avg(safe(s.grades))}</small>
<small>Zaključna: ${finalGrade(safe(s.grades))}</small>

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

/* ADD STUDENT */

app.post("/students/add",auth,async(req,res)=>{
await pool.query(
"INSERT INTO students(name,grades,behavior,activity,absences) VALUES($1,'[]','[]','[]','[]')",
[req.body.name]
);
res.redirect("/students");
});

/* DELETE STUDENT */

app.post("/student/:id/delete",auth,async(req,res)=>{
await pool.query("DELETE FROM students WHERE id=$1",[req.params.id]);
res.redirect("/students");
});

/* RANDOM */

app.get("/random",auth,async(req,res)=>{
const {rows}=await pool.query("SELECT id FROM students");
const r=rows[Math.floor(Math.random()*rows.length)];
res.redirect("/student/"+r.id);
});

/* ================= USERS ================= */

app.post("/users/add",auth,async(req,res)=>{
const u = genUsername();
const p = genPassword();

await pool.query(
"INSERT INTO users(username,password,role) VALUES($1,$2,'teacher')",
[u,p]
);

res.send(`
<div style="font-family:Arial;padding:20px">
<h2>✅ Profil kreiran</h2>
<p><b>Username:</b> ${u}</p>
<p><b>Password:</b> ${p}</p>
<a href="/students">Nazad</a>
</div>
`);
});

/* ================= STUDENT PAGE ================= */

app.get("/student/:id",auth,async(req,res)=>{
const {rows}=await pool.query("SELECT * FROM students WHERE id=$1",[req.params.id]);
const s=rows[0];

s.grades=safe(s.grades);
s.behavior=safe(s.behavior);
s.activity=safe(s.activity);

res.send(layout(s.name,`

<div class="card">
<h2>${s.name}</h2>
<p>📊 Prosek: ${avg(s.grades)}</p>
<p>🏁 Zaključna: ${finalGrade(s.grades)}</p>
</div>

<div class="card">
<h3>Ocene</h3>
<form method="POST" action="/student/${s.id}/grade">
<input name="subject">
<input name="value">
<textarea name="note"></textarea>
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

`));
});

/* ================= ACTIONS ================= */

app.post("/student/:id/grade",auth,async(req,res)=>{
const {rows}=await pool.query("SELECT grades FROM students WHERE id=$1",[req.params.id]);
let g=safe(rows[0].grades);

g.push({
subject:req.body.subject,
value:req.body.value,
note:req.body.note,
date:today()
});

await pool.query("UPDATE students SET grades=$1 WHERE id=$2",[JSON.stringify(g),req.params.id]);
res.redirect("/student/"+req.params.id);
});

/* ================= START ================= */

app.get("/logout",(req,res)=>{
req.session.destroy(()=>res.redirect("/login"));
});

app.listen(5000,()=>console.log("🚀 ULTIMATE E-DNEVNIK RUNNING"));

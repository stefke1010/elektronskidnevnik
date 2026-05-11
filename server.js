const express = require("express");
const { Pool } = require("pg");
const session = require("express-session");

const app = express();

/* ======================================================
   CONFIG
====================================================== */

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: "ednevnik-enterprise",
    resave: false,
    saveUninitialized: true
}));

/* ======================================================
   DATABASE
====================================================== */

const pool = new Pool({
    connectionString:
    "postgresql://postgres.xpgcmjqzbqplnmdkljpt:DDpGfUtsUvJEjdsn@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
});

const initDB = async () => {
    try {

        await pool.query(`
        
        CREATE TABLE IF NOT EXISTS students (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            class_name TEXT DEFAULT '',
            grades JSONB DEFAULT '[]',
            activity JSONB DEFAULT '[]',
            behavior JSONB DEFAULT '[]',
            absences JSONB DEFAULT '[]'
        );

        CREATE TABLE IF NOT EXISTS lessons (
            id SERIAL PRIMARY KEY,
            subject TEXT,
            topic TEXT,
            class_name TEXT,
            period INT,
            date TEXT
        );

        `);

        console.log("✅ ENTERPRISE eDnevnik spreman");

    } catch(err) {
        console.log(err);
    }
};

initDB();

/* ======================================================
   HELPERS
====================================================== */

function auth(req,res,next){
    if(req.session.user){
        next();
    } else {
        res.redirect("/login");
    }
}

const avg = (grades) => {
    if(!grades.length) return "0.00";

    return (
        grades.reduce((a,b)=>a+parseFloat(b.value),0)
        / grades.length
    ).toFixed(2);
};

const today = () =>
new Date().toLocaleDateString("sr-RS");

/* ======================================================
   ULTRA ENTERPRISE LAYOUT
====================================================== */

const layout = (title, content) => `

<html lang="sr">

<head>
<meta charset="UTF-8">

<title>${title}</title>

<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">

<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">

<style>

:root{
    --primary:#2563eb;
    --primary2:#60a5fa;
    --bg:#f1f5f9;
    --sidebar:#0f172a;
    --card:#ffffff;
    --text:#0f172a;
    --muted:#64748b;
    --border:#e2e8f0;
    --danger:#ef4444;
    --success:#10b981;
    --warning:#f59e0b;
}

*{
    margin:0;
    padding:0;
    box-sizing:border-box;
}

body{
    background:var(--bg);
    font-family:'Plus Jakarta Sans',sans-serif;
    display:flex;
    color:var(--text);
}

/* SIDEBAR */

.sidebar{
    width:290px;
    height:100vh;

    background:
    linear-gradient(
        180deg,
        #081224 0%,
        #10264a 50%,
        #2563eb 100%
    );

    position:fixed;
    left:0;
    top:0;

    padding:25px;

    display:flex;
    flex-direction:column;

    box-shadow:
    10px 0 40px rgba(0,0,0,0.15);
}

.logo{
    display:flex;
    align-items:center;
    gap:14px;

    margin-bottom:40px;
}

.logo-box{
    width:56px;
    height:56px;
    border-radius:18px;

    background:rgba(255,255,255,0.12);

    display:flex;
    align-items:center;
    justify-content:center;

    color:white;
    font-size:24px;
}

.logo h2{
    color:white;
    font-size:21px;
    font-weight:800;
}

.logo span{
    color:rgba(255,255,255,0.55);
    font-size:13px;
}

.nav-title{
    color:rgba(255,255,255,0.35);
    font-size:11px;
    letter-spacing:2px;
    margin:20px 0 10px 10px;
    font-weight:700;
}

.sidebar a{
    color:rgba(255,255,255,0.72);
    text-decoration:none;

    display:flex;
    align-items:center;
    gap:14px;

    padding:15px 18px;

    border-radius:18px;

    margin-bottom:8px;

    transition:0.25s;
    font-weight:700;
}

.sidebar a:hover{
    background:rgba(255,255,255,0.12);
    color:white;
    transform:translateX(4px);
}

.logout{
    margin-top:auto;
    background:rgba(239,68,68,0.12);
    color:#fecaca !important;
}

/* MAIN */

.main{
    flex:1;
    margin-left:290px;
    padding:30px;
}

/* TOPBAR */

.topbar{
    background:white;
    border-radius:24px;

    padding:22px 30px;

    display:flex;
    align-items:center;
    justify-content:space-between;

    margin-bottom:30px;

    border:1px solid var(--border);

    box-shadow:
    0 10px 30px rgba(0,0,0,0.04);
}

.topbar h1{
    font-size:28px;
    font-weight:800;
}

.topbar p{
    color:var(--muted);
    margin-top:4px;
}

.user{
    display:flex;
    align-items:center;
    gap:14px;
}

.avatar{
    width:50px;
    height:50px;
    border-radius:50%;

    background:
    linear-gradient(
        135deg,
        #2563eb,
        #60a5fa
    );

    display:flex;
    align-items:center;
    justify-content:center;

    color:white;
    font-weight:800;
}

/* STATS */

.stats{
    display:grid;
    grid-template-columns:
    repeat(auto-fit,minmax(220px,1fr));

    gap:20px;

    margin-bottom:30px;
}

.stat{
    background:white;
    border-radius:24px;

    padding:25px;

    border:1px solid var(--border);

    box-shadow:
    0 10px 30px rgba(0,0,0,0.04);

    position:relative;
    overflow:hidden;
}

.stat::before{
    content:"";
    position:absolute;
    width:120px;
    height:120px;
    border-radius:50%;
    background:rgba(37,99,235,0.06);

    right:-30px;
    top:-30px;
}

.stat small{
    color:var(--muted);
    font-weight:700;
}

.stat h2{
    margin-top:10px;
    font-size:34px;
    font-weight:800;
}

/* CARDS */

.card{
    background:white;

    border-radius:24px;

    padding:24px;

    margin-bottom:18px;

    border:1px solid var(--border);

    box-shadow:
    0 10px 30px rgba(0,0,0,0.04);

    display:flex;
    justify-content:space-between;
    align-items:center;

    transition:0.25s;

    position:relative;
    overflow:hidden;
}

.card::before{
    content:"";
    position:absolute;
    left:0;
    top:0;
    width:6px;
    height:100%;

    background:
    linear-gradient(
        180deg,
        #2563eb,
        #60a5fa
    );
}

.card:hover{
    transform:translateY(-4px);

    box-shadow:
    0 20px 40px rgba(0,0,0,0.08);
}

/* BUTTONS */

.btn{
    border:none;
    cursor:pointer;

    padding:13px 18px;

    border-radius:14px;

    font-weight:800;

    transition:0.2s;

    text-decoration:none;

    display:inline-flex;
    align-items:center;
    gap:10px;
}

.btn-blue{
    background:#2563eb;
    color:white;
}

.btn-red{
    background:#fee2e2;
    color:#ef4444;
}

.btn-gray{
    background:#f1f5f9;
    color:#475569;
}

.btn:hover{
    transform:scale(1.03);
}

/* FORMS */

input,
select,
textarea{
    width:100%;

    padding:16px;

    border-radius:16px;

    border:1px solid var(--border);

    margin-bottom:14px;

    font-family:inherit;
    font-size:15px;

    background:#fff;
}

textarea{
    resize:vertical;
}

/* TABLE */

.table{
    width:100%;
    border-collapse:collapse;
}

.table th{
    text-align:left;
    color:#64748b;
    font-size:13px;
    padding:16px;
}

.table td{
    padding:16px;
    border-top:1px solid #eef2f7;
}

.badge{
    padding:6px 12px;
    border-radius:999px;
    font-size:12px;
    font-weight:800;
}

.b-blue{
    background:#dbeafe;
    color:#2563eb;
}

.b-red{
    background:#fee2e2;
    color:#ef4444;
}

.b-green{
    background:#d1fae5;
    color:#10b981;
}

.warning{
    background:#fff7ed;
    color:#ea580c;
    padding:18px;
    border-radius:18px;
    font-weight:700;
    margin-bottom:20px;
    border:1px solid #fed7aa;
}

</style>

</head>

<body>

<div class="sidebar">

    <div class="logo">
        <div class="logo-box">
            <i class="fas fa-graduation-cap"></i>
        </div>

        <div>
            <h2>eDnevnik</h2>
            <span>Enterprise Edition</span>
        </div>
    </div>

    <div class="nav-title">GLAVNO</div>

    <a href="/dashboard">
        <i class="fas fa-chart-pie"></i>
        Dashboard
    </a>

    <a href="/students">
        <i class="fas fa-users"></i>
        Učenici
    </a>

    <a href="/lesson/new">
        <i class="fas fa-book-open"></i>
        Novi čas
    </a>

    <a href="/history">
        <i class="fas fa-history"></i>
        Istorija
    </a>

    <a href="/analytics">
        <i class="fas fa-chart-line"></i>
        Analitika
    </a>

    <a href="/logout" class="logout">
        <i class="fas fa-sign-out-alt"></i>
        Odjava
    </a>

</div>

<div class="main">

<div class="topbar">

    <div>
        <h1>${title}</h1>
        <p>Profesionalni elektronski dnevnik za nastavnike</p>
    </div>

    <div class="user">
        <div>
            <strong>Stefan Mihajlović</strong>
            <p style="margin:0;color:#64748b">Nastavnik</p>
        </div>

        <div class="avatar">
            S
        </div>
    </div>

</div>

${content}

</div>

</body>
</html>
`;

/* ======================================================
   LOGIN
====================================================== */

app.get("/login",(req,res)=>{

    res.send(`

    <html>

    <head>

    <title>Login</title>

    <style>

    body{
        margin:0;
        height:100vh;

        display:flex;
        align-items:center;
        justify-content:center;

        background:
        linear-gradient(
            135deg,
            #081224,
            #10264a,
            #2563eb
        );

        font-family:sans-serif;
    }

    .box{
        width:420px;

        background:white;

        padding:50px;

        border-radius:30px;

        box-shadow:
        0 20px 60px rgba(0,0,0,0.25);
    }

    h1{
        margin-bottom:30px;
    }

    input{
        width:100%;
        padding:18px;

        border-radius:16px;
        border:1px solid #ddd;

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

    <h1>eDnevnik Login</h1>

    <form method="POST">

    <input
    name="user"
    placeholder="Korisničko ime"
    >

    <input
    type="password"
    name="pass"
    placeholder="Lozinka"
    >

    <button>
    PRIJAVI SE
    </button>

    </form>

    </div>

    </body>

    </html>

    `);
});

app.post("/login",(req,res)=>{

    if(
        req.body.user === "stefanmihajlovic"
        &&
        req.body.pass === "stefanmihajloviccc"
    ){
        req.session.user = true;
        return res.redirect("/dashboard");
    }

    res.send(`
    <script>
    alert("Pogrešan login");
    location="/login";
    </script>
    `);
});

/* ======================================================
   DASHBOARD
====================================================== */

app.get("/dashboard", auth, async (req,res)=>{

    const students =
    await pool.query("SELECT * FROM students");

    const lessons =
    await pool.query("SELECT * FROM lessons");

    const todayLessons =
    lessons.rows.filter(x=>x.date===today());

    const content = `

    <div class="stats">

        <div class="stat">
            <small>UKUPNO UČENIKA</small>
            <h2>${students.rows.length}</h2>
        </div>

        <div class="stat">
            <small>DANAŠNJI ČASOVI</small>
            <h2>${todayLessons.length}</h2>
        </div>

        <div class="stat">
            <small>AKTIVNI PREDMETI</small>
            <h2>8</h2>
        </div>

        <div class="stat">
            <small>IZOSTANCI</small>
            <h2>
            ${
                students.rows.reduce(
                    (a,b)=>a+b.absences.length,
                    0
                )
            }
            </h2>
        </div>

    </div>

    ${
        todayLessons.map(l=>`

        <div class="card">

            <div>

                <small style="color:#64748b">
                ${l.date}
                </small>

                <h2 style="margin-top:8px">
                ${l.subject}
                </h2>

                <p style="margin-top:6px;color:#64748b">
                ${l.topic}
                </p>

            </div>

            <form method="POST" action="/lesson/delete/${l.id}">

                <button class="btn btn-red">
                    <i class="fas fa-trash"></i>
                </button>

            </form>

        </div>

        `).join("")
    }

    `;

    res.send(
        layout("Dashboard",content)
    );
});

/* ======================================================
   STUDENTS
====================================================== */

app.get("/students", auth, async (req,res)=>{

    const { rows } =
    await pool.query(
        "SELECT * FROM students ORDER BY name ASC"
    );

    const content = `

    <div class="card">

    <form
    method="POST"
    action="/students/add"
    style="
    width:100%;
    display:flex;
    gap:14px;
    "
    >

    <input
    name="name"
    placeholder="Ime učenika"
    >

    <input
    name="class_name"
    placeholder="Odeljenje"
    >

    <button class="btn btn-blue">
    DODAJ
    </button>

    </form>

    </div>

    ${
        rows.map(s=>`

        <div class="card">

            <div>

                <small style="color:#64748b">
                ${s.class_name || "Nema odeljenje"}
                </small>

                <h2 style="margin:8px 0">
                ${s.name}
                </h2>

                <span class="badge b-blue">
                Prosek ${avg(s.grades)}
                </span>

            </div>

            <a
            href="/student/${s.id}"
            class="btn btn-blue"
            >
            PROFIL
            </a>

        </div>

        `).join("")
    }

    `;

    res.send(
        layout("Učenici",content)
    );
});

/* ======================================================
   STUDENT PROFILE
====================================================== */

app.get("/student/:id", auth, async (req,res)=>{

    const { rows } =
    await pool.query(
        "SELECT * FROM students WHERE id=$1",
        [req.params.id]
    );

    const s = rows[0];

    if(!s) return res.redirect("/students");

    const warnings = [];

    if(
        s.grades.filter(x=>x.value=="1").length >= 3
    ){
        warnings.push(
        "Učenik ima 3 ili više jedinica");
    }

    if(
        s.behavior.length >= 3
    ){
        warnings.push(
        "Pojačan vaspitni rad");
    }

    const history = [

        ...s.grades.map((x,i)=>({
            ...x,
            type:"grades",
            idx:i,
            color:"#2563eb"
        })),

        ...s.activity.map((x,i)=>({
            ...x,
            type:"activity",
            idx:i,
            color:"#10b981"
        })),

        ...s.behavior.map((x,i)=>({
            ...x,
            type:"behavior",
            idx:i,
            color:"#f59e0b"
        })),

        ...s.absences.map((x,i)=>({
            ...x,
            type:"absences",
            idx:i,
            color:"#ef4444"
        }))

    ].sort((a,b)=>
        new Date(b.date)-new Date(a.date)
    );

    const content = `

    ${
        warnings.map(w=>`
        <div class="warning">
        ⚠ ${w}
        </div>
        `).join("")
    }

    <div
    style="
    display:grid;
    grid-template-columns:380px 1fr;
    gap:25px;
    "
    >

    <div>

    <div class="card">

    <form
    method="POST"
    action="/student/${s.id}/add"
    style="width:100%"
    >

    <select name="type">

        <option value="grades">
        Ocena
        </option>

        <option value="activity">
        Aktivnost
        </option>

        <option value="behavior">
        Vladanje
        </option>

    </select>

    <input
    name="subject"
    placeholder="Predmet"
    required
    >

    <input
    name="value"
    placeholder="Ocena / vrednost"
    required
    >

    <textarea
    name="note"
    placeholder="Napomena"
    rows="4"
    ></textarea>

    <button class="btn btn-blue">
    SAČUVAJ
    </button>

    </form>

    </div>

    </div>

    <div>

    ${
        history.map(h=>`

        <div
        class="card"
        style="
        border-left:6px solid ${h.color}
        "
        >

            <div>

                <small style="color:#64748b">
                ${h.date}
                </small>

                <h2 style="margin:6px 0">
                ${h.subject || "Izostanak"}
                </h2>

                <p style="color:#64748b">
                ${h.note || ""}
                </p>

            </div>

            <div
            style="
            display:flex;
            align-items:center;
            gap:15px;
            "
            >

                <div
                style="
                font-size:28px;
                font-weight:800;
                "
                >
                ${h.value || ""}
                </div>

                <form
                method="POST"
                action="/student/${s.id}/delete-item/${h.type}/${h.idx}"
                >

                    <button class="btn btn-red">
                    <i class="fas fa-trash"></i>
                    </button>

                </form>

            </div>

        </div>

        `).join("")
    }

    </div>

    </div>

    `;

    res.send(
        layout(s.name,content)
    );
});

/* ======================================================
   ADD ITEM
====================================================== */

app.post("/student/:id/add", auth, async (req,res)=>{

    const { rows } =
    await pool.query(
        "SELECT * FROM students WHERE id=$1",
        [req.params.id]
    );

    const s = rows[0];

    const type = req.body.type;

    const list = [
        ...s[type],
        {
            subject:req.body.subject,
            value:req.body.value,
            note:req.body.note,
            date:today()
        }
    ];

    await pool.query(
        `UPDATE students SET ${type}=$1 WHERE id=$2`,
        [JSON.stringify(list),req.params.id]
    );

    res.redirect("/student/"+req.params.id);
});

/* ======================================================
   DELETE ITEM
====================================================== */

app.post("/student/:id/delete-item/:type/:idx",
auth,
async (req,res)=>{

    const { rows } =
    await pool.query(
        "SELECT * FROM students WHERE id=$1",
        [req.params.id]
    );

    const s = rows[0];

    s[req.params.type]
    .splice(req.params.idx,1);

    await pool.query(
        `UPDATE students SET ${req.params.type}=$1 WHERE id=$2`,
        [
            JSON.stringify(s[req.params.type]),
            req.params.id
        ]
    );

    res.redirect("/student/"+req.params.id);
});

/* ======================================================
   LESSON
====================================================== */

app.get("/lesson/new", auth, async (req,res)=>{

    const { rows } =
    await pool.query(
        "SELECT * FROM students ORDER BY name ASC"
    );

    const content = `

    <div class="card">

    <form
    method="POST"
    action="/lesson/save"
    style="width:100%"
    >

    <input
    name="sub"
    placeholder="Predmet"
    required
    >

    <input
    name="top"
    placeholder="Nastavna jedinica"
    required
    >

    <input
    name="class_name"
    placeholder="Odeljenje"
    required
    >

    <input
    type="number"
    name="per"
    placeholder="Broj časa"
    required
    >

    <h3 style="margin:20px 0">
    Odsutni učenici
    </h3>

    <div
    style="
    max-height:300px;
    overflow:auto;
    background:#f8fafc;
    padding:15px;
    border-radius:16px;
    "
    >

    ${
        rows.map(s=>`

        <label
        style="
        display:flex;
        align-items:center;
        gap:10px;
        margin-bottom:12px;
        "
        >

        <input
        type="checkbox"
        name="abs_ids"
        value="${s.id}"
        style="width:auto"
        >

        ${s.name}

        </label>

        `).join("")
    }

    </div>

    <button
    class="btn btn-blue"
    style="
    margin-top:25px;
    width:100%;
    justify-content:center;
    "
    >

    ZAPOČNI ČAS

    </button>

    </form>

    </div>

    `;

    res.send(
        layout("Novi čas",content)
    );
});

app.post("/lesson/save", auth, async (req,res)=>{

    await pool.query(
        `
        INSERT INTO lessons
        (subject,topic,class_name,period,date)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [
            req.body.sub,
            req.body.top,
            req.body.class_name,
            req.body.per,
            today()
        ]
    );

    if(req.body.abs_ids){

        const ids =
        Array.isArray(req.body.abs_ids)
        ?
        req.body.abs_ids
        :
        [req.body.abs_ids];

        for(let id of ids){

            const { rows } =
            await pool.query(
                "SELECT absences FROM students WHERE id=$1",
                [id]
            );

            const list = [
                ...rows[0].absences,
                {
                    subject:req.body.sub,
                    status:"Neregulisan",
                    date:today()
                }
            ];

            await pool.query(
                `
                UPDATE students
                SET absences=$1
                WHERE id=$2
                `,
                [JSON.stringify(list),id]
            );
        }
    }

    res.redirect("/dashboard");
});

/* ======================================================
   HISTORY
====================================================== */

app.get("/history", auth, async (req,res)=>{

    const { rows } =
    await pool.query(
        "SELECT * FROM lessons ORDER BY id DESC"
    );

    const content =

    rows.map(l=>`

    <div class="card">

        <div>

            <small style="color:#64748b">
            ${l.date}
            </small>

            <h2 style="margin:6px 0">
            ${l.subject}
            </h2>

            <p style="color:#64748b">
            ${l.topic}
            </p>

        </div>

        <span class="badge b-blue">
        ${l.class_name}
        </span>

    </div>

    `).join("");

    res.send(
        layout("Istorija časova",content)
    );
});

/* ======================================================
   ANALYTICS
====================================================== */

app.get("/analytics", auth, async (req,res)=>{

    const { rows } =
    await pool.query(
        "SELECT * FROM students"
    );

    const totalGrades =
    rows.reduce(
        (a,b)=>a+b.grades.length,
        0
    );

    const totalAbs =
    rows.reduce(
        (a,b)=>a+b.absences.length,
        0
    );

    const avgAll =
    rows.length
    ?
    (
        rows.reduce(
            (a,b)=>a+parseFloat(avg(b.grades)),
            0
        ) / rows.length
    ).toFixed(2)
    :
    "0.00";

    const content = `

    <div class="stats">

        <div class="stat">
            <small>UKUPNO OCENA</small>
            <h2>${totalGrades}</h2>
        </div>

        <div class="stat">
            <small>PROSEČAN USPEH</small>
            <h2>${avgAll}</h2>
        </div>

        <div class="stat">
            <small>IZOSTANCI</small>
            <h2>${totalAbs}</h2>
        </div>

    </div>

    `;

    res.send(
        layout("Analitika",content)
    );
});

/* ======================================================
   ADD STUDENT
====================================================== */

app.post("/students/add", auth, async (req,res)=>{

    await pool.query(
        `
        INSERT INTO students
        (name,class_name)
        VALUES ($1,$2)
        `,
        [
            req.body.name,
            req.body.class_name
        ]
    );

    res.redirect("/students");
});

/* ======================================================
   DELETE LESSON
====================================================== */

app.post("/lesson/delete/:id",
auth,
async (req,res)=>{

    await pool.query(
        "DELETE FROM lessons WHERE id=$1",
        [req.params.id]
    );

    res.redirect("/dashboard");
});

/* ======================================================
   LOGOUT
====================================================== */

app.get("/logout",(req,res)=>{

    req.session.destroy(()=>{
        res.redirect("/login");
    });
});

/* ======================================================
   ROOT
====================================================== */

app.get("/",(req,res)=>{
    res.redirect("/dashboard");
});

/* ======================================================
   START
====================================================== */

const PORT =
process.env.PORT || 5000;

app.listen(PORT,()=>{

    console.log(
    "🚀 eDnevnik pokrenut na portu "+PORT
    );

});

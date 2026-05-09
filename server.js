const express = require("express");
const fs = require("fs");
const nodemailer = require("nodemailer");
const app = express();

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

const DB = "./db.json";
const sessions = new Set();

// --- KONFIGURACIJA (Zameni sa svojim podacima) ---
const ADMIN_EMAIL = "tvoj-mejl@gmail.com"; 
const EMAIL_PASS = "tvoj app password"; 

const load = () => {
    if (!fs.existsSync(DB)) {
        fs.writeFileSync(DB, JSON.stringify({ 
            lessons: [], 
            students: [], 
            config: { adminUser: "stefanmihajlovic", adminPass: "stefanmihajloviccc", email: ADMIN_EMAIL } 
        }));
    }
    let data = JSON.parse(fs.readFileSync(DB));
    data.students.forEach(s => { 
        if(!s.absences) s.absences = []; 
        if(!s.grades) s.grades = [];
        if(!s.activity) s.activity = [];
        if(!s.behavior) s.behavior = [];
    });
    return data;
};
const save = (d) => fs.writeFileSync(DB, JSON.stringify(d, null, 2));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: ADMIN_EMAIL, pass: EMAIL_PASS }
});

// Fix za "Cannot GET /dashboard/"
app.use((req, res, next) => {
    if (req.path.substr(-1) === '/' && req.path.length > 1) {
        res.redirect(301, req.path.slice(0, -1));
    } else {
        next();
    }
});

function auth(req, res, next) {
    const publicPages = ["/login", "/forgot-password", "/recover"];
    if (publicPages.includes(req.path) || req.path.endsWith(".jpg")) return next();
    if (!sessions.has("admin")) return res.redirect("/login");
    next();
}
app.use(auth);

/* --- LAYOUT --- */
const layout = (title, content) => `
    <html lang="sr"><head><meta charset="UTF-8">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { margin: 0; font-family: 'Inter', sans-serif; background: #f8fafc; display: flex; }
        .sidebar { width: 280px; height: 100vh; background: #0f172a; padding: 40px 20px; position: fixed; color: white; box-sizing: border-box; }
        .sidebar a { display: flex; align-items: center; gap: 15px; color: #94a3b8; text-decoration: none; padding: 15px; border-radius: 12px; transition: 0.3s; }
        .sidebar a:hover { background: rgba(255,255,255,0.05); color: white; }
        .main { flex: 1; margin-left: 280px; padding: 60px; }
        .card { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 20px; border: 1px solid #f1f5f9; position: relative; }
        .item-grade { border-left: 8px solid #3b82f6; } .item-activity { border-left: 8px solid #22c55e; }
        .item-behavior { border-left: 8px solid #ef4444; } .item-absence { border-left: 8px solid #f59e0b; }
        .btn { padding: 10px 20px; border: none; border-radius: 10px; cursor: pointer; font-weight: 700; transition: 0.2s; display: inline-flex; align-items: center; gap: 8px; text-decoration:none; }
        .btn-primary { background: #2563eb; color: white; }
        .btn-danger { background: #fee2e2; color: #ef4444; }
        .btn-random { background: #8b5cf6; color: white; width: 100%; justify-content: center; margin-bottom: 20px; padding: 15px; font-size: 16px; }
        input, select { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; width: 100%; margin-bottom: 10px; }
    </style></head>
    <body>
        <div class="sidebar">
            <h2 style="color: #3b82f6; text-align:center;">DNEVNIK</h2>
            <a href="/dashboard"><i class="fas fa-home"></i> Dashboard</a>
            <a href="/students"><i class="fas fa-users"></i> Spisak Đaka</a>
            <a href="/lesson/new"><i class="fas fa-plus"></i> Novi Čas</a>
            <a href="/logout" style="margin-top: 40px; color: #f87171;"><i class="fas fa-sign-out-alt"></i> Izlaz</a>
        </div>
        <div class="main"><h1>${title}</h1>${content}</div>
    </body></html>`;

/* --- RUTE --- */

app.get("/", (req, res) => res.redirect("/dashboard"));

app.get("/login", (req, res) => {
    res.send(`<body style="background:url('pozadina dnevnik.jpg') center/cover; display:flex; align-items:center; height:100vh; font-family:sans-serif;">
        <div style="margin-left:10%; background:rgba(255,255,255,0.9); padding:50px; border-radius:30px; width:350px;">
            <h2>Prijavi se</h2>
            <form method="POST"><input name="user" placeholder="Korisnik" style="width:100%; padding:15px; margin:10px 0; border-radius:10px; border:1px solid #ddd;">
            <input name="pass" type="password" placeholder="Lozinka" style="width:100%; padding:15px; margin:10px 0; border-radius:10px; border:1px solid #ddd;">
            <button style="width:100%; padding:15px; background:#2563eb; color:white; border:none; border-radius:10px; cursor:pointer;">UĐI</button></form>
            <a href="/forgot-password" style="display:block; text-align:center; margin-top:20px; color:#666; text-decoration:none;">Zaboravio sam podatke</a>
        </div></body>`);
});

app.post("/login", (req, res) => {
    const db = load();
    if (req.body.user === db.config.adminUser && req.body.pass === db.config.adminPass) {
        sessions.add("admin"); return res.redirect("/dashboard");
    }
    res.send("Greška. <a href='/login'>Nazad</a>");
});

app.get("/logout", (req, res) => { sessions.clear(); res.redirect("/login"); });

// --- SPISAK ĐAKA I NASUMIČAN ODABIR ---
app.get("/students", (req, res) => {
    const db = load();
    const sHtml = db.students.map(s => `
        <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin:0;">${s.name}</h3>
            <div style="display:flex; gap:10px;">
                <a href="/student/${s.id}" class="btn btn-primary">Profil</a>
                <form method="POST" action="/student/delete/${s.id}" style="margin:0;"><button class="btn btn-danger"><i class="fas fa-trash"></i></button></form>
            </div>
        </div>`).join("");

    res.send(layout("Spisak Đaka", `
        <button onclick="pickRandom()" class="btn btn-random"><i class="fas fa-dice"></i> NASUMIČAN ODABIR UČENIKA</button>
        <div class="card"><form method="POST" action="/students/add" style="display:flex; gap:10px; margin:0;">
            <input name="name" placeholder="Ime i prezime..." required style="margin:0;"><button class="btn btn-primary">DODAJ</button>
        </form></div>
        ${sHtml}
        <script>
            function pickRandom() {
                const profiles = Array.from(document.querySelectorAll('a.btn-primary')).map(a => a.href);
                if (profiles.length > 0) {
                    const random = profiles[Math.floor(Math.random() * profiles.length)];
                    window.location.href = random;
                } else { alert("Nema unetih đaka!"); }
            }
        </script>
    `));
});

// --- PROFIL ĐAKA (SVE FUNKCIJE) ---
app.get("/student/:id", (req, res) => {
    const db = load();
    const s = db.students.find(x => x.id == req.params.id);
    if (!s) return res.redirect("/students");

    const absenceHtml = s.absences.map((a, i) => `
        <div class="card item-absence">
            <div style="display:flex; justify-content:space-between;">
                <div><b style="color:#f59e0b;">${a.status.toUpperCase()}</b><br><b>${a.subject}</b>: ${a.topic}<br><small>${a.date} ${a.note ? '| ' + a.note : ''}</small></div>
                <form method="POST" action="/student/${s.id}/edit-absence/${i}" style="display:flex; gap:5px;">
                    <select name="status" style="width:110px; margin:0; padding:5px;"><option value="neregulisan">Neregulisan</option><option value="opravdan">Opravdan</option><option value="neopravdan">Neopravdan</option></select>
                    <button class="btn btn-primary" style="padding:5px 10px;">OK</button>
                </form>
            </div>
        </div>`).join("");

    const otherHtml = ['grades', 'activity', 'behavior'].map(type => 
        s[type].map((item, i) => `
            <div class="card item-${type.replace('s', '')}" style="display:flex; justify-content:space-between;">
                <div><b>${item.value}</b> | ${item.note}</div>
                <form method="POST" action="/student/${s.id}/delete-item/${type}/${i}" style="margin:0;"><button class="btn btn-danger" style="padding:5px 10px;"><i class="fas fa-trash"></i></button></form>
            </div>`).join("")
    ).join("");

    res.send(layout(s.name, `
        <div style="display:grid; grid-template-columns:350px 1fr; gap:30px;">
            <div>
                <div class="card" style="background:#2563eb; color:white; text-align:center;">
                    <small>IZOSTANCI</small><h1 style="font-size:48px; margin:10px 0;">${s.absences.length}</h1>
                </div>
                <form method="POST" action="/student/${s.id}/add" class="card">
                    <h4>Novi unos</h4>
                    <select name="type"><option value="grades">Ocena</option><option value="activity">Aktivnost</option><option value="behavior">Vladanje</option></select>
                    <input name="value" placeholder="Vrednost" required><input name="note" placeholder="Napomena" required>
                    <button class="btn btn-primary" style="width:100%; justify-content:center;">SAČUVAJ</button>
                </form>
            </div>
            <div>
                <h3>Hronologija</h3>
                ${absenceHtml} ${otherHtml || '<p>Nema zapisa.</p>'}
            </div>
        </div>`));
});

// --- LOGIKA ZA ČASOVE ---
app.get("/dashboard", (req, res) => {
    const db = load();
    const html = db.lessons.map(l => `
        <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
            <div><b>${l.subject}</b> (${l.period}. čas)<br><small>${l.topic}</small></div>
            <form method="POST" action="/lesson/delete/${l.id}" style="margin:0;"><button class="btn btn-danger">Obriši i izostanke</button></form>
        </div>`).join("");
    res.send(layout("Dashboard", html || "Nema časova."));
});

app.get("/lesson/new", (req, res) => {
    const db = load();
    const boxes = db.students.map(s => `<div style="padding:5px;"><input type="checkbox" name="absent_ids" value="${s.id}"> ${s.name}</div>`).join("");
    res.send(layout("Novi Čas", `
        <form method="POST" action="/lesson/save" class="card" style="max-width:500px;">
            <input name="subject" placeholder="Predmet" required><input name="topic" placeholder="Jedinica" required>
            <input name="period" type="number" value="1" placeholder="Čas br.">
            <h4 style="color:red;">Ko fali?</h4><div style="display:grid; grid-template-columns:1fr 1fr;">${boxes}</div>
            <button class="btn btn-primary" style="width:100%; margin-top:20px; justify-content:center;">ZAVEDI ČAS</button>
        </form>`));
});

app.post("/lesson/save", (req, res) => {
    let db = load(); const lid = Date.now();
    const { subject, topic, period, absent_ids } = req.body;
    db.lessons.unshift({ id: lid, subject, topic, period });
    if (absent_ids) {
        const ids = Array.isArray(absent_ids) ? absent_ids : [absent_ids];
        db.students.forEach(s => {
            if (ids.includes(s.id.toString())) s.absences.push({ lessonId: lid, subject, topic, status: "neregulisan", date: new Date().toLocaleDateString() });
        });
    }
    save(db); res.redirect("/dashboard");
});

app.post("/lesson/delete/:id", (req, res) => {
    let db = load(); const lid = req.params.id;
    db.lessons = db.lessons.filter(l => l.id != lid);
    db.students.forEach(s => { s.absences = s.absences.filter(a => a.lessonId != lid); });
    save(db); res.redirect("/dashboard");
});

// --- POMOĆNE RUTE ---
app.post("/students/add", (req, res) => {
    let db = load(); db.students.push({ id: Date.now(), name: req.body.name, grades: [], activity: [], behavior: [], absences: [] });
    save(db); res.redirect("/students");
});

app.post("/student/:id/add", (req, res) => {
    let db = load(); const s = db.students.find(x => x.id == req.params.id);
    s[req.body.type].push({ value: req.body.value, note: req.body.note });
    save(db); res.redirect("/student/" + req.params.id);
});

app.post("/student/:id/delete-item/:type/:i", (req, res) => {
    let db = load(); const s = db.students.find(x => x.id == req.params.id);
    s[req.params.type].splice(req.params.i, 1);
    save(db); res.redirect("/student/" + req.params.id);
});

app.post("/student/:id/edit-absence/:i", (req, res) => {
    let db = load(); const s = db.students.find(x => x.id == req.params.id);
    if(s.absences[req.params.i]) s.absences[req.params.i].status = req.body.status;
    save(db); res.redirect("/student/" + req.params.id);
});

app.post("/student/delete/:id", (req, res) => {
    let db = load(); db.students = db.students.filter(s => s.id != req.params.id);
    save(db); res.redirect("/students");
});

app.listen(5000, () => console.log("Server: http://localhost:5000"));
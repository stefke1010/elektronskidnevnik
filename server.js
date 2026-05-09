const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.urlencoded({ extended: true }));

const DB = "./db.json";
const sessions = new Set();

const load = () => JSON.parse(fs.readFileSync(DB));
const save = (d) => fs.writeFileSync(DB, JSON.stringify(d, null, 2));

/* --- AUTHENTICATION --- */
function auth(req, res, next) {
    if (req.path === "/login") return next();
    if (!sessions.has("admin")) return res.redirect("/login");
    next();
}
app.use(auth);

/* --- TVOJ ORIGINALNI LOGIN SKRIN --- */
app.get("/login", (req, res) => {
    res.send(`
        <html lang="sr">
        <head>
            <meta charset="UTF-8">
            <style>
                body { 
                    display: flex; justify-content: center; align-items: center; height: 100vh; 
                    background-size: cover; background-position: center; background-repeat: no-repeat;
                    font-family: Arial; margin: 0; background-color: #1e3c72;
                }
                body::before {
                    content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0, 0, 0, 0.4); z-index: 1;
                }
                .box { 
                    position: relative; z-index: 2; background: rgba(255, 255, 255, 0.95); 
                    padding: 30px; border-radius: 12px; width: 320px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                }
                h2 { text-align: center; color: #1e3c72; margin-bottom: 20px; }
                input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; }
                button { width: 100%; padding: 12px; border: none; border-radius: 6px; background: #1e3c72; color: white; cursor: pointer; font-weight: bold; transition: 0.3s; }
                button:hover { background: #2a5298; }
            </style>
        </head>
        <body>
            <div class="box">
                <h2>Пријава</h2>
                <form method="POST">
                    <input name="user" placeholder="Корисничко име" required>
                    <input name="pass" type="password" placeholder="Лозинка" required>
                    <button type="submit">Пријави се</button>
                </form>
            </div>
            <script>
                window.onload = function() {
                    const randomId = Math.floor(Math.random() * 1000);
                    document.body.style.backgroundImage = "url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1920&sig=" + randomId + "')";
                };
            </script>
        </body>
        </html>
    `);
});

app.post("/login", (req, res) => {
    if (req.body.user === "stefanmihajlovic" && req.body.pass === "stefanmihajloviccc") {
        sessions.add("admin");
        return res.redirect("/dashboard");
    }
    res.send("Погрешни подаци");
});

app.get("/logout", (req, res) => { sessions.clear(); res.redirect("/login"); });

/* --- LAYOUT SISTEMA --- */
const layout = (title, content) => `
    <html lang="sr"><head><meta charset="UTF-8">
    <style>
        body { margin: 0; font-family: Arial; display: flex; background: #f4f7fb; }
        .sidebar { width: 240px; background: #1a237e; color: white; min-height: 100vh; padding: 25px; box-sizing: border-box; position: fixed; }
        .sidebar a { display: block; color: white; text-decoration: none; margin: 15px 0; padding: 10px; border-radius: 5px; }
        .sidebar a:hover { background: rgba(255,255,255,0.1); }
        .main { flex: 1; margin-left: 240px; padding: 30px; }
        .card { background: white; padding: 20px; border-radius: 12px; margin: 15px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        input, select { padding: 10px; margin: 5px 0; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box; }
        button { padding: 10px 18px; border: none; border-radius: 6px; cursor: pointer; background: #1a237e; color: white; font-weight: bold; }
        .danger { background: #c0392b; }
        .edit { background: #f39c12; }
    </style>
    <title>${title}</title></head>
    <body>
        <div class="sidebar"><h2>Е-Дневник</h2><a href="/dashboard">🏠 Почетна</a><a href="/students">👥 Ученици</a><a href="/lesson/new">➕ Нови час</a><a href="/logout">🚪 Одјава</a></div>
        <div class="main">${content}</div>
    </body></html>`;

/* --- DASHBOARD --- */
app.get("/dashboard", (req, res) => {
    const db = load();
    const html = db.lessons.map(l => `
        <div class="card">
            <b>${l.subject}</b> - ${l.topic} <br> <small>${l.teacher} | Час: ${l.period}</small>
            <form method="POST" action="/lesson/delete/${l.id}" style="margin-top:10px;">
                <button class="danger">Обриши час и изостанке</button>
            </form>
        </div>`).join("");
    res.send(layout("Почетна", `<h2>Листа одржаних часова</h2>${html}`));
});

app.post("/lesson/delete/:id", (req, res) => {
    let db = load();
    db.lessons = db.lessons.filter(l => l.id != req.params.id);
    db.students.forEach(s => { s.absences = s.absences.filter(a => a.lessonId != req.params.id); });
    save(db); res.redirect("/dashboard");
});

/* --- STUDENTI I PROFIL --- */
app.get("/students", (req, res) => {
    const db = load();
    const sHtml = db.students.map(s => `<div class="card"><a href="/student/${s.id}">👤 ${s.name}</a> <form method="POST" action="/student/delete/${s.id}" style="display:inline; float:right;"><button class="danger" style="padding:2px 10px;">X</button></form></div>`).join("");
    res.send(layout("Ученици", `<div class="card"><h3>Додај ученика</h3><form method="POST" action="/students/add"><input name="name" placeholder="Име и презиме" required><button>Додај</button></form></div>${sHtml}`));
});

app.post("/students/add", (req, res) => {
    let db = load(); db.students.push({ id: Date.now(), name: req.body.name, grades: [], activity: [], behavior: [], absences: [], finalGrade: "" });
    save(db); res.redirect("/students");
});

app.post("/student/delete/:id", (req, res) => {
    let db = load(); db.students = db.students.filter(s => s.id != req.params.id);
    save(db); res.redirect("/students");
});

app.get("/student/:id", (req, res) => {
    const db = load();
    const s = db.students.find(x => x.id == req.params.id);
    if (!s) return res.send("Ученик није пронађен");

    let avg = s.grades.length > 0 ? (s.grades.reduce((a, b) => a + Number(b.value), 0) / s.grades.length).toFixed(2) : "0.00";

    res.send(layout(s.name, `
        <h2>Ученик: ${s.name}</h2>
        <div class="card" style="background:#1a237e; color:white;">
            <h3>Просек: ${avg} | Закључно: ${s.finalGrade || "/"}</h3>
        </div>
        
        <div class="card">
            <h3>Унос података</h3>
            <form method="POST" action="/student/${s.id}/add">
                <select name="type"><option value="grades">Оцена</option><option value="activity">Активност</option><option value="behavior">Владање</option></select>
                <input name="value" placeholder="Вредност" required>
                <input name="note" placeholder="Белешка" required>
                <button>Сачувај</button>
            </form>
            <hr>
            <form method="POST" action="/student/${s.id}/final">
                <input name="finalGrade" type="number" min="1" max="5" placeholder="Закључи оцену">
                <button class="edit">Закључи</button>
            </form>
        </div>

        <h3>Изостанци</h3>
        ${s.absences.map((a, i) => `
            <div class="card" style="border-left: 5px solid red;">
                <b>${a.subject}</b> - ${a.status} <br> <i>${a.note}</i>
                <form method="POST" action="/student/${s.id}/abs-edit/${i}" style="margin-top:5px;">
                    <select name="status"><option value="оправдан">оправдан</option><option value="неоправдан">неоправдан</option><option value="нерегулисан">нерегулисан</option></select>
                    <input name="note" placeholder="Нова белешка" required>
                    <button class="edit" style="padding:5px 10px;">Измени</button>
                </form>
                <form method="POST" action="/student/${s.id}/delete-item/absences/${i}" style="margin-top:5px;">
                    <button class="danger" style="padding:2px 10px; font-size:11px;">Обриши изостанак</button>
                </form>
            </div>`).join("")}

        <h3>Дневник рада</h3>
        ${['grades', 'activity', 'behavior'].map(type => 
            s[type].map((item, i) => `
            <div class="card">
                <b>${type === 'grades' ? 'Оцена' : type === 'activity' ? 'Активност' : 'Владање'}:</b> ${item.value} — ${item.note}
                <form method="POST" action="/student/${s.id}/delete-item/${type}/${i}" style="float:right;">
                    <button class="danger">X</button>
                </form>
            </div>`).join("")
        ).join("")}
    `));
});

/* --- OPERACIJE --- */
app.post("/student/:id/add", (req, res) => {
    let db = load(); const s = db.students.find(x => x.id == req.params.id);
    s[req.body.type].push({ value: req.body.value, note: req.body.note });
    save(db); res.redirect("/student/" + req.params.id);
});

app.post("/student/:id/delete-item/:type/:index", (req, res) => {
    let db = load(); const s = db.students.find(x => x.id == req.params.id);
    s[req.params.type].splice(req.params.index, 1);
    save(db); res.redirect("/student/" + req.params.id);
});

app.post("/student/:id/abs-edit/:index", (req, res) => {
    let db = load(); const s = db.students.find(x => x.id == req.params.id);
    s.absences[req.params.index].status = req.body.status;
    s.absences[req.params.index].note = req.body.note;
    save(db); res.redirect("/student/" + req.params.id);
});

app.post("/student/:id/final", (req, res) => {
    let db = load(); const s = db.students.find(x => x.id == req.params.id);
    s.finalGrade = req.body.finalGrade;
    save(db); res.redirect("/student/" + req.params.id);
});

/* --- UPIS ČASA --- */
app.get("/lesson/new", (req, res) => {
    res.send(layout("Нови час", `<div class="card"><h3>Подаци о часу</h3><form method="POST" action="/lesson/attendance"><input name="subject" placeholder="Предмет" required><input name="topic" placeholder="Тема" required><input name="teacher" placeholder="Наставник" required><input name="period" type="number" placeholder="Час" required><button>Даље</button></form></div>`));
});

app.post("/lesson/attendance", (req, res) => {
    const db = load(); const ld = req.body;
    const sHtml = db.students.map(s => `<div><input type="checkbox" name="absent" value="${s.id}"> ${s.name}</div>`).join("");
    res.send(layout("Одсутни", `<div class="card"><h3>Обележи ко није ту:</h3><form method="POST" action="/lesson/save"><input type="hidden" name="subject" value="${ld.subject}"><input type="hidden" name="topic" value="${ld.topic}"><input type="hidden" name="teacher" value="${ld.teacher}"><input type="hidden" name="period" value="${ld.period}">${sHtml}<br><button class="danger">Упиши час</button></form></div>`));
});

app.post("/lesson/save", (req, res) => {
    let db = load(); const lessonId = Date.now();
    const { subject, topic, teacher, period, absent } = req.body;
    db.lessons.push({ id: lessonId, subject, topic, teacher, period });
    const aIds = Array.isArray(absent) ? absent : (absent ? [absent] : []);
    aIds.forEach(id => {
        const s = db.students.find(x => x.id == id);
        if (s) s.absences.push({ lessonId, subject, topic, period, status: "нерегулисан", note: "Одсутан" });
    });
    save(db); res.redirect("/dashboard");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server radi na portu ${PORT}`));
const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

const DB = "./db.json";
let sessions = new Set(); 

const load = () => {
    if (!fs.existsSync(DB)) {
        fs.writeFileSync(DB, JSON.stringify({ 
            lessons: [], students: [], 
            config: { adminUser: "stefanmihajlovic", adminPass: "stefanmihajloviccc" } 
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

function auth(req, res, next) {
    if (["/login"].includes(req.path) || req.path.endsWith(".jpg") || req.path.endsWith(".png")) return next();
    if (!sessions.has("admin")) return res.redirect("/login");
    next();
}
app.use(auth);

// ПОПРАВЉЕНА ФУНКЦИЈА ЗА ПРОСЕК
const getAverage = (grades) => {
    if (!grades || grades.length === 0) return 0;
    const sum = grades.reduce((a, b) => a + parseFloat(b.value), 0);
    return (sum / grades.length).toFixed(2);
};

/* --- LAYOUT --- */
const layout = (title, content) => `
    <html lang="sr"><head><meta charset="UTF-8">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root { --blue: #00a3e0; --orange: #f59e0b; --red: #ef4444; --green: #10b981; --sidebar: #1e1b4b; }
        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; display: flex; min-height: 100vh; background: #f3f4f6; }
        .sidebar { width: 280px; height: 100vh; background: var(--sidebar); padding: 40px 20px; position: fixed; color: white; display: flex; flex-direction: column; z-index: 100; }
        .sidebar h2 { font-weight: 800; text-align: center; margin-bottom: 40px; color: #3b82f6; }
        .sidebar a { display: flex; align-items: center; gap: 12px; color: rgba(255,255,255,0.6); text-decoration: none; padding: 14px 18px; border-radius: 12px; transition: 0.3s; margin-bottom: 5px; }
        .sidebar a:hover { background: rgba(255,255,255,0.1); color: white; }
        .logout { margin-top: auto; color: #fca5a5 !important; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px !important; }
        .main-wrapper { flex: 1; margin-left: 280px; position: relative; min-height: 100vh; padding: 50px 70px; background: url('/primer pozadine.jpg') repeat; background-size: 400px; background-attachment: fixed; }
        .card { background: rgba(255, 255, 255, 0.95); border-radius: 14px; padding: 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; border-left: 6px solid transparent; }
        .card-blue { border-left-color: var(--blue); } .card-green { border-left-color: var(--green); } .card-red { border-left-color: var(--red); } .card-orange { border-left-color: var(--orange); }
        .btn { padding: 10px 18px; border-radius: 10px; border: none; cursor: pointer; font-weight: 700; transition: 0.2s; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; font-size: 13px; }
        .btn-p { background: #4f46e5; color: white; } .btn-red { background: #fee2e2; color: #ef4444; } .btn-random { background: #f59e0b; color: white; } .btn-edit { background: #e2e8f0; color: #475569; }
        input, select, textarea { padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0; width: 100%; margin-bottom: 12px; background: #f8fafc; font-family: inherit; }
    </style></head>
    <body>
        <div class="sidebar">
            <h2>Е-ДНЕВНИК</h2>
            <a href="/dashboard"><i class="fas fa-chart-line"></i> Дашборд</a>
            <a href="/students"><i class="fas fa-users"></i> Списак ученика</a>
            <a href="/lesson/new"><i class="fas fa-pen-nib"></i> Нови час</a>
            <a href="/logout" class="logout"><i class="fas fa-sign-out-alt"></i> Одјави се</a>
        </div>
        <div class="main-wrapper"><h1>${title}</h1>${content}</div>
    </body></html>`;

/* --- DASHBOARD СА ПОПРАВЉЕНОМ СТАТИСТИКОМ --- */
app.get("/dashboard", (req, res) => {
    const db = load();
    const students = db.students;
    
    let statsHtml = "";
    if (students.length > 0) {
        // Фитрирамо само оне који заиста имају оцене за просек
        const studentsWithGrades = students.filter(s => s.grades.length > 0);
        let topStudentText = "Нема оцена";
        let topAvg = "0.00";

        if (studentsWithGrades.length > 0) {
            const sortedByAvg = [...studentsWithGrades].sort((a,b) => getAverage(b.grades) - getAverage(a.grades));
            topStudentText = sortedByAvg[0].name;
            topAvg = getAverage(sortedByAvg[0].grades);
        }

        const maxAbs = Math.max(...students.map(s => s.absences.length));
        const hasAbs = maxAbs > 0;
        const studentsWithMaxAbs = students.filter(s => s.absences.length === maxAbs);
        
        let absName = hasAbs ? (studentsWithMaxAbs.length === students.length ? "Сви исто" : studentsWithMaxAbs[0].name) : "Сви редовни";

        statsHtml = `
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:20px; margin-bottom:40px;">
                <div class="card" style="border:none; flex-direction:column; align-items:start;">
                    <small>Најбољи просек</small>
                    <h3 style="margin:5px 0;">${topStudentText}</h3>
                    <span style="background:#dcfce7; color:#166534; padding:5px 12px; border-radius:20px; font-size:12px; font-weight:800;">${topAvg}</span>
                </div>
                <div class="card" style="border:none; flex-direction:column; align-items:start;">
                    <small>Највише изостанака</small>
                    <h3 style="margin:5px 0;">${absName}</h3>
                    <span style="background:#fee2e2; color:#991b1b; padding:5px 12px; border-radius:20px; font-size:12px; font-weight:800;">${maxAbs}</span>
                </div>
                <div class="card" style="border:none; flex-direction:column; align-items:start;">
                    <small>Укупно ученика</small>
                    <h2 style="margin:5px 0;">${students.length}</h2>
                </div>
            </div>`;
    }

    const lessons = db.lessons.reverse().map(l => `
        <div class="card card-blue">
            <div><small>${l.date}</small><h3>${l.subject} (${l.period}. час)</h3><p>${l.topic}</p></div>
            <form method="POST" action="/lesson/delete/${l.id}"><button class="btn btn-red"><i class="fas fa-trash"></i></button></form>
        </div>`).join("");

    res.send(layout("Командна табла", statsHtml + "<h3>Последњи часови</h3>" + (lessons || "<p>Нема часова.</p>")));
});

/* --- СТУДЕНТ ПРОФИЛ СА ИСПРАВЉАЊЕМ И БРИСАЊЕМ --- */
app.get("/student/:id", (req, res) => {
    const db = load();
    const s = db.students.find(x => x.id == req.params.id);
    if(!s) return res.redirect("/students");

    const history = [
        ...s.grades.map((i, idx) => ({...i, type: 'grades', idx, style: 'card-blue', label: 'Оцена'})),
        ...s.activity.map((i, idx) => ({...i, type: 'activity', idx, style: 'card-green', label: 'Активност'})),
        ...s.behavior.map((i, idx) => ({...i, type: 'behavior', idx, style: 'card-orange', label: 'Владање на часу'})),
        ...s.absences.map((i, idx) => ({...i, type: 'absences', idx, style: i.status === 'Оправдан' ? 'card-green' : i.status === 'Неоправдан' ? 'card-red' : 'card-orange', label: i.status + ' изостанак', isAbs: true}))
    ].sort((a,b) => new Date(b.date) - new Date(a.date));

    let html = `
    <div style="display:grid; grid-template-columns: 380px 1fr; gap:40px; align-items: start;">
        <div>
            <div class="card" style="flex-direction:column; border:none; position:sticky; top:20px;">
                <h3 id="formTitle">Нови унос</h3>
                <form id="mainForm" method="POST" action="/student/${s.id}/add" style="width:100%">
                    <input type="hidden" name="edit_idx" id="editIdx">
                    <select name="type" id="formType"><option value="grades">Оцена</option><option value="activity">Активност</option><option value="behavior">Владање</option></select>
                    <input name="subject" id="formSub" placeholder="Предмет" required>
                    <input name="value" id="formVal" placeholder="Вредност" required>
                    <textarea name="note" id="formNote" placeholder="Белешка"></textarea>
                    <button class="btn btn-p" id="formBtn" style="width:100%; justify-content:center">САЧУВАЈ</button>
                    <button type="button" onclick="resetForm()" id="cancelBtn" class="btn btn-edit" style="width:100%; margin-top:10px; display:none;">ПОНИШТИ</button>
                </form>
            </div>
        </div>
        <div>`;

    history.forEach(i => {
        html += `
        <div class="card ${i.style}">
            <div style="flex:1">
                <small style="color:#94a3b8">${i.label} | ${i.date}</small>
                <h3 style="margin:5px 0">${i.subject || 'Напомена'}</h3>
                <p style="margin:0">${i.note || ''}</p>
            </div>
            <div style="display:flex; align-items:center; gap:20px;">
                <div style="font-size:24px; font-weight:800;">${i.isAbs ? '' : i.value}</div>
                <div style="display:flex; gap:5px;">
                    <button onclick="editItem('${i.type}', ${i.idx}, '${i.subject}', '${i.value}', '${i.note}')" class="btn btn-edit" style="padding:8px;"><i class="fas fa-edit"></i></button>
                    <form method="POST" action="/student/${s.id}/delete-item/${i.type}/${i.idx}" style="margin:0">
                        <button class="btn btn-red" style="padding:8px;"><i class="fas fa-trash"></i></button>
                    </form>
                </div>
            </div>
        </div>`;
    });

    html += `</div></div>
    <script>
        function editItem(type, idx, sub, val, note) {
            document.getElementById('formTitle').innerText = "Исправи унос";
            document.getElementById('formType').value = type;
            document.getElementById('formSub').value = sub;
            document.getElementById('formVal').value = val;
            document.getElementById('formNote').value = note;
            document.getElementById('editIdx').value = idx;
            document.getElementById('mainForm').action = "/student/${s.id}/edit-item";
            document.getElementById('formBtn').innerText = "АЖУРИРАЈ";
            document.getElementById('cancelBtn').style.display = "block";
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        function resetForm() {
            document.getElementById('formTitle').innerText = "Нови унос";
            document.getElementById('mainForm').action = "/student/${s.id}/add";
            document.getElementById('formBtn').innerText = "САЧУВАЈ";
            document.getElementById('cancelBtn').style.display = "none";
            document.getElementById('mainForm').reset();
        }
    </script>`;
    res.send(layout(s.name, html));
});

/* --- API ЛОГИКА --- */
app.post("/student/:id/edit-item", (req, res) => {
    let db = load(); const s = db.students.find(x => x.id == req.params.id);
    const { type, edit_idx, subject, value, note } = req.body;
    if(s[type][edit_idx]) {
        s[type][edit_idx] = { ...s[type][edit_idx], subject, value, note };
    }
    save(db); res.redirect("/student/" + req.params.id);
});

// Све остале руте (students, add, delete, lesson) остају као пре...
app.get("/students", (req, res) => {
    const db = load();
    const list = db.students.map(s => `<div class="card card-blue student-item" data-name="${s.name.toLowerCase()}" data-id="${s.id}"><div><h3>${s.name}</h3><small>Просек: <b>${getAverage(s.grades)}</b></small></div><a href="/student/${s.id}" class="btn btn-p">ПРОФИЛ</a></div>`).join("");
    res.send(layout("Ученици", `<div style="display:flex; gap:10px; margin-bottom:20px;"><input id="search" placeholder="Претражи..." style="margin:0; flex:1;"><button onclick="pickRandom()" class="btn btn-random">СЛУЧАЈАН ОДАБИР</button></div>${list}
    <script>
        document.getElementById('search').addEventListener('input', e => {
            let v = e.target.value.toLowerCase();
            document.querySelectorAll('.student-item').forEach(i => i.style.display = i.getAttribute('data-name').includes(v) ? 'flex' : 'none');
        });
        function pickRandom() {
            const items = Array.from(document.querySelectorAll('.student-item')).filter(i => i.style.display !== 'none');
            if(items.length) window.location.href = '/student/' + items[Math.floor(Math.random()*items.length)].getAttribute('data-id');
        }
    </script>`));
});

app.post("/student/:id/add", (req, res) => {
    let db = load(); const s = db.students.find(x => x.id == req.params.id);
    s[req.body.type].push({ subject: req.body.subject, value: req.body.value, note: req.body.note, date: new Date().toLocaleDateString('sr-RS') });
    save(db); res.redirect("/student/" + req.params.id);
});

app.post("/student/:id/delete-item/:type/:idx", (req, res) => {
    let db = load(); const s = db.students.find(x => x.id == req.params.id);
    s[req.params.type].splice(req.params.idx, 1);
    save(db); res.redirect("/student/" + req.params.id);
});

app.post("/lesson/save", (req, res) => {
    let db = load(); const lid = Date.now();
    const lesson = { id: lid, subject: req.body.subject, topic: req.body.topic, period: req.body.period, date: new Date().toLocaleDateString('sr-RS') };
    db.lessons.push(lesson);
    if(req.body.absent_ids) {
        const ids = Array.isArray(req.body.absent_ids) ? req.body.absent_ids : [req.body.absent_ids];
        db.students.forEach(s => { if(ids.includes(s.id.toString())) s.absences.push({ lessonId: lid, subject: lesson.subject, topic: lesson.topic, date: lesson.date, status: "Нерегулисан" }); });
    }
    save(db); res.redirect("/dashboard");
});

app.post("/students/add", (req, res) => {
    let db = load(); db.students.push({ id: Date.now(), name: req.body.name, grades: [], activity: [], behavior: [], absences: [] });
    save(db); res.redirect("/students");
});

app.post("/lesson/delete/:id", (req, res) => {
    let db = load(); db.lessons = db.lessons.filter(l => l.id != req.params.id);
    db.students.forEach(s => s.absences = s.absences.filter(a => a.lessonId != req.params.id));
    save(db); res.redirect("/dashboard");
});

app.get("/login", (req, res) => {
    res.send(`<html><body style="margin:0; display:flex; align-items:center; justify-content:center; height:100vh; background:url('/pozadina dnevnik.jpg') center/cover; font-family:sans-serif;">
        <div style="background:rgba(255,255,255,0.95); padding:50px; border-radius:30px; width:350px; text-align:center; box-shadow:0 20px 50px rgba(0,0,0,0.3);">
            <h2>Пријава</h2><form method="POST"><input name="user" placeholder="Корисник" style="width:100%; padding:15px; margin:10px 0; border-radius:10px; border:1px solid #ddd;"><input name="pass" type="password" placeholder="Лозинка" style="width:100%; padding:15px; margin:10px 0; border-radius:10px; border:1px solid #ddd;"><button style="width:100%; padding:15px; border:none; background:#1e1b4b; color:white; font-weight:bold; border-radius:10px; cursor:pointer;">ПРИСТУП</button></form>
        </div></body></html>`);
});

app.post("/login", (req, res) => {
    const db = load();
    if (req.body.user === db.config.adminUser && req.body.pass === db.config.adminPass) { sessions.add("admin"); return res.redirect("/dashboard"); }
    res.send("<script>alert('Грешка!'); window.location='/login';</script>");
});

app.get("/lesson/new", (req, res) => {
    const db = load();
    const list = db.students.map(s => `<label style="display:block; padding:10px; border-bottom:1px solid #eee"><input type="checkbox" name="absent_ids" value="${s.id}"> ${s.name}</label>`).join("");
    res.send(layout("Нови час", `<form method="POST" action="/lesson/save" class="card" style="flex-direction:column; border-left:none;"><input name="subject" placeholder="Предмет" required><input name="topic" placeholder="Јединица" required><input name="period" type="number" placeholder="Број часа" required><h4>Фале:</h4><div style="width:100%">${list}</div><button class="btn btn-p" style="width:100%; margin-top:20px; justify-content:center">УПИШИ</button></form>`));
});

app.get("/logout", (req, res) => { sessions.delete("admin"); res.redirect("/login"); });
app.get("/", (req, res) => res.redirect("/dashboard"));

app.listen(5000, () => console.log("http://localhost:5000"));

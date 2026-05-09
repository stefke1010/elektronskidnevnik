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
    return JSON.parse(fs.readFileSync(DB));
};
const save = (d) => fs.writeFileSync(DB, JSON.stringify(d, null, 2));

function auth(req, res, next) {
    if (["/login"].includes(req.path) || req.path.endsWith(".jpg")) return next();
    if (!sessions.has("admin")) return res.redirect("/login");
    next();
}
app.use(auth);

/* --- УЛТРА ДИЗАЈН СА ВЕРТИКАЛНИМ ЛИНИЈАМА --- */
const layout = (title, content) => `
    <html lang="sr"><head><meta charset="UTF-8">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;500;700;800&display=swap" rel="stylesheet">
    <style>
        :root { --accent: #6366f1; --sidebar: #0f172a; --bg: #f8fafc; --danger: #ef4444; }
        body { margin: 0; font-family: 'Manrope', sans-serif; background: var(--bg); display: flex; color: #1e293b; }
        .sidebar { width: 280px; height: 100vh; background: var(--sidebar); padding: 40px 20px; position: fixed; display: flex; flex-direction: column; }
        .sidebar h2 { color: white; font-weight: 800; font-size: 22px; margin-bottom: 40px; display: flex; align-items: center; gap: 10px; }
        .sidebar a { display: flex; align-items: center; gap: 12px; color: #94a3b8; text-decoration: none; padding: 14px 18px; border-radius: 12px; transition: 0.3s; margin-bottom: 8px; font-weight: 500; }
        .sidebar a:hover { background: rgba(255,255,255,0.1); color: white; }
        .main { flex: 1; margin-left: 280px; padding: 60px 80px; }
        
        .card { background: white; border-radius: 24px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; margin-bottom: 24px; position: relative; }
        
        /* СТИЛ ЗА СТАВКЕ СА ЛИНИЈОМ СА ЛЕВЕ СТРАНЕ */
        .entry-item { 
            padding: 15px 20px; 
            margin-bottom: 12px; 
            background: #ffffff; 
            border-radius: 12px; 
            border: 1px solid #f1f5f9;
            border-left: 5px solid #cbd5e1; /* Основна боја линије */
            transition: 0.2s;
        }
        .line-grade { border-left-color: #6366f1; }   /* Плава за оцене */
        .line-plus { border-left-color: #22c55e; }    /* Зелена за плус */
        .line-minus { border-left-color: #f43f5e; }   /* Црвена за минус */
        .line-behavior { border-left-color: #f59e0b; } /* Наранџаста за владање */
        .line-absent { border-left-color: #94a3b8; }   /* Сива за изостанке */

        .warning-banner { background: #fff1f2; border-left: 6px solid #f43f5e; padding: 20px; border-radius: 16px; margin-bottom: 30px; color: #9f1239; font-weight: 700; display: flex; align-items: center; gap: 15px; }
        .btn { padding: 10px 18px; border-radius: 10px; border: none; cursor: pointer; font-weight: 700; transition: 0.2s; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; text-decoration: none; }
        .btn-primary { background: var(--accent); color: white; }
        .btn-outline { background: #f1f5f9; color: #475569; }
        .btn-danger { background: #fee2e2; color: #ef4444; }
        
        input, select, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 10px; font-family: inherit; }
        .action-btns { display: flex; gap: 8px; margin-top: 10px; }
    </style></head>
    <body>
        <div class="sidebar">
            <h2><i class="fas fa-layer-group"></i> Е-ДНЕВНИК</h2>
            <a href="/dashboard"><i class="fas fa-home"></i> Командна табла</a>
            <a href="/students"><i class="fas fa-user-graduate"></i> Списак ученика</a>
            <a href="/lesson/new"><i class="fas fa-pen-nib"></i> Упиши час</a>
            <div style="margin-top:auto"><a href="/logout" style="color:#fb7185"><i class="fas fa-sign-out-alt"></i> Одјава</a></div>
        </div>
        <div class="main"><h1>${title}</h1>${content}</div>
    </body></html>`;

/* --- LOGIN --- (Стандардна пријава) */
app.get("/login", (req, res) => {
    res.send(`<html lang="sr"><head><meta charset="UTF-8"><style>body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:url('pozadina dnevnik.jpg') center/cover;font-family:sans-serif;}.box{background:rgba(255,255,255,0.9);padding:50px;border-radius:30px;width:350px;text-align:center;backdrop-filter:blur(5px);}input{width:100%;padding:15px;margin:10px 0;border-radius:10px;border:1px solid #ddd;box-sizing:border-box;}button{width:100%;padding:15px;border:none;border-radius:10px;background:#6366f1;color:white;font-weight:800;cursor:pointer;}</style></head><body><div class="box"><h2>Пријава</h2><form method="POST"><input name="user" placeholder="Корисник"><input name="pass" type="password" placeholder="Лозинка"><button>УЂИ</button></form></div></body></html>`);
});

app.post("/login", (req, res) => {
    const db = load();
    if (req.body.user === db.config.adminUser && req.body.pass === db.config.adminPass) { sessions.add("admin"); return res.redirect("/dashboard"); }
    res.send("<script>alert('Грешка!'); window.location='/login';</script>");
});

/* --- DASHBOARD --- */
app.get("/dashboard", (req, res) => {
    const db = load();
    const html = db.lessons.reverse().map(l => `
        <div class="card" style="display:flex; justify-content:space-between; align-items:center">
            <div><span style="background:#eef2ff; color:#6366f1; padding:4px 10px; border-radius:8px; font-weight:800; font-size:12px">${l.period}. ЧАС</span><h3 style="margin:10px 0 5px 0">${l.subject}</h3><p style="margin:0; color:#64748b">${l.topic}</p></div>
            <form method="POST" action="/lesson/delete/${l.id}"><button class="btn btn-danger"><i class="fas fa-trash"></i></button></form>
        </div>`).join("");
    res.send(layout("Преглед часова", html || "<p>Дневник је празан.</p>"));
});

/* --- STUDENTS LIST --- */
app.get("/students", (req, res) => {
    const db = load();
    const list = db.students.map(s => `
        <div class="card" style="display:flex; justify-content:space-between; align-items:center">
            <h3 style="margin:0">${s.name}</h3>
            <div style="display:flex; gap:10px">
                <a href="/student/${s.id}" class="btn btn-primary">ОТВОРИ КАРТОН</a>
                <form method="POST" action="/student/delete/${s.id}" style="margin:0" onsubmit="return confirm('Обрисати ученика?')"><button class="btn btn-danger"><i class="fas fa-user-minus"></i></button></form>
            </div>
        </div>`).join("");
    res.send(layout("Списак ученика", `<div class="card"><form method="POST" action="/students/add" style="display:flex; gap:10px; margin:0"><input name="name" placeholder="Име и презиме" required style="margin:0"><button class="btn btn-primary">ДОДАЈ</button></form></div>${list}`));
});

/* --- STUDENT CARD WITH COLORED LEFT BORDERS --- */
app.get("/student/:id", (req, res) => {
    const db = load();
    const s = db.students.find(x => x.id == req.params.id);
    if(!s) return res.redirect("/students");

    const getLineClass = (type, val) => {
        if(type === 'grades') return 'line-grade';
        if(type === 'behavior') return 'line-behavior';
        if(type === 'activity') return val === '+' ? 'line-plus' : 'line-minus';
        return 'line-absent';
    };

    const renderItems = (items, type, title) => `
        <div class="card">
            <h3>${title}</h3>
            ${items.map((i, idx) => `
                <div class="entry-item ${getLineClass(type, i.value)}">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start">
                        <div>
                            <b style="font-size:18px">${i.value}</b> 
                            <p style="margin:5px 0; font-size:14px; color:#475569">${i.note || "Нема белешке"}</p>
                            <small style="color:#94a3b8">${i.date}</small>
                        </div>
                        <div class="action-btns">
                            <button class="btn btn-outline" onclick="editItem('${type}', ${idx}, '${i.value}', '${i.note||''}')"><i class="fas fa-edit"></i></button>
                            <form method="POST" action="/student/${s.id}/delete-item/${type}/${idx}" style="margin:0"><button class="btn btn-danger"><i class="fas fa-trash"></i></button></form>
                        </div>
                    </div>
                </div>
            `).join("") || "<p style='color:#94a3b8'>Нема података.</p>"}
        </div>`;

    res.send(layout(s.name, `
        <div style="display:grid; grid-template-columns: 1fr 2fr; gap:30px">
            <div>
                <form id="mainForm" method="POST" action="/student/${s.id}/add" class="card" style="position:sticky; top:20px">
                    <h3 id="formTitle">Нови унос</h3>
                    <input type="hidden" name="edit_idx" id="editIdx">
                    <select name="type" id="formType">
                        <option value="grades">Оцена</option>
                        <option value="activity">Активност (+/-)</option>
                        <option value="behavior">Владање (Напомена)</option>
                    </select>
                    <input name="value" id="formValue" placeholder="Вредност/Оцена" required>
                    <textarea name="note" id="formNote" placeholder="Белешка (опционо)"></textarea>
                    <button class="btn btn-primary" style="width:100%; justify-content:center" id="formBtn">САЧУВАЈ УНОС</button>
                    <button type="button" class="btn btn-outline" style="width:100%; margin-top:10px; display:none" id="cancelBtn" onclick="resetForm()">ПОНИШТИ</button>
                </form>
            </div>
            <div>
                ${renderItems(s.grades, 'grades', 'Оцене')}
                ${renderItems(s.activity, 'activity', 'Активност')}
                ${renderItems(s.behavior, 'behavior', 'Владање и Напомене')}
                
                <div class="card">
                    <h3>Изостанци</h3>
                    ${s.absences.map((a, idx) => `
                        <div class="entry-item line-absent">
                            <div style="display:flex; justify-content:space-between; margin-bottom:10px">
                                <span style="font-weight:800; color:${a.status==='Оправдан'?'#22c55e':'#f43f5e'}">${a.status}</span>
                                <small>${a.date}</small>
                            </div>
                            <h4 style="margin:0">${a.subject}</h4>
                            <p style="font-size:13px; color:#64748b">${a.topic}</p>
                            <form method="POST" action="/student/${s.id}/edit-absence/${idx}" style="margin-top:15px; display:grid; gap:8px">
                                <select name="status"><option value="Нерегулисан" ${a.status=='Нерегулисан'?'selected':''}>Нерегулисан</option><option value="Оправдан" ${a.status=='Оправдан'?'selected':''}>Оправдан</option><option value="Неоправдан" ${a.status=='Неоправдан'?'selected':''}>Неоправдан</option></select>
                                <input name="note" placeholder="Белешка" value="${a.note||''}">
                                <div style="display:flex; gap:10px">
                                    <button class="btn btn-primary" style="flex:1">АЖУРИРАЈ</button>
                                    <button type="submit" form="delAbs${idx}" class="btn btn-danger"><i class="fas fa-trash"></i></button>
                                </div>
                            </form>
                            <form id="delAbs${idx}" method="POST" action="/student/${s.id}/delete-item/absences/${idx}"></form>
                        </div>
                    `).join("") || "Нема изостанака."}
                </div>
            </div>
        </div>
        <script>
            function editItem(type, idx, val, note) {
                document.getElementById('formTitle').innerText = "Измени податак";
                document.getElementById('formType').value = type;
                document.getElementById('formValue').value = val;
                document.getElementById('formNote').value = note;
                document.getElementById('editIdx').value = idx;
                document.getElementById('mainForm').action = "/student/${s.id}/edit-item";
                document.getElementById('formBtn').innerText = "САЧУВАЈ ИЗМЕНЕ";
                document.getElementById('cancelBtn').style.display = "block";
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            function resetForm() {
                document.getElementById('mainForm').reset();
                document.getElementById('formTitle').innerText = "Нови унос";
                document.getElementById('mainForm').action = "/student/${s.id}/add";
                document.getElementById('formBtn').innerText = "САЧУВАЈ УНОС";
                document.getElementById('cancelBtn').style.display = "none";
            }
        </script>
    `));
});

/* --- LOGIKA ЗА БРИСАЊЕ И ИЗМЕНЕ --- */
app.post("/student/:id/add", (req, res) => {
    let db = load(); const s = db.students.find(x => x.id == req.params.id);
    const date = new Date().toLocaleDateString('sr-RS');
    if(req.body.type === 'activity') {
        s.activity.push({ value: req.body.value, note: req.body.note, date });
        // Аутоматизација оцена
        if(s.activity.filter(a=>a.value==='+').length >= 3) { s.grades.push({value:'5', note:'Аутоматски (3+)', date}); s.activity = s.activity.filter(a=>a.value!=='+'); }
        if(s.activity.filter(a=>a.value==='-').length >= 3) { s.grades.push({value:'1', note:'Аутоматски (3-)', date}); s.activity = s.activity.filter(a=>a.value!=='-'); }
    } else s[req.body.type].push({ value: req.body.value, note: req.body.note, date });
    save(db); res.redirect("/student/" + req.params.id);
});

app.post("/student/:id/edit-item", (req, res) => {
    let db = load(); const s = db.students.find(x => x.id == req.params.id);
    const idx = req.body.edit_idx;
    s[req.body.type][idx].value = req.body.value;
    s[req.body.type][idx].note = req.body.note;
    save(db); res.redirect("/student/" + req.params.id);
});

app.post("/student/:id/delete-item/:type/:idx", (req, res) => {
    let db = load(); const s = db.students.find(x => x.id == req.params.id);
    s[req.params.type].splice(req.params.idx, 1);
    save(db); res.redirect("/student/" + req.params.id);
});

app.post("/lesson/delete/:id", (req, res) => {
    let db = load(); db.lessons = db.lessons.filter(l => l.id != req.params.id);
    db.students.forEach(s => s.absences = s.absences.filter(a => a.lessonId != req.params.id));
    save(db); res.redirect("/dashboard");
});

app.post("/student/delete/:id", (req, res) => {
    let db = load(); db.students = db.students.filter(s => s.id != req.params.id);
    save(db); res.redirect("/students");
});

app.post("/students/add", (req, res) => {
    let db = load(); db.students.push({ id: Date.now(), name: req.body.name, grades: [], activity: [], behavior: [], absences: [] });
    save(db); res.redirect("/students");
});

app.get("/lesson/new", (req, res) => {
    const db = load();
    const students = db.students.map(s => `<label style="display:flex; gap:10px; padding:10px; border-bottom:1px solid #eee; cursor:pointer"><input type="checkbox" name="absent_ids" value="${s.id}"> ${s.name}</label>`).join("");
    res.send(layout("Уписивање часа", `<form method="POST" action="/lesson/save" class="card"><input name="subject" placeholder="Предмет" required><input name="topic" placeholder="Наставна јединица" required><input name="period" type="number" placeholder="Број часа" required><h3 style="margin-top:20px">Означи одсутне:</h3><div style="max-height:200px; overflow-y:auto; border:1px solid #eee; padding:10px; border-radius:10px">${students}</div><button class="btn btn-primary" style="width:100%; margin-top:20px; justify-content:center">САЧУВАЈ ЧАС</button></form>`));
});

app.post("/lesson/save", (req, res) => {
    let db = load(); const lesson = { id: Date.now(), subject: req.body.subject, topic: req.body.topic, period: req.body.period, date: new Date().toLocaleDateString('sr-RS') };
    db.lessons.push(lesson);
    if(req.body.absent_ids) {
        const ids = Array.isArray(req.body.absent_ids) ? req.body.absent_ids : [req.body.absent_ids];
        db.students.forEach(s => { if(ids.includes(s.id.toString())) s.absences.push({ lessonId: lesson.id, subject: lesson.subject, topic: lesson.topic, date: lesson.date, status: "Нерегулисан", note: "" }); });
    }
    save(db); res.redirect("/dashboard");
});

app.post("/student/:id/edit-absence/:idx", (req, res) => {
    let db = load(); const s = db.students.find(x => x.id == req.params.id);
    s.absences[req.params.idx].status = req.body.status;
    s.absences[req.params.idx].note = req.body.note;
    save(db); res.redirect("/student/" + req.params.id);
});

app.get("/logout", (req, res) => { sessions.delete("admin"); res.redirect("/login"); });
app.get("/", (req, res) => res.redirect("/dashboard"));

app.listen(5000, () => console.log("Дневник стартован!"));

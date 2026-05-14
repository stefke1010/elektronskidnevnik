/**
 * **************************************************************************
 * E-DNEVNIK ELITE RENDER EDITION v10.0
 * Autor: Stefan Mihajlović
 * **************************************************************************
 */

const express = require("express");
const { Pool } = require("pg");
const app = express();

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json());

let sessions = new Set();

// --- KONEKCIJA PRILAGOĐENA ZA RENDER ---
const pool = new Pool({
  connectionString: "postgresql://postgres.xpgcmjqzbqplnmdkljpt:DDpGfUtsUvJEjdsn@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

const getAvg = (g) => g && g.length ? (g.reduce((a, b) => a + parseFloat(b.value), 0) / g.length).toFixed(2) : "0.00";
const getD = () => new Date().toLocaleDateString('sr-RS');

/* --- LAYOUT --- */
const layout = (title, content) => `
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="UTF-8">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root { --p: #2563eb; --s: #0f172a; --bg: #f8fafc; --border: #e2e8f0; }
        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; display: flex; min-height: 100vh; background: var(--bg); color: #1e293b; font-size: 14px; }
        aside { width: 260px; background: var(--s); color: white; height: 100vh; position: fixed; padding: 30px 20px; display: flex; flex-direction: column; z-index: 1000; }
        aside h2 { font-weight: 800; text-align: center; margin-bottom: 30px; color: #3b82f6; font-size: 18px; }
        aside a { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.5); text-decoration: none; padding: 12px 15px; border-radius: 10px; margin-bottom: 4px; font-weight: 600; transition: 0.2s; }
        aside a:hover { background: rgba(255,255,255,0.08); color: white; }
        main { flex: 1; margin-left: 260px; padding: 40px 60px; background: white; min-height: 100vh; }
        .card { background: #fff; border-radius: 14px; padding: 18px 22px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border); border-left: 6px solid var(--p); }
        .btn { padding: 8px 15px; border-radius: 8px; border: none; cursor: pointer; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; font-size: 13px; }
        .btn-p { background: var(--p); color: white; }
        .btn-red { background: #fee2e2; color: #ef4444; }
        .badge { font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; }
        #modalOverlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: none; z-index: 3000; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .modal { background: white; padding: 30px; border-radius: 20px; width: 400px; }
    </style>
</head>
<body>
    <aside>
        <h2>Е-ДНЕВНИК</h2>
        <a href="/dashboard"><i class="fas fa-home"></i> Дашборд</a>
        <a href="/students"><i class="fas fa-users"></i> Ученици</a>
        <a href="/lesson/new"><i class="fas fa-plus-circle"></i> Нови час</a>
        <a href="/history"><i class="fas fa-history"></i> Историја</a>
        <a href="/logout" style="margin-top:auto; color:#fb7185; text-decoration:none;"><i class="fas fa-power-off"></i> Одјави се</a>
    </aside>
    <main><h1>${title}</h1>${content}</main>
    <div id="modalOverlay">
        <div class="modal">
            <h3>Правдање изостанка</h3>
            <form id="justifyForm" method="POST">
                <select name="status" style="width:100%; padding:10px; margin-bottom:10px;"><option value="Оправдан">Оправдан</option><option value="Неоправдан">Неоправдан</option></select>
                <textarea name="note" placeholder="Разлог..." rows="3" required style="width:100%; padding:10px;"></textarea>
                <button type="submit" class="btn btn-p" style="width:100%; margin-top:10px; justify-content:center;">САЧУВАЈ</button>
                <button type="button" onclick="document.getElementById('modalOverlay').style.display='none'" class="btn" style="width:100%; margin-top:5px; justify-content:center;">ОТКАЖИ</button>
            </form>
        </div>
    </div>
</body>
</html>`;

/* --- RUTE --- */
app.get("/login", (req, res) => {
    res.send(`<html><head><meta charset="UTF-8"><title>Пријава</title><style>
        body { margin: 0; height: 100vh; display: flex; align-items: center; justify-content: center; background: url('/pozadina dnevnik.jpg') center/cover no-repeat; font-family: sans-serif; }
        .card { background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); padding: 40px; border-radius: 20px; width: 350px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        input { width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #ddd; box-sizing: border-box; }
        button { width: 100%; padding: 12px; border: none; background: #0f172a; color: white; font-weight: 800; border-radius: 8px; cursor: pointer; }
    </style></head><body><div class="card"><h2>ПРИЈАВА</h2><form method="POST"><input name="user" placeholder="Корисник" required><input name="pass" type="password" placeholder="Лозинка" required><button>УЂИ</button></form></div></body></html>`);
});

app.post("/login", (req, res) => {
    if (req.body.user === "stefanmihajlovic" && req.body.pass === "stefanmihajloviccc") { sessions.add("admin"); return res.redirect("/dashboard"); }
    res.send("<script>alert('Грешка!'); window.location='/login';</script>");
});

app.get("/student/:id", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM students WHERE id = $1", [req.params.id]);
    const s = rows[0]; if(!s) return res.redirect("/students");

    const history = [
        ...s.grades.map((i, idx) => ({...i, type: 'grades', idx, c: '#2563eb', l: 'Оцена'})),
        ...s.activity.map((i, idx) => ({...i, type: 'activity', idx, c: '#10b981', l: 'Активност'})),
        ...s.behavior.map((i, idx) => ({...i, type: 'behavior', idx, c: '#a855f7', l: 'Владање', isB: true})),
        ...s.absences.map((i, idx) => {
            let absColor = '#f59e0b'; // Neregulisan
            if(i.status === 'Оправдан') absColor = '#10b981';
            if(i.status === 'Неоправдан') absColor = '#ef4444';
            return {...i, type: 'absences', idx, c: absColor, l: 'Изостанак', isA: true};
        })
    ].sort((a,b) => new Date(b.date) - new Date(a.date));

    let html = `<div style="display:grid; grid-template-columns: 300px 1fr; gap:30px;">
        <div style="background:#f1f5f9; padding:20px; border-radius:15px; height:fit-content;">
            <h4>Нови унос</h4>
            <form method="POST" action="/student/${s.id}/add">
                <select name="type" onchange="document.getElementById('vBox').style.display=(this.value==='behavior'?'block':'none')">
                    <option value="grades">Оцена</option><option value="activity">Активност</option><option value="behavior">Владање</option>
                </select>
                <div id="vBox" style="display:none;"><select name="behavior_type"><option value="Напомена">Напомена</option><option value="Опомена">Опомена</option><option value="Укор">Укор</option><option value="Похвала">Похвала</option></select></div>
                <input name="subject" placeholder="Предмет" required style="width:100%; padding:8px; margin-bottom:5px;">
                <input name="value" placeholder="Вредност" required style="width:100%; padding:8px; margin-bottom:5px;">
                <textarea name="note" placeholder="Белешка..." style="width:100%; padding:8px;"></textarea>
                <button class="btn btn-p" style="width:100%; margin-top:10px; justify-content:center;">САЧУВАЈ</button>
            </form>
        </div>
        <div>${history.map(i => `
            <div class="card" style="border-left-color: ${i.c}">
                <div style="flex:1">
                    <small>${i.l} | ${i.date}</small>
                    <h4 style="margin:5px 0;">${i.isB ? '<span class="badge" style="background:#f3e8ff; color:#7e22ce;">'+i.behavior_type+'</span>' : ''} ${i.isA ? '<span class="badge" style="background:'+i.c+'22; color:'+i.c+';">'+i.status+'</span>' : (i.subject || 'Изостанак')}</h4>
                    <p style="margin:0; font-size:12px; color:#666;">${i.note || '/'}</p>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="font-size:18px; font-weight:800;">${i.isA ? '' : i.value}</div>
                    ${i.isA ? `<button onclick="document.getElementById('justifyForm').action='/student/${s.id}/justify/${i.idx}'; document.getElementById('modalOverlay').style.display='flex'" class="btn" style="background:#fef3c7; color:#d97706;">ПРАВДАЈ</button>` : ''}
                    <form method="POST" action="/student/${s.id}/delete-item/${i.type}/${i.idx}"><button class="btn btn-red"><i class="fas fa-trash"></i></button></form>
                </div>
            </div>`).join("")}</div></div>`;
    res.send(layout(s.name, html));
});

// --- API ---
app.post("/students/add", async (req, res) => { await pool.query("INSERT INTO students (name) VALUES ($1)", [req.body.name]); res.redirect("/students"); });
app.post("/student/:id/add", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM students WHERE id = $1", [req.params.id]);
    const s = rows[0]; const type = req.body.type;
    const item = { subject: req.body.subject, value: req.body.value, note: req.body.note, date: getD() };
    if(type === 'behavior') item.behavior_type = req.body.behavior_type;
    const list = [...s[type], item];
    await pool.query(`UPDATE students SET ${type} = $1 WHERE id = $2`, [JSON.stringify(list), req.params.id]);
    res.redirect("/student/" + req.params.id);
});
app.post("/student/:id/justify/:idx", async (req, res) => {
    const { rows } = await pool.query("SELECT absences FROM students WHERE id = $1", [req.params.id]);
    const list = rows[0].absences;
    list[req.params.idx].status = req.body.status;
    list[req.params.idx].note = req.body.note;
    await pool.query("UPDATE students SET absences = $1 WHERE id = $2", [JSON.stringify(list), req.params.id]);
    res.redirect("/student/" + req.params.id);
});
app.post("/student/:id/delete-item/:type/:idx", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM students WHERE id = $1", [req.params.id]);
    const s = rows[0]; const type = req.params.type;
    s[type].splice(req.params.idx, 1);
    await pool.query(`UPDATE students SET ${type} = $1 WHERE id = $2`, [JSON.stringify(s[type]), req.params.id]);
    res.redirect("/student/" + req.params.id);
});

app.get("/dashboard", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM lessons WHERE date = $1", [getD()]);
    const list = rows.map(l => `<div class="card"><div><h4>${l.subject}</h4><p>${l.topic}</p></div><form method="POST" action="/lesson/delete/${l.id}"><button class="btn btn-red"><i class="fas fa-trash"></i></button></form></div>`).join("");
    res.send(layout("Данас", list || "Нема часова."));
});
app.get("/students", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM students ORDER BY name ASC");
    const list = rows.map(s => `<div class="card"><div><h4>${s.name}</h4><small>Просек: ${getAvg(s.grades)}</small></div><a href="/student/${s.id}" class="btn btn-p">ПРОФИЛ</a></div>`).join("");
    res.send(layout("Ученици", `<form method="POST" action="/students/add"><input name="name" placeholder="Име..."><button class="btn btn-p">ДОДАЈ</button></form>${list}`));
});

app.get("/lesson/new", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM students ORDER BY name ASC");
    const list = rows.map(s => `<div><input type="checkbox" name="abs_ids" value="${s.id}"> ${s.name}</div>`).join("");
    res.send(layout("Нови час", `<form method="POST" action="/lesson/save"><input name="sub" placeholder="Предмет"><input name="top" placeholder="Лекција"><input name="per" type="number" placeholder="Број часа">${list}<button class="btn btn-p">УПИШИ</button></form>`));
});

app.post("/lesson/save", async (req, res) => {
    const datum = getD();
    await pool.query("INSERT INTO lessons (subject, topic, period, date) VALUES ($1, $2, $3, $4)", [req.body.sub, req.body.top, req.body.per, datum]);
    if(req.body.abs_ids) {
        const ids = Array.isArray(req.body.abs_ids) ? req.body.abs_ids : [req.body.abs_ids];
        for(let id of ids) {
            const { rows } = await pool.query("SELECT absences FROM students WHERE id = $1", [id]);
            const list = [...rows[0].absences, { subject: req.body.sub, date: datum, status: "Нерегулисан", note: "" }];
            await pool.query("UPDATE students SET absences = $1 WHERE id = $2", [JSON.stringify(list), id]);
        }
    }
    res.redirect("/dashboard");
});

app.get("/history", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM lessons ORDER BY id DESC");
    const list = rows.map(l => `<div class="card"><div><small>${l.date}</small><h4>${l.subject}</h4></div></div>`).join("");
    res.send(layout("Архива", list));
});

app.post("/lesson/delete/:id", async (req, res) => { await pool.query("DELETE FROM lessons WHERE id = $1", [req.params.id]); res.redirect("/dashboard"); });
app.get("/logout", (req, res) => { sessions.delete("admin"); res.redirect("/login"); });
app.get("/", (req, res) => res.redirect("/dashboard"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Online na portu ${PORT}`));

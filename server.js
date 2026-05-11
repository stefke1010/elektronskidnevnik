/**
 * **************************************************************************
 * E-DNEVNIK ELITE PRO v9.0 - STATUS COLORS EDITION
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

const pool = new Pool({
  connectionString: "postgresql://postgres.xpgcmjqzbqplnmdkljpt:DDpGfUtsUvJEjdsn@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

const getAvg = (g) => g.length ? (g.reduce((a, b) => a + parseFloat(b.value), 0) / g.length).toFixed(2) : "0.00";
const getD = () => new Date().toLocaleDateString('sr-RS');

/* --- OSNOVNI LAYOUT --- */
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
        aside h2 { font-weight: 800; text-align: center; margin-bottom: 30px; color: #3b82f6; font-size: 18px; letter-spacing: 1px; }
        aside a { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.5); text-decoration: none; padding: 12px 15px; border-radius: 10px; margin-bottom: 4px; font-weight: 600; transition: 0.2s; }
        aside a:hover { background: rgba(255,255,255,0.08); color: white; }
        .logout { margin-top: auto; color: #fb7185 !important; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px !important; }

        main { flex: 1; margin-left: 260px; padding: 40px 60px; background: white; min-height: 100vh; }
        h1 { font-weight: 800; font-size: 28px; margin-bottom: 30px; color: var(--s); letter-spacing: -1px; }

        .card { background: #fff; border-radius: 14px; padding: 18px 22px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border); border-left: 6px solid var(--p); transition: 0.3s; }
        
        .btn { padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; font-weight: 700; transition: 0.2s; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; font-size: 13px; }
        .btn-p { background: var(--p); color: white; }
        .btn-red { background: #fee2e2; color: #ef4444; }
        .btn-edit { background: #f1f5f9; color: #475569; }

        #modalOverlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: none; z-index: 3000; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .modal { background: white; padding: 30px; border-radius: 20px; width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }

        .badge { font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; }
    </style>
</head>
<body>
    <aside>
        <h2>Е-ДНЕВНИК</h2>
        <a href="/dashboard"><i class="fas fa-home"></i> Дашборд</a>
        <a href="/students"><i class="fas fa-users"></i> Ученици</a>
        <a href="/lesson/new"><i class="fas fa-plus-circle"></i> Нови час</a>
        <a href="/history"><i class="fas fa-history"></i> Историја</a>
        <a href="/logout" class="logout"><i class="fas fa-power-off"></i> Одјави се</a>
    </aside>
    <main>
        <h1>${title}</h1>
        ${content}
    </main>

    <div id="modalOverlay">
        <div class="modal">
            <h3 style="margin-top:0;">Правдање изостанка</h3>
            <form id="justifyForm" method="POST">
                <select name="status" style="width:100%; padding:10px; margin-bottom:15px; border-radius:8px;">
                    <option value="Оправдан">Оправдан</option>
                    <option value="Неоправдан">Неоправдан</option>
                </select>
                <textarea name="note" placeholder="Разlog..." rows="3" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;"></textarea>
                <div style="display:flex; gap:10px; margin-top:15px;">
                    <button type="submit" class="btn btn-p" style="flex:1; justify-content:center;">САЧУВАЈ</button>
                    <button type="button" onclick="closeModal()" class="btn btn-edit">ОТКАЖИ</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        function openJustifyModal(sId, idx) {
            document.getElementById('justifyForm').action = "/student/" + sId + "/justify/" + idx;
            document.getElementById('modalOverlay').style.display = 'flex';
        }
        function closeModal() { document.getElementById('modalOverlay').style.display = 'none'; }
        function toggleBehavior(v) { document.getElementById('vladanjeBox').style.display = (v === 'behavior') ? 'block' : 'none'; }
    </script>
</body>
</html>`;

/* --- LOGIN RUTA SA TVOJOM SLIKOM --- */
app.get("/login", (req, res) => {
    res.send(`<html><head><meta charset="UTF-8"><title>Пријава</title><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap" rel="stylesheet"><style>
            body { margin: 0; height: 100vh; display: flex; align-items: center; justify-content: center; background: url('/pozadina dnevnik.jpg') center/cover no-repeat; font-family: 'Plus Jakarta Sans', sans-serif; }
            .glass-card { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(15px); padding: 50px; border-radius: 30px; width: 380px; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.4); }
            h2 { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 35px; }
            input { width: 100%; padding: 16px; border-radius: 15px; border: 1px solid rgba(0,0,0,0.1); background: white; font-size: 15px; margin-bottom: 20px; box-sizing: border-box; }
            button { width: 100%; padding: 18px; border-radius: 15px; border: none; background: #0f172a; color: white; font-weight: 800; font-size: 16px; cursor: pointer; transition: 0.3s; }
            button:hover { background: #1e293b; transform: translateY(-2px); }
        </style></head><body><div class="glass-card"><h2>ПРИЈАВА</h2><form method="POST"><input name="user" placeholder="Корисничко име" required><input name="pass" type="password" placeholder="Лозинка" required><button type="submit">УЂИ У ДНЕВНИК</button></form></div></body></html>`);
});

app.post("/login", (req, res) => {
    if (req.body.user === "stefanmihajlovic" && req.body.pass === "stefanmihajloviccc") { sessions.add("admin"); return res.redirect("/dashboard"); }
    res.send("<script>alert('Грешка!'); window.location='/login';</script>");
});

/* --- RUTE ZA PODATKE --- */
app.get("/student/:id", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM students WHERE id = $1", [req.params.id]);
    const s = rows[0]; if(!s) return res.redirect("/students");

    const history = [
        ...s.grades.map((i, idx) => ({...i, type: 'grades', idx, c: '#2563eb', l: 'Оцена'})),
        ...s.activity.map((i, idx) => ({...i, type: 'activity', idx, c: '#10b981', l: 'Активnost'})),
        ...s.behavior.map((i, idx) => ({...i, type: 'behavior', idx, c: '#a855f7', l: 'Владање', isB: true})),
        ...s.absences.map((i, idx) => {
            // Dinamička boja ivice za izostanke
            let absColor = '#f59e0b'; // Neregulisan (Narandžasta)
            if(i.status === 'Оправдан') absColor = '#10b981'; // Zelena
            if(i.status === 'Неоправдан') absColor = '#ef4444'; // Crvena
            return {...i, type: 'absences', idx, c: absColor, l: 'Изостанак', isA: true};
        })
    ].sort((a,b) => new Date(b.date) - new Date(a.date));

    let html = `<div style="display:grid; grid-template-columns: 320px 1fr; gap:40px;">
        <div style="background:#f1f5f9; padding:25px; border-radius:20px; position:sticky; top:20px; height:fit-content;">
            <h4 id="fTitle" style="margin-top:0;">Нови унос</h4>
            <form id="uForm" method="POST" action="/student/${s.id}/add">
                <input type="hidden" name="old_idx" id="oldIdx">
                <select name="type" id="fType" onchange="toggleBehavior(this.value)">
                    <option value="grades">Оцена</option><option value="activity">Активност</option><option value="behavior">Владање</option>
                </select>
                <div id="vladanjeBox" style="display:none; margin-bottom:10px;">
                    <select name="behavior_type" id="fBeh">
                        <option value="Напомена">Напомена</option><option value="Опомена">Опомена</option><option value="Укор">Укор</option>
                        <option value="Похвала">Похвала</option><option value="Награда">Награда</option><option value="Предлог">Предлог</option><option value="Искључење">Искључење</option>
                    </select>
                </div>
                <input name="subject" id="fSub" placeholder="Предмет" required>
                <input name="value" id="fVal" placeholder="Вредност">
                <textarea name="note" id="fNote" placeholder="Белешка..." rows="3"></textarea>
                <button class="btn btn-p" id="fBtn" style="width:100%; justify-content:center">САЧУВАЈ</button>
            </form>
        </div>
        <div>${history.map(i => `
            <div class="card" style="border-left-color: ${i.c}">
                <div style="flex:1">
                    <small style="color:#94a3b8; font-weight:700;">${i.l} | ${i.date}</small>
                    <h4 style="margin:5px 0;">
                        ${i.isB ? '<span class="badge" style="background:#f3e8ff; color:#7e22ce; margin-right:5px;">'+i.behavior_type+'</span>' : ''}
                        ${i.isA ? '<span class="badge" style="background:'+i.c+'22; color:'+i.c+'; margin-right:5px;">'+i.status+'</span>' : (i.subject || 'Изостанак')}
                    </h4>
                    <p style="margin:0; font-size:13px; color:#64748b;">${i.note || '/'}</p>
                </div>
                <div style="display:flex; align-items:center; gap:15px;">
                    <div style="font-size:20px; font-weight:800;">${i.isA ? '' : i.value}</div>
                    <div style="display:flex; gap:5px;">
                        ${i.isA ? `<button onclick="openJustifyModal(${s.id}, ${i.idx})" class="btn btn-edit" style="background:#fef3c7; color:#d97706;">ПРАВДАЈ</button>` : `<button onclick="editItem('${i.type}', ${i.idx}, '${i.subject}', '${i.value}', '${(i.note || "").replace(/'/g, "\\'")}', '${i.behavior_type || ""}')" class="btn btn-edit"><i class="fas fa-edit"></i></button>`}
                        <form method="POST" action="/student/${s.id}/delete-item/${i.type}/${i.idx}" style="margin:0"><button class="btn btn-red"><i class="fas fa-trash"></i></button></form>
                    </div>
                </div>
            </div>`).join("")}</div></div>
    <script>
        function editItem(type, idx, sub, val, note, beh) {
            document.getElementById('fTitle').innerText = "Измени унос";
            document.getElementById('fType').value = type;
            toggleBehavior(type);
            document.getElementById('fSub').value = sub;
            document.getElementById('fVal').value = val;
            document.getElementById('fNote').value = note;
            if(beh) document.getElementById('fBeh').value = beh;
            document.getElementById('oldIdx').value = idx;
            document.getElementById('uForm').action = "/student/${s.id}/edit-item";
            document.getElementById('fBtn').innerText = "АЖУРИРАЈ";
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    </script>`;
    res.send(layout(s.name, html));
});

// --- API ZA PRAVDANJE ---
app.post("/student/:id/justify/:absIdx", async (req, res) => {
    const { rows } = await pool.query("SELECT absences FROM students WHERE id = $1", [req.params.id]);
    const list = rows[0].absences;
    list[req.params.absIdx].status = req.body.status;
    list[req.params.absIdx].note = req.body.note;
    await pool.query("UPDATE students SET absences = $1 WHERE id = $2", [JSON.stringify(list), req.params.id]);
    res.redirect("/student/" + req.params.id);
});

/* --- OSTALO (Dashboard, Students, Add, Save, Delete...) --- */
app.get("/dashboard", async (req, res) => {
    const danas = getD();
    const { rows } = await pool.query("SELECT * FROM lessons WHERE date = $1 ORDER BY id DESC", [danas]);
    const list = rows.map(l => `<div class="card"><div><small>${l.date}</small><h4 style="margin:5px 0">${l.subject} (${l.period}. час)</h4><p style="margin:0; font-size:13px; opacity:0.7;">${l.topic}</p></div><form method="POST" action="/lesson/delete/${l.id}"><button class="btn btn-red"><i class="fas fa-trash"></i></button></form></div>`).join("");
    res.send(layout("Данас", list || `<div class="card" style="border:none; justify-content:center;">Нема уписаних часова за данас.</div>`));
});

app.get("/students", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM students ORDER BY name ASC");
    const list = rows.map(s => `<div class="card"><div><h4 style="margin:0">${s.name}</h4><small>Просек: <b>${getAvg(s.grades)}</b></small></div><a href="/student/${s.id}" class="btn btn-p">ПРОФИЛ</a></div>`).join("");
    res.send(layout("Ученици", `<div style="background:#f1f5f9; padding:20px; border-radius:15px; margin-bottom:20px;"><form method="POST" action="/students/add" style="display:flex; gap:10px;"><input name="name" placeholder="Иme ученика" style="margin:0; flex:1; padding:10px; border-radius:8px; border:1px solid #ddd;"><button class="btn btn-p">ДОДАЈ</button></form></div>${list}`));
});

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

app.post("/student/:id/edit-item", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM students WHERE id = $1", [req.params.id]);
    const s = rows[0]; const { type, old_idx, subject, value, note, behavior_type } = req.body;
    s[type][old_idx] = { ...s[type][old_idx], subject, value, note, behavior_type };
    await pool.query(`UPDATE students SET ${type} = $1 WHERE id = $2`, [JSON.stringify(s[type]), req.params.id]);
    res.redirect("/student/" + req.params.id);
});

app.post("/student/:id/delete-item/:type/:idx", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM students WHERE id = $1", [req.params.id]);
    const s = rows[0]; const type = req.params.type;
    s[type].splice(req.params.idx, 1);
    await pool.query(`UPDATE students SET ${type} = $1 WHERE id = $2`, [JSON.stringify(s[type]), req.params.id]);
    res.redirect("/student/" + req.params.id);
});

app.get("/lesson/new", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM students ORDER BY name ASC");
    const list = rows.map(s => `<label style="display:flex; align-items:center; gap:10px; padding:10px; border-bottom:1px solid #eee; cursor:pointer;"><input type="checkbox" name="abs_ids" value="${s.id}" style="width:auto; margin:0"> ${s.name}</label>`).join("");
    res.send(layout("Нови час", `<div style="max-width:600px; margin:0 auto; background:#f1f5f9; padding:30px; border-radius:20px;"><form method="POST" action="/lesson/save"><input name="sub" placeholder="Предмет" required style="width:100%; padding:10px; margin-bottom:10px;"><input name="top" placeholder="Наставна јединица" required style="width:100%; padding:10px; margin-bottom:10px;"><input name="per" type="number" placeholder="Број часа" required style="width:100%; padding:10px; margin-bottom:10px;"><div style="margin-top:10px;"><b>Одсутни:</b><div style="max-height:200px; overflow-y:auto; background:white; border-radius:10px; margin-top:10px;">${list}</div></div><button class="btn btn-p" style="width:100%; margin-top:20px; justify-content:center">УПИШИ ЧАС</button></form></div>`));
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
    const list = rows.map(l => `<div class="card"><div><small>${l.date}</small><h4>${l.subject} (${l.period}. час)</h4><p style="font-size:13px; opacity:0.7;">${l.topic}</p></div></div>`).join("");
    res.send(layout("Архива", list || "<p>Архива је празна.</p>"));
});

app.post("/lesson/delete/:id", async (req, res) => { await pool.query("DELETE FROM lessons WHERE id = $1", [req.params.id]); res.redirect("/dashboard"); });
app.get("/logout", (req, res) => { sessions.delete("admin"); res.redirect("/login"); });
app.get("/", (req, res) => res.redirect("/dashboard"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server Online na portu ${PORT}`));

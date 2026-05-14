const express = require("express");
const { Pool } = require("pg");
const app = express();

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json());

// --- SUBABASE KONEKCIJA ---
const pool = new Pool({
  connectionString: "postgresql://postgres.xpgcmjqzbqplnmdkljpt:vyjPY4wcoRMQg47l@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

// --- POMOĆNE FUNKCIJE ---
const getAvg = (g) => g && g.length ? (g.reduce((a, b) => a + parseFloat(b.value), 0) / g.length).toFixed(2) : "0.00";
const getD = () => new Date().toLocaleDateString('sr-RS');

/* --- MEGA DIZAJN --- */
const layout = (title, content, activeNav = 'dashboard') => `
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root { --p: #0052cc; --s: #0747a6; --bg: #f4f5f7; --txt: #172b4d; --white: #ffffff; --border: #dfe1e6; }
        body { margin: 0; font-family: 'Inter', sans-serif; display: flex; background: var(--bg); color: var(--txt); }
        
        /* Sidebar */
        aside { width: 280px; background: #091e42; color: white; height: 100vh; position: fixed; display: flex; flex-direction: column; transition: 0.3s; }
        .logo { padding: 30px; font-size: 22px; font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 10px; }
        .logo i { color: #4c9aff; }
        
        nav { padding: 20px 15px; flex: 1; }
        nav a { display: flex; align-items: center; gap: 12px; color: #ebecf0; text-decoration: none; padding: 12px 15px; border-radius: 8px; margin-bottom: 5px; font-weight: 500; transition: 0.2s; }
        nav a:hover, nav a.active { background: rgba(255,255,255,0.1); color: #4c9aff; }
        
        /* Main Content */
        main { flex: 1; margin-left: 280px; padding: 30px 50px; }
        .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        
        /* Stats Grid */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .stat-card small { color: #6b778c; font-weight: 700; text-transform: uppercase; font-size: 11px; }
        .stat-card h2 { margin: 5px 0 0; font-size: 28px; color: var(--p); }

        /* Modern Cards */
        .card { background: white; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 15px; padding: 20px; display: flex; justify-content: space-between; align-items: center; transition: 0.2s; }
        .card:hover { border-color: var(--p); box-shadow: 0 4px 12px rgba(9,30,66,0.08); }
        
        .btn { padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; font-size: 14px; transition: 0.2s; text-decoration: none; }
        .btn-p { background: var(--p); color: white; }
        .btn-p:hover { background: var(--s); }
        .btn-sec { background: #ebecf0; color: #42526e; }
        .btn-danger { background: #ffebe6; color: #de350b; }

        /* Forms */
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: 600; font-size: 13px; color: #5e6c84; }
        input, select, textarea { width: 100%; padding: 10px; border: 2px solid #dfe1e6; border-radius: 6px; font-family: inherit; font-size: 14px; box-sizing: border-box; }
        input:focus { border-color: var(--p); outline: none; }

        /* Badges */
        .badge { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .bg-success { background: #e3fcef; color: #006644; }
        .bg-error { background: #ffebe6; color: #bf2600; }
        .bg-warning { background: #fff0b3; color: #825c00; }

        #modalOverlay { position: fixed; inset: 0; background: rgba(9,30,66,0.54); display: none; z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(3px); }
        .modal { background: white; width: 500px; padding: 30px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
    </style>
</head>
<body>
    <aside>
        <div class="logo"><i class="fas fa-graduation-cap"></i> eDnevnik ELITE</div>
        <nav>
            <a href="/dashboard" class="${activeNav==='dashboard'?'active':''}"><i class="fas fa-chart-line"></i> Командна табла</a>
            <a href="/students" class="${activeNav==='students'?'active':''}"><i class="fas fa-users"></i> Моје одељење</a>
            <a href="/lesson/new" class="${activeNav==='new'?'active':''}"><i class="fas fa-edit"></i> Упиши час</a>
            <a href="/schedule" class="${activeNav==='schedule'?'active':''}"><i class="fas fa-calendar-alt"></i> Распоред</a>
            <a href="/reports" class="${activeNav==='reports'?'active':''}"><i class="fas fa-file-invoice"></i> Извештаји</a>
            <a href="/settings" class="${activeNav==='settings'?'active':''}"><i class="fas fa-cog"></i> Подешавања</a>
            <div style="margin-top:auto; padding-top:20px; border-top:1px solid rgba(255,255,255,0.1);">
                <a href="/logout" style="color:#ff8b8b;"><i class="fas fa-sign-out-alt"></i> Одјава</a>
            </div>
        </nav>
    </aside>
    <main>
        <div class="header-flex">
            <h1>${title}</h1>
            <div id="currentTime" style="font-weight:600; color:#6b778c;"></div>
        </div>
        ${content}
    </main>

    <div id="modalOverlay">
        <div class="modal" id="modalContent"></div>
    </div>

    <script>
        setInterval(() => { document.getElementById('currentTime').innerText = new Date().toLocaleString('sr-RS'); }, 1000);
        function openModal(html) {
            document.getElementById('modalContent').innerHTML = html;
            document.getElementById('modalOverlay').style.display = 'flex';
        }
        function closeModal() { document.getElementById('modalOverlay').style.display = 'none'; }
    </script>
</body>
</html>`;

/* --- RUTIRANJE --- */

// Dashboard sa statistikom
app.get("/dashboard", async (req, res) => {
    const studentsRes = await pool.query("SELECT * FROM students");
    const lessonsRes = await pool.query("SELECT * FROM lessons WHERE date = $1", [getD()]);
    
    let totalGrades = 0, countGrades = 0, totalAbs = 0;
    studentsRes.rows.forEach(s => {
        s.grades.forEach(g => { totalGrades += parseFloat(g.value); countGrades++; });
        totalAbs += s.absences.length;
    });
    const avgClass = countGrades > 0 ? (totalGrades / countGrades).toFixed(2) : "0.00";

    const content = `
    <div class="stats-grid">
        <div class="stat-card"><small>Просек одељења</small><h2>${avgClass}</h2></div>
        <div class="stat-card"><small>Укупно ученика</small><h2>${studentsRes.rows.length}</h2></div>
        <div class="stat-card"><small>Данас часова</small><h2>${lessonsRes.rows.length}</h2></div>
        <div class="stat-card"><small>Укупно изостанака</small><h2 style="color:#de350b">${totalAbs}</h2></div>
    </div>
    <h3>Активности данас</h3>
    ${lessonsRes.rows.map(l => `
        <div class="card">
            <div><strong>${l.period}. час: ${l.subject}</strong><br><small>${l.topic}</small></div>
            <span class="badge bg-success">Реализовано</span>
        </div>
    `).join("") || "<p>Нема уписаних активности за данас.</p>"}
    `;
    res.send(layout("Командна табла", content, 'dashboard'));
});

// Lista učenika sa brzim akcijama
app.get("/students", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM students ORDER BY name ASC");
    const list = rows.map(s => `
        <div class="card">
            <div style="display:flex; align-items:center; gap:15px;">
                <div style="width:40px; height:40px; background:#deebff; color:#0747a6; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold;">${s.name.split(' ').map(n=>n[0]).join('')}</div>
                <div>
                    <h4 style="margin:0">${s.name}</h4>
                    <small>Просек: <strong>${getAvg(s.grades)}</strong> | Изостано: ${s.absences.length}</small>
                </div>
            </div>
            <div style="display:flex; gap:8px;">
                <a href="/student/${s.id}" class="btn btn-sec">Картон</a>
                <button onclick="openModal('<h3>Брзи унос ocene</h3><form method=\'POST\' action=\'/student/${s.id}/add\'><input type=\'hidden\' name=\'type\' value=\'grades\'><input name=\'subject\' placeholder=\'Predmet\' required><input name=\'value\' type=\'number\' min=\'1\' max=\'5\' required><button class=\'btn btn-p\' style=\'width:100%\'>Upis</button></form>')" class="btn btn-p"><i class="fas fa-plus"></i></button>
            </div>
        </div>
    `).join("");
    res.send(layout("Моје одељење", `<div style="margin-bottom:20px;"><button class="btn btn-p" onclick="openModal('<h3>Novi učenik</h3><form method=\'POST\' action=\'/students/add\'><input name=\'name\' placeholder=\'Ime i prezime\' required><button class=\'btn btn-p\'>Dodaj</button></form>')">Додај новог ученика</button></div>${list}`, 'students'));
});

// Profil učenika sa istorijom
app.get("/student/:id", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM students WHERE id = $1", [req.params.id]);
    const s = rows[0]; if(!s) return res.redirect("/students");

    const allLogs = [
        ...s.grades.map(i => ({...i, t:'ocena', c:'#0052cc'})),
        ...s.absences.map(i => ({...i, t:'izostanak', c:'#de350b'})),
        ...s.behavior.map(i => ({...i, t:'vladanje', c:'#403294'}))
    ].sort((a,b) => new Date(b.date) - new Date(a.date));

    res.send(layout(s.name, `
        <div style="display:grid; grid-template-columns: 1fr 2fr; gap:30px;">
            <div class="stat-card">
                <h3>Додај унос</h3>
                <form method="POST" action="/student/${s.id}/add">
                    <div class="form-group"><label>Тип</label><select name="type"><option value="grades">Оцена</option><option value="absences">Изостанак</option><option value="behavior">Напомена</option></select></div>
                    <div class="form-group"><label>Предмет</label><input name="subject" required></div>
                    <div class="form-group"><label>Вредност / Опис</label><input name="value" required></div>
                    <button class="btn btn-p" style="width:100%">САЧУВАЈ</button>
                </form>
            </div>
            <div>
                <h3>Хронологија</h3>
                ${allLogs.map(l => `
                    <div class="card" style="border-left: 5px solid ${l.c}">
                        <div><small>${l.date} | ${l.t.toUpperCase()}</small><br><strong>${l.subject || 'Дисциплина'}</strong>: ${l.value}</div>
                        <span class="badge" style="background:${l.c}11; color:${l.c}">${l.t}</span>
                    </div>
                `).join("")}
            </div>
        </div>
    `));
});

// Login i ostale rute (Sve ostalo ostaje isto kao u prethodnom kodu radi funkcionalnosti)
app.get("/login", (req, res) => {
    res.send(`<body style="background: #091e42; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh;">
        <form method="POST" style="background:white; padding:40px; border-radius:12px; width:350px;">
            <h2 style="color:#0052cc">eDnevnik ELITE</h2>
            <input name="user" placeholder="Korisnik" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:4px;">
            <input name="pass" type="password" placeholder="Lozinka" style="width:100%; padding:10px; margin-bottom:20px; border:1px solid #ddd; border-radius:4px;">
            <button style="width:100%; padding:12px; background:#0052cc; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">PRIJAVI SE</button>
        </form>
    </body>`);
});

app.post("/login", (req, res) => {
    if (req.body.user === "stefanmihajlovic" && req.body.pass === "stefanmihajloviccc") return res.redirect("/dashboard");
    res.send("<script>alert('Pogrešni podaci'); window.location='/login';</script>");
});

app.post("/students/add", async (req, res) => {
    await pool.query("INSERT INTO students (name, grades, activity, behavior, absences) VALUES ($1, '[]', '[]', '[]', '[]')", [req.body.name]);
    res.redirect("/students");
});

app.post("/student/:id/add", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM students WHERE id = $1", [req.params.id]);
    const s = rows[0]; const type = req.body.type;
    const item = { subject: req.body.subject, value: req.body.value, date: getD() };
    const list = [...(s[type] || []), item];
    await pool.query(`UPDATE students SET ${type} = $1 WHERE id = $2`, [JSON.stringify(list), req.params.id]);
    res.redirect("/student/" + req.params.id);
});

app.get("/lesson/new", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM students ORDER BY name ASC");
    res.send(layout("Упис новог часа", `
        <div class="stat-card" style="max-width:600px; margin:0 auto;">
            <form method="POST" action="/lesson/save">
                <div class="form-group"><label>Предмет</label><input name="sub" required></div>
                <div class="form-group"><label>Наставна јединица</label><textarea name="top" required></textarea></div>
                <div class="form-group"><label>РБ Часа</label><input type="number" name="per" required></div>
                <button class="btn btn-p" style="width:100%">УПИШИ ЧАС У ДНЕВНИК</button>
            </form>
        </div>
    `, 'new'));
});

app.post("/lesson/save", async (req, res) => {
    await pool.query("INSERT INTO lessons (subject, topic, period, date) VALUES ($1, $2, $3, $4)", [req.body.sub, req.body.top, req.body.per, getD()]);
    res.redirect("/dashboard");
});

app.get("/logout", (req, res) => res.redirect("/login"));
app.get("/", (req, res) => res.redirect("/dashboard"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Sistem pokrenut na portu ${PORT}`));

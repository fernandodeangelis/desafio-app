import express from 'express';
import cors from 'cors';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const secret = process.env.JWT_SECRET || 'secret_key_123';

// Database Pool
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('CRITICAL: Database connection failed!', err.message);
    } else {
        console.log('SUCCESS: Database connected at', res.rows[0].now);
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Static files for images
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// --- Helpers ---
const getWeekId = (date = new Date()) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const year = d.getUTCFullYear();
    const weekNo = Math.ceil((((d.getTime() - new Date(Date.UTC(year, 0, 1)).getTime()) / 86400000) + 1) / 7);
    return `${year}-W${weekNo}`;
};

// --- Routes ---

// AUTH
app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secret);
        res.json({ user: { id: user.id.toString(), username: user.username, email: user.email, role: user.role }, token });
    } catch (e) { 
        console.error("Login error:", e);
        res.status(500).json({ error: e.message }); 
    }
});

app.post('/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log(`Registering user: ${username}`);
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, role',
            [username, email, hash]
        );
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secret);
        res.json({ user: { ...user, id: user.id.toString() }, token });
    } catch (e) { 
        console.error("Registration error details:", e);
        res.status(500).json({ error: `Error en el registro: ${e.message}` }); 
    }
});

// GROUPS
app.get('/groups', async (req, res) => {
    try {
        const userId = req.query.userId;
        const result = await pool.query(
            `SELECT g.* FROM groups g 
             JOIN participants p ON g.id = p.group_id 
             WHERE p.user_id = $1`, 
             [userId]
        );
        const groups = result.rows.map(g => ({
            id: g.id.toString(),
            name: g.name,
            code: g.code,
            adminId: g.admin_id.toString(),
            encargadoId: g.encargado_id.toString(),
            currentFineAmount: g.current_fine_amount,
            createdAt: g.created_at
        }));
        res.json(groups);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/groups', async (req, res) => {
    try {
        const { userId, name } = req.body;
        const code = Math.random().toString(36).substring(7).toUpperCase();
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const groupRes = await client.query(
                'INSERT INTO groups (name, code, admin_id, encargado_id) VALUES ($1, $2, $3, $3) RETURNING *',
                [name, code, userId]
            );
            const group = groupRes.rows[0];
            
            const userRes = await client.query('SELECT username FROM users WHERE id = $1', [userId]);
            const username = userRes.rows[0].username;

            await client.query(
                'INSERT INTO participants (user_id, group_id, username) VALUES ($1, $2, $3)',
                [userId, group.id, username]
            );
            await client.query(
                "INSERT INTO logs (group_id, message, type) VALUES ($1, $2, 'SUCCESS')",
                [group.id, `Grupo "${name}" creado por ${username}`]
            );

            await client.query('COMMIT');
            res.json({
                id: group.id.toString(),
                name: group.name,
                code: group.code,
                adminId: group.admin_id.toString(),
                encargadoId: group.encargado_id.toString(),
                currentFineAmount: group.current_fine_amount,
                createdAt: group.created_at
            });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/groups/join', async (req, res) => {
    try {
        const { userId, code } = req.body;
        const groupRes = await pool.query('SELECT * FROM groups WHERE code = $1', [code]);
        if (groupRes.rows.length === 0) return res.status(404).json({ error: 'Código inválido' });
        
        const group = groupRes.rows[0];
        const userRes = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
        const username = userRes.rows[0].username;

        try {
            await pool.query(
                'INSERT INTO participants (user_id, group_id, username) VALUES ($1, $2, $3)',
                [userId, group.id, username]
            );
            await pool.query(
                "INSERT INTO logs (group_id, message, type) VALUES ($1, $2, 'INFO')",
                [group.id, `${username} se unió al grupo`]
            );
            res.json({
                ...group,
                id: group.id.toString(),
                adminId: group.admin_id.toString(),
                encargadoId: group.encargado_id.toString()
            });
        } catch (e) { res.status(400).json({ error: 'Ya eres miembro' }); }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// PARTICIPANTS
app.get('/participants', async (req, res) => {
    try {
        const { groupId } = req.query;
        const result = await pool.query('SELECT * FROM participants WHERE group_id = $1', [groupId]);
        res.json(result.rows.map(p => ({
            userId: p.user_id.toString(),
            groupId: p.group_id.toString(),
            username: p.username,
            accumulatedFine: p.accumulated_fine,
            currentObjective: p.current_objective,
            hasWildcard: p.has_wildcard
        })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/participants', async (req, res) => {
    try {
        const { groupId, userId, updates } = req.body;
        const keys = Object.keys(updates);
        if (keys.length === 0) return res.json({ success: true });

        const map = { accumulatedFine: 'accumulated_fine', currentObjective: 'current_objective' };
        const setClause = keys.map((k, i) => `${map[k] || k} = $${i + 3}`).join(', ');
        const values = [groupId, userId, ...keys.map(k => updates[k])];
        
        await pool.query(`UPDATE participants SET ${setClause} WHERE group_id = $1 AND user_id = $2`, values);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// EVIDENCE
app.get('/evidence', async (req, res) => {
    try {
        const { groupId } = req.query;
        const result = await pool.query('SELECT * FROM evidence WHERE group_id = $1 ORDER BY timestamp DESC', [groupId]);
        res.json(result.rows.map(e => ({
            id: e.id.toString(),
            groupId: e.group_id.toString(),
            userId: e.user_id.toString(),
            username: e.username,
            weekId: e.week_id,
            description: e.description,
            imageUrl: e.image_url,
            status: e.status,
            timestamp: e.timestamp
        })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/evidence', upload.single('image'), async (req, res) => {
    try {
        const { groupId, userId, username, description } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const weekId = getWeekId();

        await pool.query(
            'INSERT INTO evidence (group_id, user_id, username, week_id, description, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
            [groupId, userId, username, weekId, description, imageUrl]
        );
        await pool.query(
            "INSERT INTO logs (group_id, message, type) VALUES ($1, $2, 'INFO')",
            [groupId, `${username} subió nueva evidencia`]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/evidence/:id', async (req, res) => {
    try {
        const { status, reviewerName } = req.body;
        const id = req.params.id;
        
        const r = await pool.query('UPDATE evidence SET status = $1 WHERE id = $2 RETURNING group_id, username', [status, id]);
        if(r.rows.length > 0) {
            const { group_id, username } = r.rows[0];
            const action = status === 'APPROVED' ? 'aprobó' : 'rechazó';
            const type = status === 'APPROVED' ? 'SUCCESS' : 'WARNING';
            await pool.query(
                "INSERT INTO logs (group_id, message, type) VALUES ($1, $2, $3)",
                [group_id, `Encargado (${reviewerName}) ${action} evidencia de ${username}`, type]
            );
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// CHALLENGES
app.get('/challenges', async (req, res) => {
    try {
        const { groupId } = req.query;
        const result = await pool.query('SELECT * FROM challenges WHERE group_id = $1', [groupId]);
        res.json(result.rows.map(c => ({
            id: c.id.toString(),
            groupId: c.group_id.toString(),
            challengerId: c.challenger_id.toString(),
            challengerName: c.challenger_name,
            challengedId: c.challenged_id.toString(),
            challengedName: c.challenged_name,
            description: c.description,
            fineAmount: c.fine_amount,
            status: c.status
        })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/challenges', async (req, res) => {
    try {
        const { groupId, challengerId, challengerName, challengedId, challengedName, description, fineAmount } = req.body;
        await pool.query(
            'INSERT INTO challenges (group_id, challenger_id, challenger_name, challenged_id, challenged_name, description, fine_amount) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [groupId, challengerId, challengerName, challengedId, challengedName, description, fineAmount]
        );
        await pool.query(
            "INSERT INTO logs (group_id, message, type) VALUES ($1, $2, 'WARNING')",
            [groupId, `${challengerName} retó a ${challengedName}`]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/challenges/:id', async (req, res) => {
    try {
        const { status, fineAmount, loserId } = req.body;
        const id = req.params.id;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE challenges SET status = $1 WHERE id = $2', [status, id]);
            
            if (loserId && fineAmount) {
                const cRes = await client.query('SELECT group_id, challenger_name, challenged_name, challenger_id FROM challenges WHERE id = $1', [id]);
                const challenge = cRes.rows[0];
                const groupId = challenge.group_id;

                await client.query(
                    'UPDATE participants SET accumulated_fine = accumulated_fine + $1 WHERE user_id = $2 AND group_id = $3',
                    [fineAmount, loserId, groupId]
                );
                
                const loserName = loserId == challenge.challenger_id ? challenge.challenger_name : challenge.challenged_name;
                await client.query(
                    "INSERT INTO logs (group_id, message, type) VALUES ($1, $2, 'DANGER')",
                    [groupId, `Reto finalizado. ${loserName} paga multa de $${fineAmount}.`]
                );
            }
            await client.query('COMMIT');
            res.json({ success: true });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// LOGS
app.get('/logs', async (req, res) => {
    try {
        const { groupId } = req.query;
        const result = await pool.query('SELECT * FROM logs WHERE group_id = $1 ORDER BY timestamp DESC', [groupId]);
        res.json(result.rows.map(l => ({
            id: l.id.toString(),
            groupId: l.group_id.toString(),
            message: l.message,
            timestamp: l.timestamp,
            type: l.type
        })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// WEEK CLOSING
app.post('/groups/:id/check-week', async (req, res) => {
    const groupId = req.params.id;
    const today = new Date();
    const prevDate = new Date(today);
    prevDate.setDate(today.getDate() - 7);
    const prevWeekId = getWeekId(prevDate);

    try {
        const check = await pool.query('SELECT * FROM closed_weeks WHERE group_id = $1 AND week_id = $2', [groupId, prevWeekId]);
        if (check.rows.length > 0) return res.json({ processed: false, message: 'Semana ya cerrada' });

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const groupRes = await client.query('SELECT * FROM groups WHERE id = $1', [groupId]);
            const group = groupRes.rows[0];
            
            if (new Date(group.created_at) > prevDate) {
                 await client.query('ROLLBACK');
                 return res.json({ processed: false });
            }

            const pRes = await client.query('SELECT user_id, username FROM participants WHERE group_id = $1', [groupId]);
            const eRes = await client.query(
                "SELECT user_id FROM evidence WHERE group_id = $1 AND week_id = $2 AND status = 'APPROVED'", 
                [groupId, prevWeekId]
            );
            const approvedIds = eRes.rows.map(r => r.user_id.toString());
            const defaulters = pRes.rows.filter(p => !approvedIds.includes(p.user_id.toString()));

            if (defaulters.length > 0) {
                const fine = group.current_fine_amount;
                for (const d of defaulters) {
                    await client.query(
                        'UPDATE participants SET accumulated_fine = accumulated_fine + $1 WHERE user_id = $2 AND group_id = $3',
                        [fine, d.user_id, groupId]
                    );
                }
                const names = defaulters.map(d => d.username).join(', ');
                await client.query(
                    "INSERT INTO logs (group_id, message, type) VALUES ($1, $2, 'DANGER')",
                    [groupId, `Cierre de semana ${prevWeekId}. Multa aplicada a: ${names}`]
                );
            }

            await client.query('INSERT INTO closed_weeks (group_id, week_id) VALUES ($1, $2)', [groupId, prevWeekId]);
            await client.query('COMMIT');
            res.json({ processed: true, prevWeekId });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/groups/:id/fine', async(req, res) => {
    try {
        const { amount } = req.body;
        await pool.query('UPDATE groups SET current_fine_amount = $1 WHERE id = $2', [amount, req.params.id]);
        await pool.query(
            "INSERT INTO logs (group_id, message, type) VALUES ($1, $2, 'WARNING')",
            [req.params.id, `Multa actualizada a $${amount}`]
        );
        res.json({success: true});
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.listen(port, () => {
    console.log(`API running on port ${port}`);
});
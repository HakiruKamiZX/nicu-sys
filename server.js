const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API PASIEN ---
app.get('/api/patients', async (req, res) => {
    try {
        const [patients] = await db.query('SELECT id, name, mrn, dob_time FROM patients ORDER BY name');
        res.json(patients);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// **FIX**: Menambahkan endpoint yang hilang untuk mengambil data satu pasien
app.get('/api/patients/:id', async (req, res) => {
    try {
        const [patient] = await db.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
        if (patient.length > 0) {
            res.json(patient[0]);
        } else {
            res.status(404).json({ error: 'Patient not found' });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/patients', async (req, res) => {
    try {
        const p = req.body;
        const [result] = await db.query(
            `INSERT INTO patients (name, mrn, admission_date, baby_age, gender, diagnosis, delivery_history, 
            gestational_age, dob_time, birth_weight_height, amniotic_fluid_color, delivery_method, apgar_score, day_of_care) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [p.name, p.mrn, p.admission_date, p.baby_age, p.gender, p.diagnosis, p.delivery_history, 
            p.gestational_age, p.dob_time, p.birth_weight_height, p.amniotic_fluid_color, p.delivery_method, p.apgar_score, p.day_of_care]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/patients/:id', async (req, res) => {
    try {
        const p = req.body;
        await db.query(
            `UPDATE patients SET name=?, mrn=?, admission_date=?, baby_age=?, gender=?, diagnosis=?, delivery_history=?, 
            gestational_age=?, dob_time=?, birth_weight_height=?, amniotic_fluid_color=?, delivery_method=?, apgar_score=?, day_of_care=? 
            WHERE id = ?`,
            [p.name, p.mrn, p.admission_date, p.baby_age, p.gender, p.diagnosis, p.delivery_history, 
            p.gestational_age, p.dob_time, p.birth_weight_height, p.amniotic_fluid_color, p.delivery_method, p.apgar_score, p.day_of_care, req.params.id]
        );
        res.status(200).json({ message: 'Patient updated successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/patients/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM patients WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// --- API CATATAN HARIAN ---
app.get('/api/patients/:patientId/records', async (req, res) => {
    try {
        const [records] = await db.query('SELECT * FROM daily_records WHERE patientId = ? ORDER BY date DESC', [req.params.patientId]);
        res.json(records);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/records', async (req, res) => {
    try {
        const { patientId, date, nurse } = req.body;
        const [result] = await db.query('INSERT INTO daily_records (patientId, date, nurse) VALUES (?, ?, ?)', [patientId, date, nurse]);
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/records/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM daily_records WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// --- API ENTRI PER JAM ---
app.get('/api/records/:recordId/entries', async (req, res) => {
    try {
        const [entries] = await db.query('SELECT * FROM hourly_entries WHERE recordId = ? ORDER BY time DESC', [req.params.recordId]);
        res.json(entries);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/entries', async (req, res) => {
    try {
        const e = req.body;
        const [result] = await db.query(
            `INSERT INTO hourly_entries (recordId, time, by_vital, ink_vital, tk_vital, wk_vital, apnea, fn_vital, fp_vital, td_vital, 
            map_vital, sat_o2, crt_vital, vi_vital, vita_vital, pn_vital, ve_vital, leak_vital, urine, feces, muntah, mgt, drain, iwl, 
            vm_mode, vm_rate, vm_it, vm_ie, vm_fio2, vm_flow, vm_pip, vm_peep, vm_psv, vm_ka, vm_ki) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [e.recordId, e.time, e.by_vital, e.ink_vital, e.tk_vital, e.wk_vital, e.apnea, e.fn_vital, e.fp_vital, e.td_vital, 
            e.map_vital, e.sat_o2, e.crt_vital, e.vi_vital, e.vita_vital, e.pn_vital, e.ve_vital, e.leak_vital, e.urine, e.feces, e.muntah, e.mgt, e.drain, e.iwl, 
            e.vm_mode, e.vm_rate, e.vm_it, e.vm_ie, e.vm_fio2, e.vm_flow, e.vm_pip, e.vm_peep, e.vm_psv, e.vm_ka, e.vm_ki]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/entries/:id', async (req, res) => {
    try {
        const e = req.body;
        const entryId = req.params.id;
        await db.query(
            `UPDATE hourly_entries SET time=?, by_vital=?, ink_vital=?, tk_vital=?, wk_vital=?, apnea=?, fn_vital=?, fp_vital=?, td_vital=?, 
            map_vital=?, sat_o2=?, crt_vital=?, vi_vital=?, vita_vital=?, pn_vital=?, ve_vital=?, leak_vital=?, urine=?, feces=?, muntah=?, mgt=?, drain=?, iwl=?, 
            vm_mode=?, vm_rate=?, vm_it=?, vm_ie=?, vm_fio2=?, vm_flow=?, vm_pip=?, vm_peep=?, vm_psv=?, vm_ka=?, vm_ki=? 
            WHERE id = ?`,
            [e.time, e.by_vital, e.ink_vital, e.tk_vital, e.wk_vital, e.apnea, e.fn_vital, e.fp_vital, e.td_vital, 
            e.map_vital, e.sat_o2, e.crt_vital, e.vi_vital, e.vita_vital, e.pn_vital, e.ve_vital, e.leak_vital, e.urine, e.feces, e.muntah, e.mgt, e.drain, e.iwl, 
            e.vm_mode, e.vm_rate, e.vm_it, e.vm_ie, e.vm_fio2, e.vm_flow, e.vm_pip, e.vm_peep, e.vm_psv, e.vm_ka, e.vm_ki, entryId]
        );
        res.status(200).json({ message: 'Entry updated successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


app.delete('/api/entries', async (req, res) => {
    try {
        const { recordId, time } = req.body;
        const timeAsDateObject = new Date(time);
        await db.query('DELETE FROM hourly_entries WHERE recordId = ? AND time = ?', [recordId, timeAsDateObject]);
        res.status(204).send();
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));


const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API ROUTES ---

// ... (Patient and Daily Record routes remain the same) ...
// GET all patients
app.get('/api/patients', async (req, res) => {
    try {
        const [patients] = await db.query('SELECT * FROM patients ORDER BY name');
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch patients', details: err.message });
    }
});

// POST a new patient
app.post('/api/patients', async (req, res) => {
    try {
        const { name, mrn, dob, gender, diagnosis } = req.body;
        const [result] = await db.query(
            'INSERT INTO patients (name, mrn, dob, gender, diagnosis) VALUES (?, ?, ?, ?, ?)',
            [name, mrn, dob, gender, diagnosis]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create patient', details: err.message });
    }
});

// DELETE a patient
app.delete('/api/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM patients WHERE id = ?', [id]);
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Patient and all associated data deleted successfully' });
        } else {
            res.status(404).json({ message: 'Patient not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete patient', details: err.message });
    }
});

// GET daily records for a specific patient
app.get('/api/patients/:patientId/records', async (req, res) => {
    try {
        const { patientId } = req.params;
        const [records] = await db.query('SELECT * FROM daily_records WHERE patientId = ? ORDER BY date DESC', [patientId]);
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch records', details: err.message });
    }
});

// POST a new daily record
app.post('/api/records', async (req, res) => {
    try {
        const { patientId, date, nurse } = req.body;
        const [result] = await db.query(
            'INSERT INTO daily_records (patientId, date, nurse) VALUES (?, ?, ?)',
            [patientId, date, nurse]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create record', details: err.message });
    }
});

// DELETE a daily record
app.delete('/api/records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM daily_records WHERE id = ?', [id]);
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Daily record deleted successfully' });
        } else {
            res.status(404).json({ message: 'Record not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete record', details: err.message });
    }
});


// GET combined hourly data for a specific record
app.get('/api/records/:recordId/chart', async (req, res) => {
    try {
        const { recordId } = req.params;
        const [vitals] = await db.query('SELECT * FROM vital_signs WHERE recordId = ?', [recordId]);
        const [fluids] = await db.query('SELECT * FROM fluid_balance WHERE recordId = ?', [recordId]);
        res.json({ vitals, fluids });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch chart data', details: err.message });
    }
});


// Add a complete hourly entry (vitals and fluids)
app.post('/api/entries', async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { recordId, time, vitals, fluids } = req.body;
        
        await connection.beginTransaction();

        // Insert Vitals
        await connection.query(
            'INSERT INTO vital_signs (recordId, time, temp, hr, rr, o2, bp, map) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [recordId, time, vitals.temp, vitals.hr, vitals.rr, vitals.o2, vitals.bp, vitals.map]
        );
        // Insert Fluids
        await connection.query(
            'INSERT INTO fluid_balance (recordId, time, intakeOral, intakeIv, intakeMeds, outputUrine, outputFeces, outputVomit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [recordId, time, fluids.intakeOral, fluids.intakeIv, fluids.intakeMeds, fluids.outputUrine, fluids.outputFeces, fluids.outputVomit]
        );

        await connection.commit();
        res.status(201).json({ message: 'Entry created successfully' });

    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: 'Failed to create entry', details: err.message });
    } finally {
        connection.release();
    }
});


// **FIXED**: Delete an entire hourly entry (vitals and fluids)
app.delete('/api/entries', async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { recordId, time } = req.body;
        if (!recordId || !time) {
            return res.status(400).json({ error: 'recordId and time are required' });
        }
        
        // Convert the incoming ISO string to a Date object.
        // The mysql2 driver will automatically format this correctly for the DATETIME column.
        const timeAsDateObject = new Date(time);

        await connection.beginTransaction();
        
        await connection.query('DELETE FROM vital_signs WHERE recordId = ? AND time = ?', [recordId, timeAsDateObject]);
        await connection.query('DELETE FROM fluid_balance WHERE recordId = ? AND time = ?', [recordId, timeAsDateObject]);

        await connection.commit();
        res.status(200).json({ message: 'Entry deleted successfully' });

    } catch (err) {
        await connection.rollback();
        console.error("Error during entry deletion:", err); // Added server-side logging
        res.status(500).json({ error: 'Failed to delete entry', details: err.message });
    } finally {
        connection.release();
    }
});


// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});


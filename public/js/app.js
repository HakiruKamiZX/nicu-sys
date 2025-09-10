document.addEventListener('DOMContentLoaded', () => navigateTo('patients'));

const currentState = { page: 'patients', patient: null, record: null };

// --- API Abstraction ---
const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
    }
    if (response.status === 204) return null;
    return response.json();
};

const API = {
    getPatients: () => fetch('/api/patients').then(handleResponse),
    addPatient: (data) => fetch('/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handleResponse),
    deletePatient: (id) => fetch(`/api/patients/${id}`, { method: 'DELETE' }).then(handleResponse),
    getRecordsForPatient: (id) => fetch(`/api/patients/${id}/records`).then(handleResponse),
    addRecord: (data) => fetch('/api/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handleResponse),
    deleteRecord: (id) => fetch(`/api/records/${id}`, { method: 'DELETE' }).then(handleResponse),
    getEntries: (id) => fetch(`/api/records/${id}/entries`).then(handleResponse),
    addEntry: (data) => fetch('/api/entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handleResponse),
    deleteEntry: (data) => fetch('/api/entries', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handleResponse),
};

// --- Navigation ---
function navigateTo(page, data = null) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    currentState.page = page;

    const breadcrumb = document.getElementById('breadcrumb');
    switch (page) {
        case 'patients':
            breadcrumb.textContent = 'Daftar Pasien';
            renderPatientList();
            break;
        case 'daily-records':
            currentState.patient = data;
            breadcrumb.textContent = `Daftar Pasien > ${data.name}`;
            renderDailyRecords();
            break;
        case 'charting':
            currentState.record = data;
            breadcrumb.textContent = `Daftar Pasien > ${currentState.patient.name} > Grafik`;
            renderHourlyChart();
            break;
    }
}

// --- Rendering ---
async function renderPatientList() {
    try {
        const patients = await API.getPatients();
        const tbody = document.getElementById('patient-list-body');
        tbody.innerHTML = '';
        patients.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="p-3">${p.mrn}</td>
                <td class="p-3 font-medium">${p.name}</td>
                <td class="p-3">${p.dob_time ? new Date(p.dob_time).toLocaleDateString() : 'N/A'}</td>
                <td class="p-3 space-x-4">
                    <button onclick='viewDailyRecords(${JSON.stringify(p)})' class="text-blue-600 hover:underline">Lihat Catatan</button>
                    <button onclick='deletePatient(${p.id}, "${p.name}")' class="text-red-600 hover:underline">Hapus</button>
                </td>`;
            tbody.appendChild(tr);
        });
    } catch (error) { alert(`Error: ${error.message}`); }
}

async function renderDailyRecords() {
    try {
        document.getElementById('records-patient-name').textContent = currentState.patient.name;
        const records = await API.getRecordsForPatient(currentState.patient.id);
        const tbody = document.getElementById('daily-records-body');
        tbody.innerHTML = '';
        records.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="p-3 font-medium">${new Date(r.date).toLocaleDateString()}</td>
                <td class="p-3">${r.nurse}</td>
                <td class="p-3 space-x-4">
                    <button onclick='viewCharting(${JSON.stringify(r)})' class="text-blue-600 hover:underline">Lihat Grafik</button>
                    <button onclick='deleteRecord(${r.id}, "${new Date(r.date).toLocaleDateString()}")' class="text-red-600 hover:underline">Hapus</button>
                </td>`;
            tbody.appendChild(tr);
        });
    } catch (error) { alert(`Error: ${error.message}`); }
}

async function renderHourlyChart() {
    try {
        document.getElementById('charting-patient-name').textContent = currentState.patient.name;
        document.getElementById('charting-record-date').textContent = new Date(currentState.record.date).toLocaleDateString();
        const entries = await API.getEntries(currentState.record.id);
        const tbody = document.getElementById('hourly-log-body');
        tbody.innerHTML = '';
        entries.forEach(e => {
            const tr = document.createElement('tr');
            const displayTime = new Date(e.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            tr.innerHTML = `
                <td class="p-3 font-medium">${displayTime}</td>
                <td class="p-3">${e.td_vital || '—'}</td>
                <td class="p-3">${e.map_vital || '—'}</td>
                <td class="p-3">${e.sat_o2 || '—'}</td>
                <td class="p-3">${e.urine || '—'}</td>
                <td class="p-3">${e.vm_mode || '—'}</td>
                <td class="p-3">${e.vm_fio2 || '—'}</td>
                <td class="p-3">
                    <button onclick='deleteEntry("${e.time}")' class="text-red-600 hover:underline">Hapus</button>
                </td>`;
            tbody.appendChild(tr);
        });
        prefillTimeField();
    } catch (error) { alert(`Error: ${error.message}`); }
}

// --- UI Interactions ---
function viewDailyRecords(patient) { navigateTo('daily-records', patient); }
function viewCharting(record) { navigateTo('charting', record); }
function showAddPatientForm() { document.getElementById('add-patient-form-container').classList.remove('hidden'); }
function hideAddPatientForm() { document.getElementById('add-patient-form-container').classList.add('hidden'); }

function prefillTimeField() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    now.setSeconds(0);
    now.setMilliseconds(0);
    document.getElementById('entry-time').value = now.toISOString().slice(0, 16);
}

// --- Data Manipulation ---
document.getElementById('add-patient-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const patientData = {
            name: document.getElementById('nama_pasien').value,
            mrn: document.getElementById('no_mr').value,
            admission_date: document.getElementById('tanggal_masuk').value,
            baby_age: document.getElementById('umur_bayi').value,
            gender: document.getElementById('jenis_kelamin').value,
            diagnosis: document.getElementById('diagnosa_masuk').value,
            delivery_history: document.getElementById('riwayat_persalinan').value,
            gestational_age: document.getElementById('umur_kehamilan').value,
            dob_time: document.getElementById('tgl_jam_lahir').value,
            birth_weight_height: document.getElementById('bb_tb_lahir').value,
            amniotic_fluid_color: document.getElementById('warna_ketuban').value,
            delivery_method: document.getElementById('cara_lahir').value,
            apgar_score: document.getElementById('nilai_apgar').value,
            day_of_care: document.getElementById('hari_rawat').value,
        };
        await API.addPatient(patientData);
        renderPatientList();
        e.target.reset();
        hideAddPatientForm();
    } catch (error) { alert(`Error: ${error.message}`); }
});

async function addDailyRecord() {
    try {
        const nurseName = prompt("Masukkan nama perawat yang bertugas:", "Perawat");
        if (nurseName) {
            await API.addRecord({ patientId: currentState.patient.id, date: new Date().toISOString().slice(0, 10), nurse: nurseName });
            renderDailyRecords();
        }
    } catch (error) { alert(`Error: ${error.message}`); }
}

document.getElementById('hourly-entry-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const entryData = {
            recordId: currentState.record.id,
            time: document.getElementById('entry-time').value,
            by_vital: document.getElementById('by_vital').value,
            ink_vital: document.getElementById('ink_vital').value,
            tk_vital: document.getElementById('tk_vital').value,
            wk_vital: document.getElementById('wk_vital').value,
            apnea: document.getElementById('apnea').value,
            fn_vital: document.getElementById('fn_vital').value,
            fp_vital: document.getElementById('fp_vital').value,
            td_vital: document.getElementById('td_vital').value,
            map_vital: document.getElementById('map_vital').value,
            sat_o2: document.getElementById('sat_o2').value,
            crt_vital: document.getElementById('crt_vital').value,
            vi_vital: document.getElementById('vi_vital').value,
            vita_vital: document.getElementById('vita_vital').value,
            pn_vital: document.getElementById('pn_vital').value,
            ve_vital: document.getElementById('ve_vital').value,
            leak_vital: document.getElementById('leak_vital').value,
            urine: document.getElementById('urine').value,
            feces: document.getElementById('feces').value,
            muntah: document.getElementById('muntah').value,
            mgt: document.getElementById('mgt').value,
            drain: document.getElementById('drain').value,
            iwl: document.getElementById('iwl').value,
            vm_mode: document.getElementById('vm_mode').value,
            vm_rate: document.getElementById('vm_rate').value,
            vm_it: document.getElementById('vm_it').value,
            vm_ie: document.getElementById('vm_ie').value,
            vm_fio2: document.getElementById('vm_fio2').value,
            vm_flow: document.getElementById('vm_flow').value,
            vm_pip: document.getElementById('vm_pip').value,
            vm_peep: document.getElementById('vm_peep').value,
            vm_psv: document.getElementById('vm_psv').value,
            vm_ka: document.getElementById('vm_ka').value,
            vm_ki: document.getElementById('vm_ki').value,
        };
        await API.addEntry(entryData);
        renderHourlyChart();
        e.target.reset();
        prefillTimeField();
    } catch (error) { alert(`Error: ${error.message}`); }
});

async function deletePatient(id, name) {
    if (confirm(`Anda yakin ingin menghapus ${name}? Semua data terkait akan hilang.`)) {
        try { await API.deletePatient(id); renderPatientList(); } catch (error) { alert(`Error: ${error.message}`); }
    }
}

async function deleteRecord(id, date) {
    if (confirm(`Anda yakin ingin menghapus catatan untuk tanggal ${date}?`)) {
        try { await API.deleteRecord(id); renderDailyRecords(); } catch (error) { alert(`Error: ${error.message}`); }
    }
}

async function deleteEntry(timeISO) {
    const displayTime = new Date(timeISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (confirm(`Anda yakin ingin menghapus entri untuk jam ${displayTime}?`)) {
        try {
            await API.deleteEntry({ recordId: currentState.record.id, time: timeISO });
            renderHourlyChart();
        } catch (error) { alert(`Error: ${error.message}`); }
    }
}


document.addEventListener('DOMContentLoaded', () => navigateTo('patients'));

const currentState = { page: 'patients', patient: null, record: null, hourlyEntries: [] };

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
    getPatient: (id) => fetch(`/api/patients/${id}`).then(handleResponse),
    addPatient: (data) => fetch('/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handleResponse),
    updatePatient: (id, data) => fetch(`/api/patients/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handleResponse),
    deletePatient: (id) => fetch(`/api/patients/${id}`, { method: 'DELETE' }).then(handleResponse),
    
    getRecordsForPatient: (id) => fetch(`/api/patients/${id}/records`).then(handleResponse),
    addRecord: (data) => fetch('/api/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handleResponse),
    deleteRecord: (id) => fetch(`/api/records/${id}`, { method: 'DELETE' }).then(handleResponse),
    
    getEntries: (id) => fetch(`/api/records/${id}/entries`).then(handleResponse),
    addEntry: (data) => fetch('/api/entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handleResponse),
    updateEntry: (id, data) => fetch(`/api/entries/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handleResponse),
    deleteEntry: (data) => fetch('/api/entries', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handleResponse),
};

// --- Navigation ---
function navigateTo(page, data = null) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    currentState.page = page;

    const breadcrumb = document.getElementById('breadcrumb');
    switch (page) {
        case 'patients':
            breadcrumb.textContent = 'Daftar Pasien';
            renderPatientList();
            break;
        case 'daily-records':
            currentState.patient = data;
            if (data) {
                breadcrumb.textContent = `Daftar Pasien > ${data.name}`;
            }
            renderDailyRecords();
            break;
        case 'charting':
            currentState.record = data;
            if (currentState.patient) {
                 breadcrumb.textContent = `Daftar Pasien > ${currentState.patient.name} > Grafik`;
            }
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
                <td class="p-3 space-x-2">
                    <button onclick='viewDailyRecords(${JSON.stringify(p)})' class="text-blue-600 hover:underline">Lihat</button>
                    <button onclick='openPatientModal("edit", ${p.id})' class="text-green-600 hover:underline">Edit</button>
                    <button onclick='deletePatient(${p.id}, "${p.name}")' class="text-red-600 hover:underline">Hapus</button>
                </td>`;
            tbody.appendChild(tr);
        });
    } catch (error) { alert(`Error rendering patients: ${error.message}`); }
}

async function renderDailyRecords() {
    try {
        const patientNameEl = document.getElementById('records-patient-name');
        if (patientNameEl && currentState.patient) {
            patientNameEl.textContent = currentState.patient.name;
        }

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
    } catch (error) { alert(`Error rendering records: ${error.message}`); }
}

async function renderHourlyChart() {
    try {
        const patientNameEl = document.getElementById('charting-patient-name');
        const recordDateEl = document.getElementById('charting-record-date');
        if (patientNameEl && currentState.patient) {
            patientNameEl.textContent = currentState.patient.name;
        }
        if (recordDateEl && currentState.record) {
            recordDateEl.textContent = new Date(currentState.record.date).toLocaleDateString();
        }

        const entries = await API.getEntries(currentState.record.id);
        currentState.hourlyEntries = entries;
        const tbody = document.getElementById('hourly-log-body');
        
        // **FIX**: Check if the table body exists before trying to modify it.
        if (!tbody) {
            console.error("Error: Could not find the 'hourly-log-body' element. Is the charting page visible?");
            return;
        }
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
                <td class="p-3 space-x-2">
                    <button onclick='openEntryModal(${e.id})' class="text-green-600 hover:underline">Edit</button>
                    <button onclick='deleteEntry("${e.time}")' class="text-red-600 hover:underline">Hapus</button>
                </td>`;
            tbody.appendChild(tr);
        });
        
        populateAddFormFields();
        prefillTimeField();
    } catch (error) { alert(`Error rendering chart: ${error.message}`); }
}

function populateAddFormFields() {
    const vitalsContainer = document.getElementById('add-entry-vitals-fluids');
    const ventilatorContainer = document.getElementById('add-entry-ventilator');
    
    // **FIX**: Check if form containers exist before modifying them.
    if (!vitalsContainer || !ventilatorContainer) {
        console.error("Error: Could not find hourly entry form containers.");
        return;
    }
    
    vitalsContainer.innerHTML = '';
    ventilatorContainer.innerHTML = '';

    const vitalsFields = ['by_vital', 'ink_vital', 'tk_vital', 'wk_vital', 'apnea', 'fn_vital', 'fp_vital', 'td_vital', 'map_vital', 'sat_o2', 'crt_vital', 'vi_vital', 'vita_vital', 'pn_vital', 've_vital', 'leak_vital', 'urine', 'feces', 'muntah', 'mgt', 'drain', 'iwl'];
    const ventilatorFields = ['vm_mode', 'vm_rate', 'vm_it', 'vm_ie', 'vm_fio2', 'vm_flow', 'vm_pip', 'vm_peep', 'vm_psv', 'vm_ka', 'vm_ki'];

    vitalsFields.forEach(key => {
        vitalsContainer.innerHTML += `<div><label class="block text-sm font-medium">${key.replace('_', ' ').toUpperCase()}</label><input type="text" id="add-${key}" class="mt-1 w-full p-2 border rounded-md"></div>`;
    });
    ventilatorFields.forEach(key => {
        ventilatorContainer.innerHTML += `<div><label class="block text-sm font-medium">${key.replace('vm_', '').toUpperCase()}</label><input type="text" id="add-${key}" class="mt-1 w-full p-2 border rounded-md"></div>`;
    });
}


// --- MODAL & FORM LOGIC ---
const patientModal = document.getElementById('patient-modal');
const patientForm = document.getElementById('patient-form');
const patientModalTitle = document.getElementById('patient-modal-title');

function showAddPatientForm() { openPatientModal('add'); }

async function openPatientModal(mode, id = null) {
    patientForm.reset();
    if (mode === 'add') {
        patientModalTitle.textContent = 'Tambah Pasien Baru';
        document.getElementById('patient-id').value = '';
        patientModal.classList.remove('hidden');
    } else if (mode === 'edit') {
        try {
            const patient = await API.getPatient(id);
            patientModalTitle.textContent = `Edit Pasien: ${patient.name}`;
            document.getElementById('patient-id').value = patient.id;
            
            const formatDate = (dateString) => dateString ? new Date(dateString).toISOString().slice(0, 10) : '';
            const formatDateTime = (dateTimeString) => dateTimeString ? new Date(new Date(dateTimeString).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '';

            document.getElementById('patient-form-nama_pasien').value = patient.name || '';
            document.getElementById('patient-form-no_mr').value = patient.mrn || '';
            document.getElementById('patient-form-tanggal_masuk').value = formatDate(patient.admission_date);
            document.getElementById('patient-form-umur_bayi').value = patient.baby_age || '';
            document.getElementById('patient-form-jenis_kelamin').value = patient.gender || 'Male';
            document.getElementById('patient-form-tgl_jam_lahir').value = formatDateTime(patient.dob_time);
            document.getElementById('patient-form-diagnosa_masuk').value = patient.diagnosis || '';
            document.getElementById('patient-form-riwayat_persalinan').value = patient.delivery_history || '';
            document.getElementById('patient-form-umur_kehamilan').value = patient.gestational_age || '';
            document.getElementById('patient-form-bb_tb_lahir').value = patient.birth_weight_height || '';
            document.getElementById('patient-form-warna_ketuban').value = patient.amniotic_fluid_color || '';
            document.getElementById('patient-form-cara_lahir').value = patient.delivery_method || '';
            document.getElementById('patient-form-nilai_apgar').value = patient.apgar_score || '';
            document.getElementById('patient-form-hari_rawat').value = patient.day_of_care || '';
            
            patientModal.classList.remove('hidden');
        } catch (error) { alert(`Error fetching patient data: ${error.message}`); }
    }
}

function closePatientModal() {
    patientModal.classList.add('hidden');
}

patientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('patient-id').value;
    const patientData = {
        name: document.getElementById('patient-form-nama_pasien').value,
        mrn: document.getElementById('patient-form-no_mr').value,
        admission_date: document.getElementById('patient-form-tanggal_masuk').value,
        baby_age: document.getElementById('patient-form-umur_bayi').value,
        gender: document.getElementById('patient-form-jenis_kelamin').value,
        diagnosis: document.getElementById('patient-form-diagnosa_masuk').value,
        delivery_history: document.getElementById('patient-form-riwayat_persalinan').value,
        gestational_age: document.getElementById('patient-form-umur_kehamilan').value,
        dob_time: document.getElementById('patient-form-tgl_jam_lahir').value,
        birth_weight_height: document.getElementById('patient-form-bb_tb_lahir').value,
        amniotic_fluid_color: document.getElementById('patient-form-warna_ketuban').value,
        delivery_method: document.getElementById('patient-form-cara_lahir').value,
        apgar_score: document.getElementById('patient-form-nilai_apgar').value,
        day_of_care: document.getElementById('patient-form-hari_rawat').value,
    };

    try {
        if (id) { await API.updatePatient(id, patientData); } 
        else { await API.addPatient(patientData); }
        closePatientModal();
        renderPatientList();
    } catch (error) { alert(`Error saving patient: ${error.message}`); }
});


const entryModal = document.getElementById('entry-modal');
const editEntryForm = document.getElementById('edit-entry-form');

async function openEntryModal(entryId) { 
    const entry = currentState.hourlyEntries.find(e => e.id === entryId);
    if (!entry) return;

    document.getElementById('edit-entry-id').value = entry.id;
    
    const timeValue = new Date(new Date(entry.time).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    document.getElementById('edit-entry-time').value = timeValue;

    const vitalsContainer = document.getElementById('edit-entry-vitals-fluids');
    const ventilatorContainer = document.getElementById('edit-entry-ventilator');
    vitalsContainer.innerHTML = '';
    ventilatorContainer.innerHTML = '';

    const vitalsFields = ['by_vital', 'ink_vital', 'tk_vital', 'wk_vital', 'apnea', 'fn_vital', 'fp_vital', 'td_vital', 'map_vital', 'sat_o2', 'crt_vital', 'vi_vital', 'vita_vital', 'pn_vital', 've_vital', 'leak_vital', 'urine', 'feces', 'muntah', 'mgt', 'drain', 'iwl'];
    const ventilatorFields = ['vm_mode', 'vm_rate', 'vm_it', 'vm_ie', 'vm_fio2', 'vm_flow', 'vm_pip', 'vm_peep', 'vm_psv', 'vm_ka', 'vm_ki'];

    vitalsFields.forEach(key => {
        vitalsContainer.innerHTML += `<div><label class="block text-sm font-medium">${key.replace('_', ' ').toUpperCase()}</label><input type="text" id="edit-${key}" value="${entry[key] || ''}" class="mt-1 w-full p-2 border rounded-md"></div>`;
    });
    ventilatorFields.forEach(key => {
        ventilatorContainer.innerHTML += `<div><label class="block text-sm font-medium">${key.replace('vm_', '').toUpperCase()}</label><input type="text" id="edit-${key}" value="${entry[key] || ''}" class="mt-1 w-full p-2 border rounded-md"></div>`;
    });

    entryModal.classList.remove('hidden');
 }
function closeEntryModal() { entryModal.classList.add('hidden'); }


// **FIX**: Memperbaiki logika pengumpulan data formulir untuk mencegah error
const allFields = [
    'by_vital', 'ink_vital', 'tk_vital', 'wk_vital', 'apnea', 'fn_vital', 'fp_vital', 'td_vital', 'map_vital', 'sat_o2', 'crt_vital', 'vi_vital', 'vita_vital', 'pn_vital', 've_vital', 'leak_vital', 'urine', 'feces', 'muntah', 'mgt', 'drain', 'iwl',
    'vm_mode', 'vm_rate', 'vm_it', 'vm_ie', 'vm_fio2', 'vm_flow', 'vm_pip', 'vm_peep', 'vm_psv', 'vm_ka', 'vm_ki'
];

document.getElementById('hourly-entry-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const entryData = {
            recordId: currentState.record.id,
            time: document.getElementById('entry-time').value,
        };
        
        allFields.forEach(key => {
            const element = document.getElementById(`add-${key}`);
            // Cek jika elemen ada sebelum mengambil nilainya
            entryData[key] = element ? element.value : null;
        });

        await API.addEntry(entryData);
        renderHourlyChart();
        e.target.reset();
        prefillTimeField();
    } catch (error) { alert(`Error submitting entry: ${error.message}`); }
});


editEntryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-entry-id').value;
    const entryData = {
        time: document.getElementById('edit-entry-time').value,
    };

    allFields.forEach(key => {
        const element = document.getElementById(`edit-${key}`);
        // Cek jika elemen ada sebelum mengambil nilainya
        entryData[key] = element ? element.value : null;
    });

    try {
        await API.updateEntry(id, entryData);
        closeEntryModal();
        renderHourlyChart();
    } catch (error) { alert(`Error saving entry: ${error.message}`); }
});


// --- Sisa fungsi (add, delete, dll.) ---
function viewDailyRecords(patient) { navigateTo('daily-records', patient); }
function viewCharting(record) { navigateTo('charting', record); }

function prefillTimeField() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    now.setSeconds(0);
    now.setMilliseconds(0);
    document.getElementById('entry-time').value = now.toISOString().slice(0, 16);
}

async function addDailyRecord() {
    try {
        const nurseName = prompt("Masukkan nama perawat yang bertugas:", "Perawat");
        if (nurseName) {
            await API.addRecord({ patientId: currentState.patient.id, date: new Date().toISOString().slice(0, 10), nurse: nurseName });
            renderDailyRecords();
        }
    } catch (error) { alert(`Error: ${error.message}`); }
}

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


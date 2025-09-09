document.addEventListener('DOMContentLoaded', () => {
    navigateTo('patients');
});

// --- STATE MANAGEMENT ---
const currentState = {
    page: 'patients',
    patient: null,
    record: null,
};

// --- API Abstraction ---

// NEW: A more robust way to handle API responses, including empty ones.
const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    // For DELETE requests that might not return a body
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null;
    }
    return response.json();
};

const API = {
    getPatients: () => fetch('/api/patients').then(handleResponse),
    addPatient: (patientData) => fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
    }).then(handleResponse),
    deletePatient: (patientId) => fetch(`/api/patients/${patientId}`, { method: 'DELETE' }).then(handleResponse),
    
    getRecordsForPatient: (patientId) => fetch(`/api/patients/${patientId}/records`).then(handleResponse),
    addRecord: (recordData) => fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
    }).then(handleResponse),
    deleteRecord: (recordId) => fetch(`/api/records/${recordId}`, { method: 'DELETE' }).then(handleResponse),

    getChartData: (recordId) => fetch(`/api/records/${recordId}/chart`).then(handleResponse),
    
    addEntry: (entryData) => fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
    }).then(handleResponse),

    deleteEntry: (deleteData) => fetch('/api/entries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deleteData)
    }).then(handleResponse),
};

// --- NAVIGATION ---
function navigateTo(page, data = null) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    currentState.page = page;

    const breadcrumb = document.getElementById('breadcrumb');

    switch (page) {
        case 'patients':
            breadcrumb.textContent = 'Patient List';
            renderPatientList();
            break;
        case 'daily-records':
            currentState.patient = data;
            breadcrumb.textContent = `Patient List > ${data.name}`;
            renderDailyRecords();
            break;
        case 'charting':
            currentState.record = data;
            breadcrumb.textContent = `Patient List > ${currentState.patient.name} > Chart`;
            renderHourlyChart();
            break;
    }
}

// --- RENDERING FUNCTIONS ---
async function renderPatientList() {
    try {
        const patients = await API.getPatients();
        const tbody = document.getElementById('patient-list-body');
        tbody.innerHTML = '';
        patients.forEach(p => {
            const tr = document.createElement('tr');
            tr.className = 'border-b hover:bg-gray-50';
            tr.innerHTML = `
                <td class="p-3">${p.mrn}</td>
                <td class="p-3 font-medium">${p.name}</td>
                <td class="p-3">${new Date(p.dob).toLocaleDateString()}</td>
                <td class="p-3 space-x-4">
                    <button onclick='viewDailyRecords(${JSON.stringify(p)})' class="text-blue-600 hover:underline">View Records</button>
                    <button onclick='deletePatient(${p.id}, "${p.name}")' class="text-red-600 hover:underline">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        alert(`Error fetching patients: ${error.message}`);
    }
}

async function renderDailyRecords() {
    try {
        document.getElementById('records-patient-name').textContent = currentState.patient.name;
        const records = await API.getRecordsForPatient(currentState.patient.id);
        const tbody = document.getElementById('daily-records-body');
        tbody.innerHTML = '';
        records.forEach(r => {
            const tr = document.createElement('tr');
            tr.className = 'border-b hover:bg-gray-50';
            tr.innerHTML = `
                <td class="p-3 font-medium">${new Date(r.date).toLocaleDateString()}</td>
                <td class="p-3">${r.nurse}</td>
                <td class="p-3 space-x-4">
                    <button onclick='viewCharting(${JSON.stringify(r)})' class="text-blue-600 hover:underline">View Chart</button>
                    <button onclick='deleteRecord(${r.id}, "${new Date(r.date).toLocaleDateString()}")' class="text-red-600 hover:underline">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        alert(`Error fetching records: ${error.message}`);
    }
}

async function renderHourlyChart() {
    try {
        document.getElementById('charting-patient-name').textContent = currentState.patient.name;
        document.getElementById('charting-record-date').textContent = new Date(currentState.record.date).toLocaleDateString();

        const { vitals, fluids } = await API.getChartData(currentState.record.id);
        const tbody = document.getElementById('hourly-log-body');
        tbody.innerHTML = '';

        const chartData = {};
        [...vitals, ...fluids].forEach(item => {
            const timeKey = new Date(item.time).toISOString();
            if (!chartData[timeKey]) chartData[timeKey] = {};
            Object.assign(chartData[timeKey], item);
        });

        const sortedTimes = Object.keys(chartData).sort((a, b) => new Date(b) - new Date(a));

        if (sortedTimes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="p-3 text-center text-gray-500">No hourly entries for this date.</td></tr>`;
            return;
        }

        sortedTimes.forEach(timeISO => {
            const data = chartData[timeISO];
            const tr = document.createElement('tr');
            tr.className = 'border-b';
            const displayTime = new Date(timeISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            tr.innerHTML = `
                <td class="p-3 font-medium">${displayTime}</td>
                <td class="p-3">${data.temp || '—'}</td>
                <td class="p-3">${data.hr || '—'}</td>
                <td class="p-3">${data.rr || '—'}</td>
                <td class="p-3">${data.o2 || '—'}</td>
                <td class="p-3">${data.intakeOral || '—'}</td>
                <td class="p-3">${data.intakeIv || '—'}</td>
                <td class="p-3">${data.outputUrine || '—'}</td>
                <td class="p-3">
                    <button onclick='deleteEntry("${timeISO}")' class="text-red-600 hover:underline">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        prefillTimeField();
    } catch (error) {
        alert(`Error rendering chart: ${error.message}`);
    }
}


// --- UI INTERACTIONS ---
function viewDailyRecords(patient) { navigateTo('daily-records', patient); }
function viewCharting(record) { navigateTo('charting', record); }

function showAddPatientForm() { document.getElementById('add-patient-form-container').classList.remove('hidden'); }
function hideAddPatientForm() { document.getElementById('add-patient-form-container').classList.add('hidden'); }

function prefillTimeField() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    now.setSeconds(0);
    now.setMilliseconds(0);
    const localIsoString = now.toISOString().slice(0, 16);
    document.getElementById('entry-time').value = localIsoString;
}

// --- DATA MANIPULATION ---
document.getElementById('add-patient-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const patientData = {
            name: document.getElementById('patient-name').value,
            mrn: document.getElementById('mrn').value,
            dob: document.getElementById('dob').value,
            gender: document.getElementById('gender').value,
            diagnosis: document.getElementById('diagnosis').value,
        };
        await API.addPatient(patientData);
        renderPatientList();
        e.target.reset();
        hideAddPatientForm();
    } catch (error) {
        alert(`Error adding patient: ${error.message}`);
    }
});

async function addDailyRecord() {
    try {
        const nurseName = prompt("Enter the nurse's name for today's record:", "Nurse");
        if (nurseName) {
            const recordData = {
                patientId: currentState.patient.id,
                date: new Date().toISOString().slice(0, 10),
                nurse: nurseName,
            };
            await API.addRecord(recordData);
            renderDailyRecords();
        }
    } catch (error) {
        alert(`Error adding record: ${error.message}`);
    }
}

document.getElementById('hourly-entry-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const entryData = {
            recordId: currentState.record.id,
            time: document.getElementById('entry-time').value,
            vitals: {
                temp: document.getElementById('temperature').value || null,
                hr: document.getElementById('heart-rate').value || null,
                rr: document.getElementById('resp-rate').value || null,
                o2: document.getElementById('sat-o2').value || null,
                bp: document.getElementById('bp').value || null,
                map: document.getElementById('map').value || null,
            },
            fluids: {
                intakeOral: document.getElementById('intake-oral').value || null,
                intakeIv: document.getElementById('intake-iv').value || null,
                intakeMeds: document.getElementById('intake-meds').value || null,
                outputUrine: document.getElementById('output-urine').value || null,
                outputFeces: document.getElementById('output-feces').value || null,
                outputVomit: document.getElementById('output-vomit').value || null,
            }
        };

        await API.addEntry(entryData);
        renderHourlyChart();
        e.target.reset();
        prefillTimeField();
    } catch (error) {
        alert(`Error adding entry: ${error.message}`);
    }
});


async function deletePatient(patientId, patientName) {
    if (confirm(`Are you sure you want to permanently delete ${patientName} and all of their records? This action cannot be undone.`)) {
        try {
            await API.deletePatient(patientId);
            renderPatientList();
        } catch(error) {
            alert(`Error deleting patient: ${error.message}`);
        }
    }
}

async function deleteRecord(recordId, recordDate) {
    if (confirm(`Are you sure you want to delete the record for ${recordDate}? All hourly data for this day will be lost.`)) {
        try {
            await API.deleteRecord(recordId);
            renderDailyRecords();
        } catch (error) {
            alert(`Error deleting record: ${error.message}`);
        }
    }
}

// FIXED: This function now works correctly
async function deleteEntry(timeISOString) {
    const displayTime = new Date(timeISOString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (confirm(`Are you sure you want to delete all entries for ${displayTime}?`)) {
        const deleteData = {
            recordId: currentState.record.id,
            time: timeISOString
        };
        
        try {
            await API.deleteEntry(deleteData);
            renderHourlyChart(); // Refresh the log to show the deletion
        } catch (error) {
            console.error('Failed to delete entry:', error);
            alert(`Could not delete the entry: ${error.message}`);
        }
    }
}


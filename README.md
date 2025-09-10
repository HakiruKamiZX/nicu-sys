# NICU Charting Web Application Setup

This project is a full-stack web application for managing NICU patient data. It consists of a Node.js/Express backend that connects to a MySQL database and a plain HTML, CSS, and JavaScript frontend.

1. Project Structure
* package.json: Lists the project dependencies.
* server.js: The main backend server file.
* db.js: Handles the MySQL database connection and queries.
* .env: Stores your database credentials (you need to create this file).
* public/: The folder containing all frontend files.
* index.html: The main application page (UI).
* js/app.js: The frontend JavaScript logic.

2. Setup and Installation
* Step 1: Install Node.js
    Ensure you have Node.js installed on your system. You can download it from nodejs.org.

* Step 2: Download Project Files & Install Dependencies
    Save all the files from this project into a new folder on your computer.

    Open a terminal or command prompt in that folder.

Run the following command to install the necessary libraries (Express, mysql2, etc.):

```
npm install
```

* Step 3: Set Up the Database
    Make sure your MySQL server is running.

    Use the CREATE TABLE scripts provided in the earlier conversation to create the patients, daily_records, vital_signs, and fluid_balance tables in your database.

* Step 4: Configure Environment Variables
    In the project's root folder, create a new file named .env.

    Open the .env file and add your MySQL connection details. Replace the placeholder values with your actual database credentials.

```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_DATABASE=your_database_name
```

* Step 5: Run the Application
    In your terminal (still in the project folder), run this command to start the server:

```
node server.js
```

You should see a message like Server running on http://localhost:3000.

Open your web browser and go to http://localhost:3000. You should now see the NICU Charting application, fully connected to your database!

---

# SQL Database setup

1. Create schema called "data_nicu"
2. Set the schema as the default and execute the sql script below

```sql
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mrn VARCHAR(50) UNIQUE NOT NULL,
    admission_date DATE,
    baby_age VARCHAR(100),
    gender ENUM('Male', 'Female', 'Other'),
    diagnosis TEXT,
    delivery_history TEXT,
    gestational_age VARCHAR(100),
    dob_time DATETIME,
    birth_weight_height VARCHAR(100),
    amniotic_fluid_color VARCHAR(100),
    delivery_method VARCHAR(100),
    apgar_score VARCHAR(50),
    day_of_care INT
);

-- 2. Tabel Catatan Harian (tidak berubah)
CREATE TABLE daily_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patientId INT,
    date DATE NOT NULL,
    nurse VARCHAR(255),
    FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
);

-- 3. Tabel Entri Per Jam (Tabel BARU untuk semua data per jam)
CREATE TABLE hourly_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recordId INT,
    time DATETIME NOT NULL,
    
    -- Tanda Vital & Cairan
    by_vital VARCHAR(50),
    ink_vital VARCHAR(50),
    tk_vital VARCHAR(50),
    wk_vital VARCHAR(50),
    apnea VARCHAR(50),
    fn_vital VARCHAR(50),
    fp_vital VARCHAR(50),
    td_vital VARCHAR(50),
    map_vital VARCHAR(50),
    sat_o2 VARCHAR(50),
    crt_vital VARCHAR(50),
    vi_vital VARCHAR(50),
    vita_vital VARCHAR(50),
    pn_vital VARCHAR(50),
    ve_vital VARCHAR(50),
    leak_vital VARCHAR(50),
    urine DECIMAL(7,2),
    feces DECIMAL(7,2),
    muntah DECIMAL(7,2),
    mgt DECIMAL(7,2),
    drain DECIMAL(7,2),
    iwl DECIMAL(7,2),

    -- Ventilasi Mesin
    vm_mode VARCHAR(50),
    vm_rate VARCHAR(50),
    vm_it VARCHAR(50),
    vm_ie VARCHAR(50),
    vm_fio2 VARCHAR(50),
    vm_flow VARCHAR(50),
    vm_pip VARCHAR(50),
    vm_peep VARCHAR(50),
    vm_psv VARCHAR(50),
    vm_ka VARCHAR(50),
    vm_ki VARCHAR(50),

    FOREIGN KEY (recordId) REFERENCES daily_records(id) ON DELETE CASCADE,
    UNIQUE KEY unique_entry_time (recordId, time)
);
```

3. Refresh the database and make sure all the tables are correct

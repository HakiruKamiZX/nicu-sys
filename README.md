NICU Charting Web Application
This project is a full-stack web application for managing NICU patient data. It consists of a Node.js/Express backend that connects to a MySQL database and a plain HTML, CSS, and JavaScript frontend.

1. Project Structure
⋅⋅⋅⋅* package.json: Lists the project dependencies.

⋅⋅⋅⋅* server.js: The main backend server file.

⋅⋅⋅⋅* db.js: Handles the MySQL database connection and queries.

⋅⋅⋅⋅* .env: Stores your database credentials (you need to create this file).

⋅⋅⋅⋅* public/: The folder containing all frontend files.

⋅⋅⋅⋅* index.html: The main application page (UI).

⋅⋅⋅⋅* js/app.js: The frontend JavaScript logic.

Setup and Installation
Step 1: Install Node.js
Ensure you have Node.js installed on your system. You can download it from nodejs.org.

Step 2: Download Project Files & Install Dependencies
Save all the files from this project into a new folder on your computer.

Open a terminal or command prompt in that folder.

Run the following command to install the necessary libraries (Express, mysql2, etc.):

npm install

Step 3: Set Up the Database
Make sure your MySQL server is running.

Use the CREATE TABLE scripts provided in the earlier conversation to create the patients, daily_records, vital_signs, and fluid_balance tables in your database.

Step 4: Configure Environment Variables
In the project's root folder, create a new file named .env.

Open the .env file and add your MySQL connection details. Replace the placeholder values with your actual database credentials.

```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_DATABASE=your_database_name
```

Step 5: Run the Application
In your terminal (still in the project folder), run this command to start the server:

node server.js

You should see a message like Server running on http://localhost:3000.

Open your web browser and go to http://localhost:3000. You should now see the NICU Charting application, fully connected to your database!
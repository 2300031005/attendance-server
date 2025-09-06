// 1. Import necessary libraries
const express = require('express');
const fs = require('fs');

// 2. Initialize the Express application
const app = express();
const PORT = process.env.PORT || 10000;

// 3. Middleware
// This middleware is for the original single-scan JSON endpoint
app.use(express.json());
// >> ADD THIS MIDDLEWARE <<
// This is for the new batch-sync endpoint, which receives plain text
app.use(express.text());


// 4. Endpoint for a single, online scan (still useful for testing)
app.post('/api/mark-attendance', (req, res) => {
  const { uid } = req.body;
  if (!uid) {
    return res.status(400).send('Error: UID is required.');
  }
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const logEntry = `${uid},${timestamp}\n`;
  console.log(`Received SINGLE UID: ${uid}. Logging entry to file.`);
  fs.appendFile('attendance_log.csv', logEntry, (err) => {
    if (err) {
      console.error('ERROR: Failed to write to log file:', err);
      return res.status(500).send('Server error: Failed to log attendance.');
    }
    console.log("Successfully wrote to attendance_log.csv");
    res.status(200).send('Success: Attendance marked.');
  });
});

// =================================================================
// >> ADD THIS ENTIRE NEW ENDPOINT FOR OFFLINE SYNCING <<
// =================================================================
app.post('/api/sync-logs', (req, res) => {
  // The raw CSV data is in the request body because we used app.use(express.text())
  const offlineLogs = req.body;

  if (!offlineLogs || offlineLogs.length === 0) {
    return res.status(400).send('Error: No log data received for sync.');
  }

  console.log("--- Received a BATCH of offline logs to sync ---");
  // We add an extra newline to ensure separation from other logs
  const dataToAppend = offlineLogs.trim() + '\n';

  // Append the entire block of offline logs to our main log file
  fs.appendFile('attendance_log.csv', dataToAppend, (err) => {
    if (err) {
      console.error('ERROR: Failed to write synced logs to file:', err);
      return res.status(500).send('Server error: Failed to save synced logs.');
    }

    console.log("Successfully synced and saved offline logs.");
    // Sending a 200 OK tells the ESP8266 it is safe to delete its local file
    res.status(200).send('Success: Offline logs synced.');
  });
});


// 5. Root URL, view logs, and server start (no changes needed here)
app.get('/', (req, res) => {
  res.send('RFID Attendance Server (Offline Sync Ready) is online.');
});

app.get('/api/get-attendance', (req, res) => {
  fs.readFile('attendance_log.csv', 'utf8', (err, data) => {
    if (err) {
      return res.status(404).send('No attendance has been logged yet.');
    }
    res.type('text/plain');
    res.send(data);
  });
});

app.listen(PORT, () => {
  console.log(`Server is now listening on port ${PORT}`);
});


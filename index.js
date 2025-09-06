// 1. Import necessary libraries
const express = require('express');
const fs = require('fs');

// 2. Initialize the Express application
const app = express();
const PORT = process.env.PORT || 10000;

// 3. Middleware
app.use(express.json());   // For handling single JSON records
app.use(express.text());   // For handling batch text/csv syncs

// =================================================================
// >> THIS ENDPOINT IS NOW IMPROVED TO ACCEPT A TIMESTAMP <<
// =================================================================
app.post('/api/mark-attendance', (req, res) => {
  // Try to parse the body as JSON. If it fails, something is wrong.
  let payload;
  try {
    // If the request was text, we might need to parse it manually
    payload = (typeof req.body === 'string') ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).send('Error: Invalid JSON format.');
  }

  const { uid, timestamp } = payload;

  if (!uid) {
    return res.status(400).send('Error: UID is required.');
  }

  // Use the timestamp from the device if provided, otherwise generate one.
  const finalTimestamp = timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const logEntry = `${uid},${finalTimestamp}\n`;
  
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

// Endpoint for offline batch syncing (no changes needed)
app.post('/api/sync-logs', (req, res) => {
  const offlineLogs = req.body;
  if (!offlineLogs || offlineLogs.length === 0) {
    return res.status(400).send('Error: No log data received for sync.');
  }
  console.log("--- Received a BATCH of offline logs to sync ---");
  const dataToAppend = offlineLogs.trim() + '\n';
  fs.appendFile('attendance_log.csv', dataToAppend, (err) => {
    if (err) {
      console.error('ERROR: Failed to write synced logs to file:', err);
      return res.status(500).send('Server error: Failed to save synced logs.');
    }
    console.log("Successfully synced and saved offline logs.");
    res.status(200).send('Success: Offline logs synced.');
  });
});

// Root URL and viewing endpoint (no changes needed)
app.get('/', (req, res) => {
  res.send('RFID Attendance Server (Final Version) is online.');
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

// 1. Import necessary libraries
// 'express' is for creating the web server.
// 'fs' (File System) is for writing the attendance data to a file.
const express = require('express');
const fs = require('fs');

// 2. Initialize the Express application
const app = express();
// Use the port provided by the hosting service (like Render), or default to 3000 for local testing
const PORT = process.env.PORT || 3000; 

// 3. Middleware to parse incoming JSON data from the ESP8266
// This line is crucial. It tells Express how to understand the {"uid":"..."} data we will send.
app.use(express.json());

// 4. Define the API endpoint that the ESP8266 will send data to
app.post('/api/mark-attendance', (req, res) => {
  // Extract the UID from the body of the incoming request
  const { uid } = req.body; 

  // Basic validation: Check if a UID was actually sent
  if (!uid) {
    console.log("Received a request with no UID.");
    return res.status(400).send('Error: UID is required.');
  }

  // Get the current timestamp. We specify the time zone for India (Asia/Kolkata).
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  
  // Format the data as a single line for the CSV file: "CARD_UID,DATE,TIME"
  const logEntry = `${uid},${timestamp}\n`;
  
  console.log(`Received UID: ${uid}. Logging entry to file.`);

  // Append the new entry to the 'attendance_log.csv' file.
  // The 'a' flag means "append", so we add to the end of the file instead of overwriting it.
  fs.appendFile('attendance_log.csv', logEntry, (err) => {
    if (err) {
      console.error('ERROR: Failed to write to log file:', err);
      // If there was an error saving the file, send an error response back to the ESP8266
      return res.status(500).send('Server error: Failed to log attendance.');
    }
    
    // If everything worked, send a success message back to the ESP8266
    console.log("Successfully wrote to attendance_log.csv");
    res.status(200).send('Success: Attendance marked.');
  });
});

// 5. Add a simple welcome message for the root URL
// This helps you check if the server is running by visiting the URL in a web browser.
app.get('/', (req, res) => {
    res.send('RFID Attendance Server is online and running.');
});


// 6. Start the server and make it listen for incoming requests on the specified port
app.listen(PORT, () => {
  console.log(`Server is now listening on port ${PORT}`);
});


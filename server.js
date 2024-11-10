const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb+srv://sourodip:rajghosh@first.ff1ia.mongodb.net/first?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});

const User = mongoose.model('User', userSchema, "login");

const recordSchema = new mongoose.Schema({
    serialNo: Number,
    state: String,
    spocFromMikids: String,
    modeOfEnquiry: String,
    schoolName: String,
    board: String,
    district: String,
    area: String,
    totalStrength: String,
    principalName: String,
    contactNumber: String,
    schoolSpoc: String,
    spocContactNumber: String,
    demoGivenTo: String,
    demoGivenDate: Date,
    followUpDate: Date,
    remarksStatus: String,
    infrastructure: String,
    teachersQuality: String,
    signedFor: String,
    signedAt: { type: Date, default: Date.now }
});
const Record = mongoose.model('Record', recordSchema, 'recrds');


// const dashSchema = new mongoose.Schema({
//     dates: Date,
//     totalSchoolsVisited: Number,
//     interested: Number,
//     pdDone: Number,
//     pdFixed: Number,
//     tdDone: Number,
//     tdFixed: Number,
//     smdDone: Number,
//     smdFixed: Number,
//     signUpFollowUp: Number,
//     signed: Number,
//     totalSchoolsForSignUp: Number,
//     strength: Number,
// });
// const Dash = mongoose.model('Dash', dashSchema, 'dash');

const dashSchema = new mongoose.Schema({
    dates: Date,
    totalSchoolsVisited: Number,
    interested: Number,
    pdDone: Number,
    pdFixed: Number,
    tdDone: Number,
    tdFixed: Number,
    smdDone: Number,
    smdFixed: Number,
    signUpFollowUp: Number,
    signed: Number,
    totalSchoolsForSignUp: Number,
    strength: Number,
});

const Dash = mongoose.model('Dash', dashSchema, 'dash');

// Endpoint to fetch report data
app.get('/fetch', async (req, res) => {
    try {
        const reports = await Dash.find();
        res.json(reports);
    } catch (err) {
        res.status(500).send(err);
    }
});
const EventSchema = new mongoose.Schema({
    title: String,
    date: String,
    desc: String
  });
  
  const Event = mongoose.model('Event', EventSchema);
  
  // Get events by date
  app.get('/events', async (req, res) => {
    const { day, month, year } = req.query;
    const events = await Event.find({ day, month, year });
    res.send(events);
  });
  
  app.post('/events', async (req, res) => {
    const event = new Event(req.body);
    await event.save();
    res.send(event);
  });
  
  app.delete('/events', async (req, res) => {
    const { day, month, year, title } = req.body;
    await Event.deleteOne({ day, month, year, title });
    res.send({ success: true });
  });

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        let user = await User.findOne({ username });

        if (user) {
            if (user.password === password) {
                return res.json({ success: true, message: 'Login successful' });
            } else {
                return res.status(401).json({ success: false, message: 'Incorrect password' });
            }
        } else {
            user = new User({ username, password });
            await user.save();
            return res.json({ success: true, message: 'User registered and logged in' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/submit', async (req, res) => {
    try {
        const record = new Record(req.body);
        await record.save();
        return res.status(200).json({ message: 'Record submitted successfully!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error submitting record.' });
    }
});

app.get('/fetch', async (req, res) => {
    try {
        const data = await Record.find();
        return res.status(200).json(data);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error fetching data.' });
    }
});

// Serve HTML files for specific routes
app.get('/', (req, res) => {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/record.html', (req, res) => {
    return res.sendFile(path.join(__dirname, 'public', 'record.html'));
});

app.get('/show.html', (req, res) => {
    return res.sendFile(path.join(__dirname, 'public', 'show.html'));
});
app.get('/report_display.html', (req, res) => {
    return res.sendFile(path.join(__dirname, 'public', 'report_display.html'));
});
app.get('/report_form.html', (req, res) => {
    return res.sendFile(path.join(__dirname, 'public', 'report_form.html'));
});
app.get('/dashboard.html', (req, res) => {
    return res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});




const http = require("http");
const socketio = require("socket.io");
const path = require("path");
const server = http.createServer(app);
const io = socketio(server);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", function (socket) {
  console.log(`User connected: ${socket.id}`);
  socket.on("send-location", function (data) {
    console.log(
      `Location received from ${socket.id}: ${data.latitude}, ${data.longitude}`
    );
    io.emit("receive-location", { id: socket.id, ...data });
  });

  socket.on("disconnect", function () {
    console.log(`User disconnected: ${socket.id}`);
    io.emit("user-disconnected", socket.id);
  });
});

app.get("/", function (req, res) {
  res.render("index");
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});


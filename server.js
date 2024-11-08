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

const EventSchema = new mongoose.Schema({
    title: String,
    date: String,
    desc: String
  });
  
  const Event = mongoose.model('Event', EventSchema, 'calendar');
  
  // Get events by date
  app.get('/events', async (req, res) => {
    const { date } = req.query;
    const events = await db.collection('events').find({ date }).toArray();
    res.json(events);
  });
  
  app.post('/events', async (req, res) => {
    const { title, date, desc } = req.body;
    const event = { title, date, desc };
    await db.collection('events').insertOne(event);
    res.json(event);
  });
  
  app.delete('/events', async (req, res) => {
    const { id } = req.body;
    await db.collection('events').deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

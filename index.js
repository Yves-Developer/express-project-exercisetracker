const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express()
require('dotenv').config()

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const User = require('./models/User');
const Exercise = require('./models/Exercise');

// Create User
app.post('/api/users', async (req, res) => {
  const user = new User({ username: req.body.username });
  await user.save();
  res.json({ username: user.username, _id: user._id });
});

// Get All Users
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username _id');
  res.json(users);
});

// Add Exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const user = await User.findById(req.params._id);
  if (!user) return res.send('User not found');

  const { description, duration, date } = req.body;
  const exercise = new Exercise({
    userId: user._id,
    description,
    duration: parseInt(duration),
    date: date ? new Date(date) : new Date()
  });

  await exercise.save();

  res.json({
    _id: user._id,
    username: user.username,
    date: exercise.date.toDateString(),
    duration: exercise.duration,
    description: exercise.description
  });
});
//Get all user
app.get('/api/users/:_id/logs', async (req, res) => {

  const { from, to, limit } = req.query;
  const _id = req.params._id;

  try {
      const userDoc = await User.findById(_id);

      let dateObj = {};
      let filter = { user_id: _id };

      if (from) {
          dateObj['$gte'] = new Date(from)
      }
      if (to) {
          dateObj['$lte'] = new Date(to);
      }

      if (from || to) {
          filter['date'] = dateObj;
      }

      const exercises = await Exercise.find(filter).limit(limit ? +limit : 20);

      const log = exercises.map((e) => {
          return {
              description: e.description,
              duration: e.duration,
              date: new Date(e.date).toDateString()
          }
      })

      res.json({
          username: userDoc.username,
          count: exercises.length,
          _id,
          log
      });
  } catch (error) {
      res.json(error);
  }
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

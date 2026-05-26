const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Course = require('../models/Course');
const Worker = require('../models/Worker');
const ScheduleSlot = require('../models/ScheduleSlot');
const User = require('../models/User');
const Request = require('../models/Request');

// Get all data (for initial load)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Course, as: 'courses' }]
    });

    const workers = await Worker.findAll();

    const slots = await ScheduleSlot.findAll({
      include: [{
        model: Worker,
        as: 'workers',
        through: { attributes: ['evaluation'] }
      }]
    });

    // Map schedules back to the course-indexed format expected by frontend
    const schedules = {};
    slots.forEach(slot => {
      if (!schedules[slot.courseId]) schedules[slot.courseId] = [];

      const slotJson = slot.toJSON();
      // Rename workers to enrolled for compatibility, and include evaluation
      const enrolledList = slotJson.workers || slotJson.Workers || [];
      slotJson.enrolled = enrolledList.map(w => ({
        id: w.id,
        evaluation: w.Enrollment?.evaluation || 'pending'
      }));
      delete slotJson.workers;
      delete slotJson.Workers;

      schedules[slot.courseId].push(slotJson);
    });

    const users = await User.findAll();
    const requests = await Request.findAll();

    res.json({
      categories,
      workers,
      schedules,
      users,
      requests
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read database' });
  }
});

module.exports = router;

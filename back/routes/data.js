const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Course = require('../models/Course');
const ScheduleSlot = require('../models/ScheduleSlot');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Request = require('../models/Request');

// Get all data (for initial load)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Course, as: 'courses' }]
    });

    const slots = await ScheduleSlot.findAll({
      include: [{ model: Enrollment, as: 'enrollments' }]
    });

    // Map schedules back to the course-indexed format expected by frontend
    const schedules = {};
    slots.forEach(slot => {
      if (!schedules[slot.courseId]) schedules[slot.courseId] = [];

      const slotJson = slot.toJSON();
      const enrollments = slotJson.enrollments || [];
      slotJson.enrolled = enrollments.map(e => ({
        id: e.workerId,
        name: e.workerName,
        rut: e.workerRut,
        cargo: e.workerCargo,
        contractor: e.contractor,
        evaluation: e.evaluation || 'pending',
        evaluationDate: e.updatedAt ? new Date(e.updatedAt).toLocaleDateString() : ''
      }));
      delete slotJson.enrollments;

      schedules[slot.courseId].push(slotJson);
    });

    const users = await User.findAll();
    const requests = await Request.findAll();

    res.json({
      categories,
      workers: [], // Empty array since workers are read from external source
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

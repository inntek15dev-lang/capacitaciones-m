const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// Create course
router.post('/', async (req, res) => {
  try {
    const { categoryId, name, maxPerSlot, niv_id, plantaNombre } = req.body;

    const newId = `c${Date.now()}`;
    const newCourse = await Course.create({
      id: newId,
      name,
      maxPerSlot: parseInt(maxPerSlot, 10) || 0,
      categoryId,
      niv_id: niv_id ? parseInt(niv_id, 10) : null,
      plantaNombre
    });

    res.json({ success: true, course: newCourse });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, name, maxPerSlot, niv_id, plantaNombre } = req.body;

    const course = await Course.findByPk(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    await course.update({
      name: name !== undefined ? name : course.name,
      maxPerSlot: maxPerSlot !== undefined ? parseInt(maxPerSlot, 10) : course.maxPerSlot,
      categoryId: categoryId || course.categoryId,
      niv_id: niv_id !== undefined ? (niv_id ? parseInt(niv_id, 10) : null) : course.niv_id,
      plantaNombre: plantaNombre !== undefined ? plantaNombre : course.plantaNombre
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Course.destroy({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

module.exports = router;

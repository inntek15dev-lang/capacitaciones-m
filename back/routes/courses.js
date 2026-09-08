const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// Create course
router.post('/', async (req, res) => {
  try {
    const { categoryId, name, maxPerSlot, niv_id, plantaNombre } = req.body;

    const newId = `c${Date.now()}`;
    const cleanNivId = (niv_id && String(niv_id) !== 'SIN-PLANTA') ? parseInt(niv_id, 10) : null;
    const cleanPlantaNombre = cleanNivId ? (plantaNombre || 'SIN-PLANTA') : 'SIN-PLANTA';

    const newCourse = await Course.create({
      id: newId,
      name,
      maxPerSlot: parseInt(maxPerSlot, 10) || 0,
      categoryId,
      niv_id: cleanNivId,
      plantaNombre: cleanPlantaNombre
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

    let updatedNivId = course.niv_id;
    let updatedPlantaNombre = course.plantaNombre;

    if (niv_id !== undefined) {
      updatedNivId = (niv_id && String(niv_id) !== 'SIN-PLANTA') ? parseInt(niv_id, 10) : null;
    }
    if (plantaNombre !== undefined || niv_id !== undefined) {
      updatedPlantaNombre = updatedNivId ? (plantaNombre || course.plantaNombre || 'SIN-PLANTA') : 'SIN-PLANTA';
    }

    await course.update({
      name: name !== undefined ? name : course.name,
      maxPerSlot: maxPerSlot !== undefined ? parseInt(maxPerSlot, 10) : course.maxPerSlot,
      categoryId: categoryId || course.categoryId,
      niv_id: updatedNivId,
      plantaNombre: updatedPlantaNombre
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

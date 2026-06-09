const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Course = require('../models/Course');

// Get categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read categories' });
  }
});

// Create category
router.post('/', async (req, res) => {
  try {
    const { label } = req.body;
    if (!label) return res.status(400).json({ error: 'Label is required' });

    const newId = `cat${Date.now()}`;
    const newCategory = await Category.create({
      id: newId,
      label
    });
    res.json({ success: true, category: newCategory });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { label } = req.body;

    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    await category.update({
      label: label !== undefined ? label : category.label
    });

    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    // Cascade delete associated courses
    await Course.destroy({ where: { categoryId: id } });
    await category.destroy();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;

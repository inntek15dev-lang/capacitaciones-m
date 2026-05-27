const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username, password } });

    if (user) {
      const userJson = user.toJSON();
      delete userJson.password;
      res.json(userJson);
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;

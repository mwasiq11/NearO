import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { pool } from '../db/database.js';

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!['provider', 'seeker', 'both'].includes(role)) {
      return res.status(400).json({ error: 'Role must be provider, seeker, or both' });
    }

    // Check password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const id = uuidv4();

    // Check if email already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user with hashed password
    await pool.execute(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, hashedPassword, role]
    );

    res.status(201).json({ id, name, email, role });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, role, is_active, is_verified, created_at, last_login_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (email) {
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.user.id]
      );
      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (password !== undefined) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updates.push('password = ?'); params.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(req.user.id);
    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updatedUsers] = await pool.execute(
      'SELECT id, name, email, role, is_active, is_verified, created_at, last_login_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json(updatedUsers[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT * FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
  createUser,
  getUsers,
  getMyProfile,
  updateMyProfile
};
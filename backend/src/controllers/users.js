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
      `SELECT id, name, email, role, phone, neighborhood, city, latitude, longitude, 
              profile_picture, is_active, is_verified, created_at, last_login_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    
    // Convert relative profile picture path to full URL
    if (user.profile_picture) {
      const baseUrl = process.env.API_URL || 'http://localhost:3000';
      if (user.profile_picture.startsWith('/uploads')) {
        user.profile_picture = `${baseUrl}${user.profile_picture}`;
      }
    }

    res.json(user);
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

const uploadProfilePicture = async (req, res) => {
  try {
    console.log('📸 Upload request received:', { hasFile: !!req.file, body: req.body });
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const userId = req.user.id;

    console.log('📸 File details:', { 
      filename: file.filename, 
      path: file.path,
      size: file.size,
      mimetype: file.mimetype 
    });

    // Generate file URL with full path
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/profiles/${file.filename}`;
    const dbPath = `/uploads/profiles/${file.filename}`; // Relative path for database

    console.log('📸 Profile picture uploaded:', { userId, fileUrl, filename: file.filename });

    // Update user profile picture in database
    await pool.execute(
      'UPDATE users SET profile_picture = ? WHERE id = ?',
      [dbPath, userId]
    );

    // Store file upload record
    const uploadId = uuidv4();
    await pool.execute(
      `INSERT INTO file_uploads (id, user_id, file_name, original_name, file_path, file_type, file_size, upload_context)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'profile_picture')`,
      [uploadId, userId, file.filename, file.originalname, file.path, file.mimetype, file.size]
    );

    res.json({ 
      profile_picture: fileUrl,
      message: 'Profile picture updated successfully' 
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
  createUser,
  getUsers,
  getMyProfile,
  updateMyProfile,
  uploadProfilePicture
};
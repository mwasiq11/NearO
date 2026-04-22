import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import prisma from '../db/prisma.js';

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
    const existingUser = await prisma.users.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user with hashed password
    await prisma.users.create({
      data: {
        id,
        name,
        email,
        password: hashedPassword,
        role: role
      }
    });

    res.status(201).json({ id, name, email, role });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Convert relative profile picture path to full URL
    if (user.profile_picture) {
      if (user.profile_picture.startsWith('/uploads')) {
        const baseUrl = process.env.API_URL || 'http://localhost:3000';
        user.profile_picture = `${baseUrl}${user.profile_picture}`;
      }
      // If it starts with http (Cloudinary), use as is
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
      const existingUser = await prisma.users.findFirst({
        where: {
          email,
          id: { not: req.user.id }
        }
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updatedUser = await prisma.users.update({
      where: { id: req.user.id },
      data: updateData
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      orderBy: { created_at: 'desc' }
    });
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

    // With CloudinaryStorage, req.file.path is the full public URL
    const fileUrl = file.path;

    console.log('📸 Profile picture uploaded to Cloudinary:', { userId, fileUrl });

    // Update user profile picture in database
    await prisma.users.update({
      where: { id: userId },
      data: { profile_picture: fileUrl }
    });

    // Store file upload record
    const uploadId = uuidv4();
    await prisma.file_uploads.create({
      data: {
        id: uploadId,
        user_id: userId,
        file_name: file.filename,
        original_name: file.originalname,
        file_path: file.path, // Cloudinary URL
        file_type: file.mimetype,
        file_size: file.size,
        upload_context: 'profile_picture'
      }
    });

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
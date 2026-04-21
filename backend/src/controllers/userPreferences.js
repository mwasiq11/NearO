import prisma from '../db/prisma.js';

/**
 * Get user preferences
 */
const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { preferences: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return current preferences or defaults
    res.json(user.preferences || {
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      profile_visibility: 'public',
      show_online_status: true,
      show_last_seen: true
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update user preferences
 */
const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const newPreferences = req.body;

    // Get current preferences first
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { preferences: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentPreferences = user.preferences || {};
    const updatedPreferences = {
      ...currentPreferences,
      ...newPreferences
    };

    await prisma.users.update({
      where: { id: userId },
      data: { preferences: updatedPreferences }
    });

    res.json(updatedPreferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
  getPreferences,
  updatePreferences
};

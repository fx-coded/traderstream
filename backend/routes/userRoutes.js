const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/authentication');
const firebaseAdminService = require('../config/firebaseAdmin');
const { asyncHandler, ApiError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route GET /api/users/profile
 * @desc Get current user's profile
 * @access Private
 */
router.get('/profile', verifyToken, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.uid;
    const db = firebaseAdminService.getFirestore();
    
    // Get user profile from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // Create user profile if it doesn't exist
      const userData = {
        uid: userId,
        displayName: req.user.name || req.user.email || 'Anonymous',
        email: req.user.email,
        photoURL: req.user.picture || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        streamSubscriptions: [],
        streams: 0,
        followers: 0,
        following: 0,
        role: 'user'
      };
      
      await db.collection('users').doc(userId).set(userData);
      
      res.status(200).json(userData);
    } else {
      res.status(200).json({
        id: userDoc.id,
        ...userDoc.data()
      });
    }
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    throw new ApiError(500, 'Failed to fetch user profile');
  }
}));

/**
 * @route PUT /api/users/profile
 * @desc Update current user's profile
 * @access Private
 */
router.put('/profile', verifyToken, asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const db = firebaseAdminService.getFirestore();
  
  // Fields that are allowed to be updated
  const { displayName, bio, preferences } = req.body;
  
  // Check required fields
  if (!displayName) {
    throw new ApiError(400, 'Display name is required');
  }
  
  // Prepare update data
  const updateData = {
    displayName,
    bio: bio || '',
    updatedAt: new Date().toISOString()
  };
  
  // Add preferences if provided
  if (preferences) {
    updateData.preferences = preferences;
  }
  
  // Update user profile
  await db.collection('users').doc(userId).update(updateData);
  
  // Get updated profile
  const updatedDoc = await db.collection('users').doc(userId).get();
  
  res.status(200).json({
    id: updatedDoc.id,
    ...updatedDoc.data()
  });
}));

/**
 * @route GET /api/users/:userId
 * @desc Get user by ID
 * @access Private
 */
router.get('/:userId', verifyToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const db = firebaseAdminService.getFirestore();
  
  // Get user profile
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new ApiError(404, 'User not found');
  }
  
  // Return public user profile (exclude sensitive information)
  const userData = userDoc.data();
  const publicProfile = {
    uid: userData.uid,
    displayName: userData.displayName,
    photoURL: userData.photoURL,
    bio: userData.bio,
    createdAt: userData.createdAt,
    followers: userData.followers,
    following: userData.following,
    // Only include role for admins or self
    ...(req.user.role === 'admin' || req.user.uid === userId ? { role: userData.role } : {})
  };
  
  res.status(200).json(publicProfile);
}));

/**
 * @route POST /api/users/:userId/follow
 * @desc Follow a user
 * @access Private
 */
router.post('/:userId/follow', verifyToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.uid;
  const db = firebaseAdminService.getFirestore();
  
  // Can't follow yourself
  if (userId === currentUserId) {
    throw new ApiError(400, 'You cannot follow yourself');
  }
  
  // Check if target user exists
  const targetUserDoc = await db.collection('users').doc(userId).get();
  
  if (!targetUserDoc.exists) {
    throw new ApiError(404, 'User not found');
  }
  
  // Check if already following
  const followDoc = await db.collection('follows')
    .where('followerId', '==', currentUserId)
    .where('followingId', '==', userId)
    .get();
  
  if (!followDoc.empty) {
    throw new ApiError(400, 'You are already following this user');
  }
  
  // Start a transaction to update follows
  await db.runTransaction(async (transaction) => {
    // Create follow document
    const followRef = db.collection('follows').doc();
    transaction.set(followRef, {
      followerId: currentUserId,
      followingId: userId,
      createdAt: new Date().toISOString()
    });
    
    // Update follower count for target user
    const targetUserRef = db.collection('users').doc(userId);
    transaction.update(targetUserRef, {
      followers: targetUserDoc.data().followers + 1
    });
    
    // Update following count for current user
    const currentUserRef = db.collection('users').doc(currentUserId);
    const currentUserDoc = await transaction.get(currentUserRef);
    transaction.update(currentUserRef, {
      following: currentUserDoc.data().following + 1
    });
  });
  
  res.status(200).json({ message: 'Successfully followed user' });
}));

/**
 * @route DELETE /api/users/:userId/follow
 * @desc Unfollow a user
 * @access Private
 */
router.delete('/:userId/follow', verifyToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.uid;
  const db = firebaseAdminService.getFirestore();
  
  // Check if follow relationship exists
  const followSnapshot = await db.collection('follows')
    .where('followerId', '==', currentUserId)
    .where('followingId', '==', userId)
    .get();
  
  if (followSnapshot.empty) {
    throw new ApiError(400, 'You are not following this user');
  }
  
  // Get the follow document ID
  const followDoc = followSnapshot.docs[0];
  
  // Start a transaction to update follows
  await db.runTransaction(async (transaction) => {
    // Delete follow document
    transaction.delete(followDoc.ref);
    
    // Update follower count for target user
    const targetUserRef = db.collection('users').doc(userId);
    const targetUserDoc = await transaction.get(targetUserRef);
    transaction.update(targetUserRef, {
      followers: Math.max(0, targetUserDoc.data().followers - 1)
    });
    
    // Update following count for current user
    const currentUserRef = db.collection('users').doc(currentUserId);
    const currentUserDoc = await transaction.get(currentUserRef);
    transaction.update(currentUserRef, {
      following: Math.max(0, currentUserDoc.data().following - 1)
    });
  });
  
  res.status(200).json({ message: 'Successfully unfollowed user' });
}));

/**
 * @route GET /api/users/followers
 * @desc Get current user's followers
 * @access Private
 */
router.get('/followers', verifyToken, asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const db = firebaseAdminService.getFirestore();
  
  // Get followers
  const followersSnapshot = await db.collection('follows')
    .where('followingId', '==', userId)
    .get();
  
  // Extract follower IDs
  const followerIds = [];
  followersSnapshot.forEach(doc => {
    followerIds.push(doc.data().followerId);
  });
  
  // Get follower profiles
  const followers = [];
  for (const id of followerIds) {
    const userDoc = await db.collection('users').doc(id).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      followers.push({
        uid: userData.uid,
        displayName: userData.displayName,
        photoURL: userData.photoURL
      });
    }
  }
  
  res.status(200).json(followers);
}));

/**
 * @route GET /api/users/following
 * @desc Get users that current user is following
 * @access Private
 */
router.get('/following', verifyToken, asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const db = firebaseAdminService.getFirestore();
  
  // Get following
  const followingSnapshot = await db.collection('follows')
    .where('followerId', '==', userId)
    .get();
  
  // Extract following IDs
  const followingIds = [];
  followingSnapshot.forEach(doc => {
    followingIds.push(doc.data().followingId);
  });
  
  // Get following profiles
  const following = [];
  for (const id of followingIds) {
    const userDoc = await db.collection('users').doc(id).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      following.push({
        uid: userData.uid,
        displayName: userData.displayName,
        photoURL: userData.photoURL
      });
    }
  }
  
  res.status(200).json(following);
}));

/**
 * Admin routes
 */

/**
 * @route GET /api/users
 * @desc Get all users (admin only)
 * @access Private (admin only)
 */
router.get('/', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const db = firebaseAdminService.getFirestore();
  
  // Get users with pagination
  const usersSnapshot = await db.collection('users')
    .orderBy('createdAt', 'desc')
    .limit(parseInt(limit))
    .offset(parseInt(offset))
    .get();
  
  const users = [];
  usersSnapshot.forEach(doc => {
    users.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  res.status(200).json(users);
}));

/**
 * @route PUT /api/users/:userId/role
 * @desc Update user role (admin only)
 * @access Private (admin only)
 */
router.put('/:userId/role', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const db = firebaseAdminService.getFirestore();
  
  // Validate role
  const validRoles = ['user', 'moderator', 'admin'];
  if (!role || !validRoles.includes(role)) {
    throw new ApiError(400, 'Invalid role. Must be one of: user, moderator, admin');
  }
  
  // Check if user exists
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new ApiError(404, 'User not found');
  }
  
  // Update role
  await db.collection('users').doc(userId).update({
    role,
    updatedAt: new Date().toISOString()
  });
  
  logger.info(`User ${userId} role updated to ${role} by admin ${req.user.uid}`);
  
  res.status(200).json({ message: 'User role updated successfully' });
}));

module.exports = router;
import { createFilter, createPaginationInfo } from "../../lib/pagination.js";
import cloudinary, { cloudinaryUpload } from "../../lib/cloudinaryUpload.js";
import User from "../auth/auth.model.js";
import Generation from "../generation/generation.model.js";
import SubscriptionTransaction from "../subscription/subscriptionTransaction.model.js";
import RoleType from "../../lib/types.js";
import fs from "fs";


// Get all users
export const getAllUsers = async ({ page = 1, limit = 10, search, date }) => {
  const filter = createFilter(search, date);

  filter.role = "USER";

  const totalUsers = await User.countDocuments(filter);
  const users = await User.find(filter)
    .populate("planId", "name monthlyPrice credits")
    .select("-password -createdAt -updatedAt -__v -verificationCode -verificationCodeExpires")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const paginationInfo = createPaginationInfo(page, limit, totalUsers);

  return { users, paginationInfo };
};

// Get all users' generation history summary for admin
export const getAllUsersGenerationHistory = async ({ page = 1, limit = 10, search, date }) => {
  const filter = createFilter(search, date);
  filter.role = "USER";

  // Get total count of users
  const totalUsers = await User.countDocuments(filter);

  // Get paginated users first
  const users = await User.find(filter)
    .select('name email credits planId isSubscribed expiryDate subscribedDate')
    .populate('planId', 'name monthlyPrice credits')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Get user IDs for the current page
  const userIds = users.map(user => user._id);

  // Aggregate detailed generation data for these users
  const generationData = await Generation.aggregate([
    {
      $match: {
        userId: { $in: userIds }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: "$userId",
        generations: {
          $push: {
            _id: "$_id",
            generationType: "$generationType",
            jobId: "$jobId",
            taskIds: "$taskIds",
            status: "$status",
            creditCost: "$creditCost",
            creditDeducted: "$creditDeducted",
            inputData: "$inputData",
            resultUrls: "$resultUrls",
            error: "$error",
            createdAt: "$createdAt",
            updatedAt: "$updatedAt"
          }
        }
      }
    }
  ]);

  // Combine user data with generation data
  const generationSummary = users.map(user => {
    const userGenerations = generationData.find(gen => gen._id.toString() === user._id.toString());
    const generations = userGenerations ? userGenerations.generations : [];

    const posters = generations.filter(gen => gen.generationType === 'poster');
    const logos = generations.filter(gen => gen.generationType === 'logo');

    return {
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      posterCount: posters.length,
      logoCount: logos.length,
      totalGenerations: generations.length,
      remainingCredits: user.credits || 0,
      plan: user.planId || null,
      subscriptionStatus: {
        isSubscribed: user.isSubscribed || false,
        expiryDate: user.expiryDate,
        subscribedDate: user.subscribedDate
      },
      posters: posters,
      logos: logos
    };
  });

  // Sort by totalGenerations descending, then by userName ascending
  generationSummary.sort((a, b) => {
    if (b.totalGenerations !== a.totalGenerations) {
      return b.totalGenerations - a.totalGenerations;
    }
    return a.userName.localeCompare(b.userName);
  });

  const paginationInfo = createPaginationInfo(page, limit, totalUsers);

  return { generationSummary, paginationInfo };
};

// Get all admins
export const getAllAdmins = async ({ page = 1, limit = 10, search, date }) => {
  const filter = createFilter(search, date);
  const totalAdmins = await User.countDocuments({ ...filter, role: RoleType.ADMIN });
  const admins = await User.find({ ...filter, role: RoleType.ADMIN })
    .select("-password -createdAt -updatedAt -__v -verificationCode -verificationCodeExpires")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const paginationInfo = createPaginationInfo(page, limit, totalAdmins);
  return { admins, paginationInfo };
};


// Get all sellers 
export const getAllSellers = async ({ page = 1, limit = 10, search, date }) => {
  const filter = createFilter(search, date);
  const totalSellers = await User.countDocuments({ ...filter, role: RoleType.SELLER });
  const sellers = await User.find({ ...filter, role: RoleType.SELLER })
    .select("-password -createdAt -updatedAt -__v -verificationCode -verificationCodeExpires")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const paginationInfo = createPaginationInfo(page, limit, totalSellers);
  return { sellers, paginationInfo };
};


// Get user by ID
export const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password -createdAt -updatedAt -__v -verificationCode -verificationCodeExpires");
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};


// Update user
export const updateUser = async ({ id, ...updateData }) => {
  const updatedUser = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password -createdAt -updatedAt -__v -verificationCode -verificationCodeExpires");

  if (!updatedUser) {
    throw new Error('User not found');
  }
  return updatedUser;
};


// Delete user
export const deleteUser = async (userId) => {
  const deletedUser = await User.findByIdAndDelete(userId);
  if (!deletedUser) {
    throw new Error('User not found');
  }
  return true;
};



// Get user by ID
export const adminGetUserById = async (userId) => {
  const user = await User.findById(userId).select("-password -createdAt -updatedAt -__v -verificationCode -verificationCodeExpires");
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};


// Update user
export const adminUpdateUser = async ({ id, ...updateData }) => {
  const updatedUser = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password -createdAt -updatedAt -__v -verificationCode -verificationCodeExpires");

  if (!updatedUser) {
    throw new Error('User not found');
  }
  return updatedUser;
};


// Delete user
export const adminDeleteUser = async (userId) => {
  const deletedUser = await User.findByIdAndDelete(userId);
  if (!deletedUser) {
    throw new Error('User not found');
  }
  return true;
};


// Upload avatar
export const createAvatarProfile = async (id, files) => {

  const userFound = await User.findById({_id: id});

  if (!userFound) throw new Error('User not found');

  const profileImage = files.profileImage[0];
  
  // Generate secure filename
  const sanitizedTitle = `${userFound._id}-${Date.now()}`; 
  let cloudinaryResult;

  try {
    cloudinaryResult = await cloudinaryUpload(profileImage.path, sanitizedTitle, "user-profile");
    if (!cloudinaryResult?.url) throw new Error('Cloudinary upload failed');

    // Update user 
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { profileImage: cloudinaryResult.url },
      { new: true }
    ).select("-password -createdAt -updatedAt -__v -verificationCode -verificationCodeExpires");

    return updatedUser;
  } catch (error) {
    console.error('Error in createAvatarProfile:', error);
    throw error;
  } finally {
    // Always clean up temp file
    fs.unlink(profileImage.path, () => {}); 
  }
};


// Upload avatar profile
export const updateAvatarProfile = async (id, files) => {
  const userFound = await User.findById(id);
  if (!userFound) {
    throw new Error('User not found');
  }

  if (!files || !files.profileImage || files.profileImage.length === 0) {
    throw new Error('Profile image is required');
  }

  const profileImage = files.profileImage[0];

  if (userFound.profileImage) {
    const publicId = userFound.profileImage.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicId);
  }

  const fullName = userFound.fullName || "user";
  const sanitizedTitle = fullName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[?&=]/g, "");
  

  const imgUrl = await cloudinaryUpload(profileImage.path, sanitizedTitle, "user-profile");
  if (imgUrl === "file upload failed") {
    throw new Error('File upload failed');
  }

  const updatedUser = await User.findByIdAndUpdate(id, { profileImage: imgUrl.url }, { new: true })
    .select("-password -createdAt -updatedAt -__v -verificationCode -verificationCodeExpires");

  return updatedUser;
};


export const deleteAvatarProfile = async (id) => {
  const userFound = await User.findById(id);
  if (!userFound) throw new Error('User not found');
  if (!userFound.profileImage) throw new Error('No profile image to delete');

  try {
    // Extract public ID from URL 
    const imageUrl = userFound.profileImage;
    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
    
    // Delete from Cloudinary
    const cloudinaryResult = await cloudinary.uploader.destroy(publicId);
    console.log('Cloudinary deletion result:', cloudinaryResult);
    
    // Verify deletion was successful
    if (cloudinaryResult.result !== 'ok') {
      throw new Error(`Cloudinary deletion failed: ${cloudinaryResult.result}`);
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { profileImage: '' },
      { new: true }
    ).select("-password -createdAt -updatedAt -__v -verificationCode -verificationCodeExpires");

    return updatedUser;
  } catch (error) {
    console.error('Error in deleteAvatarProfile:', error);
    throw error; 
  }
};


export const createMultipleAvatar = async (id, files) => {
  const userFound = await User.findById(id);
  if (!userFound) {
    throw new Error('User not found');
  }

  if (!files || !files.multiProfileImage || files.multiProfileImage.length === 0) {
    throw new Error('Profile images are required');
  }

  const imageUrls = await Promise.all(files.multiProfileImage.map(async (image, index) => {
    const sanitizedTitle = `${userFound.fullName.toLowerCase().replace(/\s+/g, "-").replace(/[?&=]/g, "")}-${index}`;
    const imgUrl = await cloudinaryUpload(image.path, sanitizedTitle, "user-profile");
    if (imgUrl === "file upload failed") {
      throw new Error('File upload failed');
    }
    return imgUrl.url;
  }));

  const updatedUser = await User.findByIdAndUpdate(id, { multiProfileImage: imageUrls }, { new: true })
    .select("-password -createdAt -updatedAt -__v -verificationCode -verificationCodeExpires");

  return updatedUser;
};


export const updateMultipleAvatar = async (id, files) => {
  const userFound = await User.findById(id);
  if (!userFound) {
    throw new Error('User not found');
  }

  if (!files || !files.multiProfileImage || files.multiProfileImage.length === 0) {
    throw new Error('Profile images are required');
  }

  const imageUrls = await Promise.all(files.multiProfileImage.map(async (image, index) => {
    const sanitizedTitle = `${userFound.fullName.toLowerCase().replace(/\s+/g, "-").replace(/[?&=]/g, "")}-${index}`;
    const imgUrl = await cloudinaryUpload(image.path, sanitizedTitle, "user-profile");
    if (imgUrl === "file upload failed") {
      throw new Error('File upload failed');
    }
    return imgUrl.url;
  }));

  const updatedUser = await User.findByIdAndUpdate(id, { multiProfileImage: imageUrls }, { new: true })
    .select("-password -createdAt -updatedAt -__v -verificationCode -verificationCodeExpires");

  return updatedUser;
};


export const deleteMultipleAvatar = async (id) => {
  const userFound = await User.findById(id);
  if (!userFound) {
    throw new Error('User not found');
  }

  if (!userFound.multiProfileImage || userFound.multiProfileImage.length === 0) {
    throw new Error('No profile images to delete');
  }

  const publicIds = userFound.multiProfileImage.map((image) => image.split('/').pop().split('.')[0]);
  await Promise.all(publicIds.map((publicId) => cloudinary.uploader.destroy(publicId)));

  const updatedUser = await User.findByIdAndUpdate(id, { multiProfileImage: [] }, { new: true })
    .select("-password -createdAt -updatedAt -__v -verificationCode -verificationCodeExpires");

  return updatedUser;
};  


// Upload user PDF
export const createUserPDF = async (id, files) => {
  const userFound = await User.findById(id);
  if (!userFound) {
    throw new Error('User not found');
  }

  if (!files || !files.userPDF || files.userPDF.length === 0) {
    throw new Error('PDF file is required');
  }

  const userPDF = files.userPDF[0];
  const sanitizedTitle = userFound.fullName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[?&=]/g, "");

  const pdfUrl = await cloudinaryUpload(userPDF.path, sanitizedTitle, "user-pdf");
  if (pdfUrl === "file upload failed") {
    throw new Error('File upload failed');
  }

  const updatedUser = await User.findByIdAndUpdate(id, { pdfFile: pdfUrl.url }, { new: true })
    .select("-password -createdAt -updatedAt -__v -verificationCode -verificationCodeExpires");

  return updatedUser;
};


export const updateUserPDF = async (id, files) => {
  const userFound = await User.findById(id);
  if (!userFound) {
    throw new Error('User not found');
  }

  if (!files || !files.userPDF || files.userPDF.length === 0) {
    throw new Error('PDF file is required');
  }

  const userPDF = files.userPDF[0];
  const sanitizedTitle = userFound.fullName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[?&=]/g, "");

  const pdfUrl = await cloudinaryUpload(userPDF.path, sanitizedTitle, "user-pdf");
  if (pdfUrl === "file upload failed") {
    throw new Error('File upload failed');
  }

  const updatedUser = await User.findByIdAndUpdate(id, { pdfFile: pdfUrl.url }, { new: true })
    .select("-password -createdAt -updatedAt -__v -verificationCode -verificationCodeExpires");

  return updatedUser;
};


export const deleteUserPDF = async (id) => {
  const userFound = await User.findById(id);
  if (!userFound) {
    throw new Error('User not found');
  }

  if (!userFound.pdfFile) {
    throw new Error('No PDF file to delete'); 
  }

  const publicId = userFound.pdfFile.split('/').pop().split('.')[0];
  await cloudinary.uploader.destroy(publicId);

  const updatedUser = await User.findByIdAndUpdate(id, { pdfFile: null }, { new: true })
    .select("-password -createdAt -updatedAt -__v -verificationCode -verificationCodeExpires");

  return updatedUser;
};


// Admin Analytics
export const getAdminAnalytics = async () => {
  // Total user count
  const totalUsers = await User.countDocuments({ role: RoleType.USER });

  // Subscribed users per month and year
  const subscribedUsersStats = await User.aggregate([
    { $match: { isSubscribed: true, subscribedDate: { $ne: null } } },
    {
      $group: {
        _id: {
          year: { $year: "$subscribedDate" },
          month: { $month: "$subscribedDate" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } }
  ]);

  // Revenue per month and year
  const revenueStats = await SubscriptionTransaction.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        totalRevenue: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } }
  ]);

  // Total poster and logo designs
  const designStats = await Generation.aggregate([
    {
      $group: {
        _id: "$generationType",
        count: { $sum: 1 }
      }
    }
  ]);

  const totalPosterDesigns = designStats.find(stat => stat._id === 'poster')?.count || 0;
  const totalLogoDesigns = designStats.find(stat => stat._id === 'logo')?.count || 0;

  // Yearly analytics (users per year, designs per year, active users per year)
  const yearlyUserStats = await User.aggregate([
    { $match: { role: RoleType.USER } },
    {
      $group: {
        _id: { $year: "$createdAt" },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id": -1 } }
  ]);

  const yearlyDesignStats = await Generation.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          generationType: "$generationType"
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": -1 } }
  ]);

  // Active users per year (users with generation activity per year)
  const yearlyActiveUsers = await Generation.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          userId: "$userId"
        }
      }
    },
    {
      $group: {
        _id: "$_id.year",
        activeUserCount: { $sum: 1 }
      }
    },
    { $sort: { "_id": -1 } }
  ]);

  // Process yearly analytics into structured format
  const yearlyAnalytics = {};
  
  // Add user counts per year
  yearlyUserStats.forEach(stat => {
    if (!yearlyAnalytics[stat._id]) yearlyAnalytics[stat._id] = {};
    yearlyAnalytics[stat._id].totalUsers = stat.count;
  });

  // Add design counts per year
  yearlyDesignStats.forEach(stat => {
    if (!yearlyAnalytics[stat._id.year]) yearlyAnalytics[stat._id.year] = {};
    if (stat._id.generationType === 'poster') {
      yearlyAnalytics[stat._id.year].totalPosterDesigns = stat.count;
    } else if (stat._id.generationType === 'logo') {
      yearlyAnalytics[stat._id.year].totalLogoDesigns = stat.count;
    }
  });

  // Add active users per year
  yearlyActiveUsers.forEach(stat => {
    if (!yearlyAnalytics[stat._id]) yearlyAnalytics[stat._id] = {};
    yearlyAnalytics[stat._id].activeUsers = stat.activeUserCount;
  });

  // Fill missing values with 0
  Object.keys(yearlyAnalytics).forEach(year => {
    yearlyAnalytics[year].totalPosterDesigns = yearlyAnalytics[year].totalPosterDesigns || 0;
    yearlyAnalytics[year].totalLogoDesigns = yearlyAnalytics[year].totalLogoDesigns || 0;
    yearlyAnalytics[year].activeUsers = yearlyAnalytics[year].activeUsers || 0;
  });

  // Convert to array and sort by year descending
  const yearlyAnalyticsArray = Object.entries(yearlyAnalytics)
    .map(([year, data]) => ({ year: parseInt(year), ...data }))
    .sort((a, b) => b.year - a.year);

  // Calculate total cumulative revenue
  const totalRevenueData = await SubscriptionTransaction.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" }
      }
    }
  ]);

  const totalRevenue = totalRevenueData.length > 0 ? totalRevenueData[0].totalRevenue : 0;

  return {
    // Existing fields
    totalUsers,
    subscribedUsersStats,
    revenueStats,
    
    // New fields
    totalPosterDesigns,
    totalLogoDesigns,
    totalRevenue,
    yearlyAnalytics: yearlyAnalyticsArray
  };
};

export const blockUser = async (userId, { duration, unit, isPermanent }) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (isPermanent) {
    user.isBlocked = true;
    user.isPermanentBlock = true;
    user.blockedUntil = null;
  } else {
    const now = new Date();
    let blockedUntil = new Date(now);

    if (unit === 'minutes') blockedUntil.setMinutes(now.getMinutes() + duration);
    else if (unit === 'hours') blockedUntil.setHours(now.getHours() + duration);
    else if (unit === 'days') blockedUntil.setDate(now.getDate() + duration);
    else throw new Error('Invalid duration unit');

    user.isBlocked = true;
    user.isPermanentBlock = false;
    user.blockedUntil = blockedUntil;
  }

  return await user.save();
};

export const unblockUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.isBlocked = false;
  user.isPermanentBlock = false;
  user.blockedUntil = null;

  return await user.save();
};

export const checkAutoUnblock = async () => {
  const now = new Date();
  const blockedUsers = await User.find({
    isBlocked: true,
    isPermanentBlock: false,
    blockedUntil: { $lt: now }
  });

  for (const user of blockedUsers) {
    user.isBlocked = false;
    user.blockedUntil = null;
    await user.save();
    console.log(`Auto-unblocked user: ${user.email}`);
  }
};

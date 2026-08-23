import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/database.js';
import env from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '..', '..', env.UPLOAD_DIR);

// ════════════════════════════════════════════════════════════════
// 1. AUDIT LOG HELPER
// ════════════════════════════════════════════════════════════════
export async function logAuditEvent({ userId, action, entity, entityId = null, details = null }) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        details: details || null,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
// 2. STATS & OVERVIEW
// ════════════════════════════════════════════════════════════════
export async function getSystemStats() {
  const [
    userCount,
    activeUserCount,
    suspendedUserCount,
    goalCount,
    taskCount,
    wardrobeCount,
    outfitCount,
    styleCount,
    brandCount,
    categoryCount,
    pendingReportsCount,
    totalReportsCount,
    auditCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: 'SUSPENDED' } }),
    prisma.goal.count(),
    prisma.task.count(),
    prisma.wardrobeItem.count(),
    prisma.outfit.count(),
    prisma.style.count(),
    prisma.brand.count(),
    prisma.fashionCategory.count(),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.report.count(),
    prisma.auditLog.count(),
  ]);

  return {
    users: userCount,
    activeUsers: activeUserCount,
    suspendedUsers: suspendedUserCount,
    goals: goalCount,
    tasks: taskCount,
    wardrobeItems: wardrobeCount,
    outfits: outfitCount,
    styles: styleCount,
    brands: brandCount,
    categories: categoryCount,
    pendingReports: pendingReportsCount,
    totalReports: totalReportsCount,
    auditEvents: auditCount,
  };
}

// ════════════════════════════════════════════════════════════════
// 3. PLATFORM ANALYTICS (REAL DB DERIVABLE DATA)
// ════════════════════════════════════════════════════════════════
export async function getAnalytics() {
  // ── User Registrations by Month (Last 6 Months) ──
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const monthlyMap = {};
  users.forEach((u) => {
    const key = `${u.createdAt.getFullYear()}-${String(u.createdAt.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + 1;
  });

  const growthData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    growthData.push({ month: monthName, key, count: monthlyMap[key] || 0 });
  }

  // ── Real Entity Counts & Completions ──
  const [
    totalGoals,
    completedGoals,
    totalTasks,
    completedTasks,
    totalUsers,
    totalWardrobeItems,
    totalOutfits,
    totalReports,
    pendingReports,
    resolvedReports,
    dismissedReports,
  ] = await Promise.all([
    prisma.goal.count(),
    prisma.goal.count({ where: { status: 'COMPLETED' } }),
    prisma.task.count(),
    prisma.task.count({ where: { status: 'COMPLETED' } }),
    prisma.user.count(),
    prisma.wardrobeItem.count(),
    prisma.outfit.count(),
    prisma.report.count(),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.report.count({ where: { status: 'RESOLVED' } }),
    prisma.report.count({ where: { status: 'DISMISSED' } }),
  ]);

  // Wardrobe categories breakdown
  const wardrobeByCategory = await prisma.wardrobeItem.groupBy({
    by: ['category'],
    _count: { category: true },
  });

  // Most Saved Styles
  const savedStylesGroup = await prisma.savedStyle.groupBy({
    by: ['styleId'],
    _count: { styleId: true },
    orderBy: { _count: { styleId: 'desc' } },
    take: 5,
  });

  const popularStyles = await Promise.all(
    savedStylesGroup.map(async (sg) => {
      const style = await prisma.style.findUnique({
        where: { id: sg.styleId },
        include: { category: { select: { name: true } } },
      });
      return style ? { id: style.id, name: style.name, category: style.category?.name || 'N/A', saves: sg._count.styleId } : null;
    })
  );

  // Most Saved Brands
  const savedBrandsGroup = await prisma.savedBrand.groupBy({
    by: ['brandId'],
    _count: { brandId: true },
    orderBy: { _count: { brandId: 'desc' } },
    take: 5,
  });

  const popularBrands = await Promise.all(
    savedBrandsGroup.map(async (bg) => {
      const brand = await prisma.brand.findUnique({ where: { id: bg.brandId } });
      return brand ? { id: brand.id, name: brand.name, category: brand.category || 'N/A', saves: bg._count.brandId } : null;
    })
  );

  // Category Distribution
  const categoryDistribution = await prisma.fashionCategory.findMany({
    include: { _count: { select: { styles: true } } },
    orderBy: { name: 'asc' },
  });

  return {
    userGrowth: growthData,
    engagement: {
      totalGoals,
      completedGoals,
      goalCompletionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
      totalTasks,
      completedTasks,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalUsers,
      totalWardrobeItems,
      avgWardrobePerUser: totalUsers > 0 ? Math.round((totalWardrobeItems / totalUsers) * 10) / 10 : 0,
      totalOutfits,
      avgOutfitsPerUser: totalUsers > 0 ? Math.round((totalOutfits / totalUsers) * 10) / 10 : 0,
      wardrobeBreakdown: wardrobeByCategory.map((w) => ({ category: w.category, count: w._count.category })),
    },
    reports: {
      total: totalReports,
      pending: pendingReports,
      resolved: resolvedReports,
      dismissed: dismissedReports,
    },
    popularStyles: popularStyles.filter(Boolean),
    popularBrands: popularBrands.filter(Boolean),
    categoryDistribution: categoryDistribution.map((c) => ({
      id: c.id,
      name: c.name,
      styleCount: c._count.styles,
    })),
  };
}

// ════════════════════════════════════════════════════════════════
// 4. USER MANAGEMENT
// ════════════════════════════════════════════════════════════════
export async function getUsers({ page = 1, limit = 20, search, role, status, sort = 'createdAt', order = 'desc' }) {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (role && role !== 'ALL') {
    where.role = role;
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (search && search.trim() !== '') {
    const q = search.trim();
    where.OR = [
      { email: { contains: q } },
      { firstName: { contains: q } },
      { lastName: { contains: q } },
    ];
  }

  const orderBy = {};
  orderBy[sort] = order;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            goals: true,
            tasks: true,
            habits: true,
            wardrobeItems: true,
            outfits: true,
            savedStyles: true,
            savedBrands: true,
            reportsFiled: true,
          },
        },
      },
      orderBy,
      skip,
      take: parseInt(limit),
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page: parseInt(page), limit: parseInt(limit) };
}

export async function getUserDetail(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      avatar: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
      preferredStyles: true,
      preferredColors: true,
      primaryOccasion: true,
      seasonFocus: true,
      profileVisibility: true,
      wardrobeVisibility: true,
      emailNotifications: true,
      _count: {
        select: {
          goals: true,
          tasks: true,
          habits: true,
          skills: true,
          journalEntries: true,
          wardrobeItems: true,
          outfits: true,
          savedStyles: true,
          savedBrands: true,
          notifications: true,
          reportsFiled: true,
        },
      },
    },
  });

  return user;
}

export async function updateUserRole(adminUserId, targetUserId, newRole) {
  if (!['USER', 'ADMIN'].includes(newRole)) {
    throw new Error('Invalid role specified.');
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) throw new Error('User not found.');

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true },
  });

  await logAuditEvent({
    userId: adminUserId,
    action: 'ROLE_CHANGE',
    entity: 'User',
    entityId: targetUserId,
    details: `Changed role of ${targetUser.email} from ${targetUser.role} to ${newRole}`,
  });

  return updated;
}

export async function updateUserStatus(adminUserId, targetUserId, newStatus) {
  if (!['ACTIVE', 'SUSPENDED'].includes(newStatus)) {
    throw new Error('Invalid status specified.');
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) throw new Error('User not found.');

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { status: newStatus },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true },
  });

  await logAuditEvent({
    userId: adminUserId,
    action: 'STATUS_CHANGE',
    entity: 'User',
    entityId: targetUserId,
    details: `Set status of ${targetUser.email} to ${newStatus}`,
  });

  return updated;
}

// ════════════════════════════════════════════════════════════════
// 5. FASHION CATEGORY CRUD
// ════════════════════════════════════════════════════════════════
export async function getCategories() {
  return await prisma.fashionCategory.findMany({
    include: { _count: { select: { styles: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function createCategory(adminUserId, { name, description, image }) {
  if (!name || name.trim() === '') {
    throw new Error('Category name is required.');
  }

  const cleanName = name.trim();
  const slug = cleanName.toLowerCase().replace(/[\s&]+/g, '-').replace(/[^a-z0-9-]/g, '');

  const existing = await prisma.fashionCategory.findFirst({
    where: { OR: [{ name: cleanName }, { slug }] },
  });
  if (existing) {
    throw new Error(`Category "${cleanName}" already exists.`);
  }

  const category = await prisma.fashionCategory.create({
    data: {
      name: cleanName,
      slug,
      description: description?.trim() || null,
      image: image?.trim() || null,
    },
    include: { _count: { select: { styles: true } } },
  });

  await logAuditEvent({
    userId: adminUserId,
    action: 'CREATE',
    entity: 'FashionCategory',
    entityId: category.id,
    details: `Created fashion category: ${cleanName}`,
  });

  return category;
}

export async function updateCategory(adminUserId, categoryId, { name, description, image }) {
  const existing = await prisma.fashionCategory.findUnique({ where: { id: categoryId } });
  if (!existing) throw new Error('Category not found.');

  const data = {};
  if (name && name.trim() !== '') {
    data.name = name.trim();
    data.slug = data.name.toLowerCase().replace(/[\s&]+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  if (description !== undefined) data.description = description?.trim() || null;
  if (image !== undefined) data.image = image?.trim() || null;

  const updated = await prisma.fashionCategory.update({
    where: { id: categoryId },
    data,
    include: { _count: { select: { styles: true } } },
  });

  await logAuditEvent({
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'FashionCategory',
    entityId: categoryId,
    details: `Updated category: ${updated.name}`,
  });

  return updated;
}

export async function deleteCategory(adminUserId, categoryId) {
  const existing = await prisma.fashionCategory.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { styles: true } } },
  });
  if (!existing) throw new Error('Category not found.');

  if (existing._count.styles > 0) {
    throw new Error(`Cannot delete category "${existing.name}" because it contains ${existing._count.styles} style(s). Reassign or remove the styles first.`);
  }

  await prisma.fashionCategory.delete({ where: { id: categoryId } });

  await logAuditEvent({
    userId: adminUserId,
    action: 'DELETE',
    entity: 'FashionCategory',
    entityId: categoryId,
    details: `Deleted category: ${existing.name}`,
  });

  return { success: true };
}

// ════════════════════════════════════════════════════════════════
// 6. FASHION STYLE CRUD
// ════════════════════════════════════════════════════════════════
export async function getStyles({ page = 1, limit = 50, search, categoryId }) {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (categoryId && categoryId !== 'ALL') {
    where.categoryId = categoryId;
  }

  if (search && search.trim() !== '') {
    const q = search.trim();
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { tags: { contains: q } },
      { category: { name: { contains: q } } },
    ];
  }

  const [styles, total] = await Promise.all([
    prisma.style.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { savedBy: true } },
      },
      orderBy: { name: 'asc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.style.count({ where }),
  ]);

  const parsed = styles.map((s) => ({
    ...s,
    tags: s.tags ? (typeof s.tags === 'string' ? JSON.parse(s.tags) : s.tags) : [],
    savedCount: s._count.savedBy,
  }));

  return { styles: parsed, total, page: parseInt(page), limit: parseInt(limit) };
}

export async function createStyle(adminUserId, { name, categoryId, description, image, tags, season, occasion }) {
  if (!name || name.trim() === '') throw new Error('Style name is required.');
  if (!categoryId) throw new Error('Category selection is required.');

  const category = await prisma.fashionCategory.findUnique({ where: { id: categoryId } });
  if (!category) throw new Error('Selected category does not exist.');

  const cleanName = name.trim();
  const slug = `${cleanName.toLowerCase().replace(/[\s&]+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now().toString(36)}`;

  const style = await prisma.style.create({
    data: {
      name: cleanName,
      slug,
      categoryId,
      description: description?.trim() || null,
      image: image?.trim() || null,
      tags: tags ? JSON.stringify(Array.isArray(tags) ? tags : [tags]) : null,
      season: season?.trim() || null,
      occasion: occasion?.trim() || null,
    },
    include: {
      category: { select: { id: true, name: true } },
      _count: { select: { savedBy: true } },
    },
  });

  await logAuditEvent({
    userId: adminUserId,
    action: 'CREATE',
    entity: 'Style',
    entityId: style.id,
    details: `Created fashion style: "${cleanName}" under category "${category.name}"`,
  });

  return {
    ...style,
    tags: style.tags ? JSON.parse(style.tags) : [],
    savedCount: 0,
  };
}

export async function updateStyle(adminUserId, styleId, { name, categoryId, description, image, tags, season, occasion }) {
  const existing = await prisma.style.findUnique({ where: { id: styleId } });
  if (!existing) throw new Error('Style not found.');

  const data = {};
  if (name && name.trim() !== '') data.name = name.trim();
  if (categoryId) {
    const cat = await prisma.fashionCategory.findUnique({ where: { id: categoryId } });
    if (!cat) throw new Error('Selected category does not exist.');
    data.categoryId = categoryId;
  }
  if (description !== undefined) data.description = description?.trim() || null;
  if (image !== undefined) data.image = image?.trim() || null;
  if (tags !== undefined) data.tags = tags ? JSON.stringify(Array.isArray(tags) ? tags : [tags]) : null;
  if (season !== undefined) data.season = season?.trim() || null;
  if (occasion !== undefined) data.occasion = occasion?.trim() || null;

  const updated = await prisma.style.update({
    where: { id: styleId },
    data,
    include: {
      category: { select: { id: true, name: true } },
      _count: { select: { savedBy: true } },
    },
  });

  await logAuditEvent({
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'Style',
    entityId: styleId,
    details: `Updated style: "${updated.name}"`,
  });

  return {
    ...updated,
    tags: updated.tags ? JSON.parse(updated.tags) : [],
    savedCount: updated._count.savedBy,
  };
}

export async function deleteStyle(adminUserId, styleId) {
  const existing = await prisma.style.findUnique({ where: { id: styleId } });
  if (!existing) throw new Error('Style not found.');

  await prisma.savedStyle.deleteMany({ where: { styleId } });
  await prisma.style.delete({ where: { id: styleId } });

  await logAuditEvent({
    userId: adminUserId,
    action: 'DELETE',
    entity: 'Style',
    entityId: styleId,
    details: `Deleted style: "${existing.name}"`,
  });

  return { success: true };
}

// ════════════════════════════════════════════════════════════════
// 7. BRAND MANAGEMENT CRUD
// ════════════════════════════════════════════════════════════════
export async function getBrands({ page = 1, limit = 20, search, category, priceSegment }) {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (category && category !== 'ALL') where.category = category;
  if (priceSegment && priceSegment !== 'ALL') where.priceSegment = priceSegment;
  if (search && search.trim() !== '') {
    const q = search.trim();
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { category: { contains: q } },
      { styles: { contains: q } },
    ];
  }

  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      include: { _count: { select: { savedBy: true } } },
      orderBy: { name: 'asc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.brand.count({ where }),
  ]);

  const parsed = brands.map((b) => ({
    ...b,
    styles: b.styles ? (typeof b.styles === 'string' ? JSON.parse(b.styles) : b.styles) : [],
    savedCount: b._count.savedBy,
  }));

  return { brands: parsed, total, page: parseInt(page), limit: parseInt(limit) };
}

export async function createBrand(adminUserId, { name, logo, description, category, priceSegment, styles, website, featured = false }) {
  if (!name || name.trim() === '') throw new Error('Brand name is required.');

  const cleanName = name.trim();
  const existing = await prisma.brand.findUnique({ where: { name: cleanName } });
  if (existing) throw new Error(`Brand "${cleanName}" already exists.`);

  const brand = await prisma.brand.create({
    data: {
      name: cleanName,
      logo: logo?.trim() || null,
      description: description?.trim() || null,
      category: category?.trim() || null,
      priceSegment: priceSegment?.trim() || null,
      styles: styles ? JSON.stringify(Array.isArray(styles) ? styles : [styles]) : null,
      website: website?.trim() || null,
      featured: Boolean(featured),
    },
    include: { _count: { select: { savedBy: true } } },
  });

  await logAuditEvent({
    userId: adminUserId,
    action: 'CREATE',
    entity: 'Brand',
    entityId: brand.id,
    details: `Created brand: "${cleanName}" (${category || 'General'})`,
  });

  return {
    ...brand,
    styles: brand.styles ? JSON.parse(brand.styles) : [],
    savedCount: 0,
  };
}

export async function updateBrand(adminUserId, brandId, { name, logo, description, category, priceSegment, styles, website, featured }) {
  const existing = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!existing) throw new Error('Brand not found.');

  const data = {};
  if (name && name.trim() !== '') data.name = name.trim();
  if (logo !== undefined) data.logo = logo?.trim() || null;
  if (description !== undefined) data.description = description?.trim() || null;
  if (category !== undefined) data.category = category?.trim() || null;
  if (priceSegment !== undefined) data.priceSegment = priceSegment?.trim() || null;
  if (styles !== undefined) data.styles = styles ? JSON.stringify(Array.isArray(styles) ? styles : [styles]) : null;
  if (website !== undefined) data.website = website?.trim() || null;
  if (featured !== undefined) data.featured = Boolean(featured);

  const updated = await prisma.brand.update({
    where: { id: brandId },
    data,
    include: { _count: { select: { savedBy: true } } },
  });

  await logAuditEvent({
    userId: adminUserId,
    action: 'UPDATE',
    entity: 'Brand',
    entityId: brandId,
    details: `Updated brand: "${updated.name}"`,
  });

  return {
    ...updated,
    styles: updated.styles ? JSON.parse(updated.styles) : [],
    savedCount: updated._count.savedBy,
  };
}

export async function deleteBrand(adminUserId, brandId) {
  const existing = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!existing) throw new Error('Brand not found.');

  await prisma.savedBrand.deleteMany({ where: { brandId } });
  await prisma.brand.delete({ where: { id: brandId } });

  await logAuditEvent({
    userId: adminUserId,
    action: 'DELETE',
    entity: 'Brand',
    entityId: brandId,
    details: `Deleted brand: "${existing.name}"`,
  });

  return { success: true };
}

// ════════════════════════════════════════════════════════════════
// 8. MEDIA LIBRARY
// ════════════════════════════════════════════════════════════════
export async function getMediaFiles() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    return [];
  }

  const files = await fs.promises.readdir(uploadsDir);
  const mediaList = [];

  for (const filename of files) {
    try {
      const filePath = path.join(uploadsDir, filename);
      const stat = await fs.promises.stat(filePath);
      if (stat.isFile()) {
        const ext = path.extname(filename).toLowerCase();
        mediaList.push({
          id: filename,
          filename,
          url: `/uploads/${filename}`,
          size: stat.size,
          sizeFormatted: `${(stat.size / 1024).toFixed(1)} KB`,
          extension: ext,
          createdAt: stat.birthtime || stat.mtime,
        });
      }
    } catch {
      // Ignore individual read errors
    }
  }

  return mediaList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function deleteMediaFile(adminUserId, filename) {
  const safeFilename = path.basename(filename);
  const filePath = path.join(uploadsDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    throw new Error('Media file not found.');
  }

  await fs.promises.unlink(filePath);

  await logAuditEvent({
    userId: adminUserId,
    action: 'DELETE',
    entity: 'MediaFile',
    entityId: safeFilename,
    details: `Deleted media file: ${safeFilename}`,
  });

  return { success: true };
}

// ════════════════════════════════════════════════════════════════
// 9. MODERATION QUEUE & REPORTS
// ════════════════════════════════════════════════════════════════
export async function getReports({ page = 1, limit = 20, status, reportedItemType, search }) {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (status && status !== 'ALL') where.status = status;
  if (reportedItemType && reportedItemType !== 'ALL') where.reportedItemType = reportedItemType;

  if (search && search.trim() !== '') {
    const q = search.trim();
    where.OR = [
      { reason: { contains: q } },
      { details: { contains: q } },
      { reportedItemName: { contains: q } },
      { reporter: { email: { contains: q } } },
    ];
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
        resolvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.report.count({ where }),
  ]);

  return { reports, total, page: parseInt(page), limit: parseInt(limit) };
}

export async function createReport(reporterUserId, { reportedItemType, reportedItemId, reportedItemName, reason, details }) {
  if (!reportedItemType || !reportedItemId || !reason) {
    throw new Error('Item type, Item ID, and reason are required to submit a report.');
  }

  const report = await prisma.report.create({
    data: {
      reporterId: reporterUserId,
      reportedItemType,
      reportedItemId: String(reportedItemId),
      reportedItemName: reportedItemName || null,
      reason,
      details: details?.trim() || null,
    },
    include: {
      reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  return report;
}

export async function resolveReport(adminUserId, reportId, resolutionNotes = '') {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new Error('Report not found.');

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: 'RESOLVED',
      resolutionNotes: resolutionNotes?.trim() || 'Resolved by administrator',
      resolvedById: adminUserId,
      resolvedAt: new Date(),
    },
    include: {
      reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
      resolvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  await logAuditEvent({
    userId: adminUserId,
    action: 'RESOLVE_REPORT',
    entity: 'Report',
    entityId: reportId,
    details: `Resolved report for ${report.reportedItemType} (Reason: ${report.reason}). Notes: ${resolutionNotes || 'None'}`,
  });

  return updated;
}

export async function dismissReport(adminUserId, reportId, resolutionNotes = '') {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new Error('Report not found.');

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: 'DISMISSED',
      resolutionNotes: resolutionNotes?.trim() || 'Dismissed by administrator',
      resolvedById: adminUserId,
      resolvedAt: new Date(),
    },
    include: {
      reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
      resolvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  await logAuditEvent({
    userId: adminUserId,
    action: 'DISMISS_REPORT',
    entity: 'Report',
    entityId: reportId,
    details: `Dismissed report for ${report.reportedItemType}. Notes: ${resolutionNotes || 'None'}`,
  });

  return updated;
}

// ════════════════════════════════════════════════════════════════
// 10. AUDIT LOG VIEWER
// ════════════════════════════════════════════════════════════════
export async function getAuditLogs({ page = 1, limit = 50, action, entity, search }) {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (action && action !== 'ALL') where.action = action;
  if (entity && entity !== 'ALL') where.entity = entity;
  if (search && search.trim() !== '') {
    const q = search.trim();
    where.OR = [
      { details: { contains: q } },
      { entity: { contains: q } },
      { action: { contains: q } },
      { user: { email: { contains: q } } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page: parseInt(page), limit: parseInt(limit) };
}

// ════════════════════════════════════════════════════════════════
// 11. SYSTEM HEALTH & MONITORING
// ════════════════════════════════════════════════════════════════
const serverStartTime = Date.now();

export async function getSystemHealth() {
  let dbStatus = 'online';
  let dbLatencyMs = 0;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
  } catch {
    dbStatus = 'offline';
  }

  const uptimeSec = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = uptimeSec % 60;

  const mem = process.memoryUsage();

  return {
    apiStatus: 'online',
    dbStatus,
    dbLatencyMs,
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    uptimeSeconds: uptimeSec,
    serverTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    environment: env.NODE_ENV || 'development',
    memoryUsage: {
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
      rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
    },
  };
}

import prisma from '../config/database.js';
import { successResponse } from '../utils/apiResponse.js';

/** GET /api/recommendations */
export async function getRecommendations(req, res, next) {
  try {
    const userId = req.user.id;
    const { type } = req.query;
    const recommendations = [];

    // Fetch user data for recommendation engine
    const [user, wardrobeItems, savedStyles, outfits, habits] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { preferredStyles: true, preferredColors: true, primaryOccasion: true, seasonFocus: true } }),
      prisma.wardrobeItem.findMany({ where: { userId }, select: { id: true, name: true, image: true, category: true, color: true, style: true, brand: true, season: true } }),
      prisma.savedStyle.findMany({ where: { userId }, include: { style: { include: { category: true } } } }),
      prisma.outfit.findMany({ where: { userId }, select: { id: true, occasion: true, style: true } }),
      prisma.habit.findMany({ where: { userId }, select: { title: true, currentStreak: true } }),
    ]);

    const userStyles = user?.preferredStyles ? JSON.parse(user.preferredStyles) : [];
    const userColors = user?.preferredColors ? JSON.parse(user.preferredColors) : [];
    const wardrobeCategories = {};
    wardrobeItems.forEach(item => {
      wardrobeCategories[item.category] = (wardrobeCategories[item.category] || 0) + 1;
    });

    // --- Style Recommendations ---
    if (!type || type === 'style') {
      // Recommend styles based on wardrobe composition
      const tops = wardrobeItems.filter(i => i.category === 'Tops');
      const bottoms = wardrobeItems.filter(i => i.category === 'Bottoms');
      const outerwear = wardrobeItems.filter(i => i.category === 'Outerwear');

      if (tops.length > 0 && bottoms.length > 0) {
        recommendations.push({
          id: 'rec-style-1',
          type: 'style',
          title: 'Smart Casual Combination',
          image: tops[0]?.image || 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&h=400&fit=crop&q=80',
          reason: `Based on your wardrobe: Your "${tops[0]?.name}" pairs well with "${bottoms[0]?.name}" for a smart casual look.`,
          tags: ['Smart Casual', 'Wardrobe Mix'],
          match: 90,
        });
      }

      if (outerwear.length > 0) {
        recommendations.push({
          id: 'rec-style-2',
          type: 'style',
          title: 'Layered Look',
          image: outerwear[0]?.image || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=400&fit=crop&q=80',
          reason: `Your "${outerwear[0]?.name}" is perfect for layering. Pair it with a simple top for an effortless look.`,
          tags: ['Layered', 'Seasonal'],
          match: 85,
        });
      }

      // Based on saved styles
      savedStyles.forEach((ss, i) => {
        if (i < 2) {
          recommendations.push({
            id: `rec-saved-${ss.id}`,
            type: 'style',
            title: `Explore ${ss.style.name} Further`,
            image: ss.style.image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=400&fit=crop&q=80',
            reason: `You saved "${ss.style.name}" as a favorite. Explore more outfits in this style.`,
            tags: [ss.style.name, ss.style.category?.name || 'Style'].filter(Boolean),
            match: 82 - i * 3,
          });
        }
      });
    }

    // --- Item Recommendations ---
    if (!type || type === 'item') {
      // Recommend items to fill gaps
      const missingCategories = ['Tops', 'Bottoms', 'Shoes', 'Outerwear', 'Accessories']
        .filter(c => !wardrobeCategories[c] || wardrobeCategories[c] < 2);

      missingCategories.forEach((cat, i) => {
        if (i < 2) {
          recommendations.push({
            id: `rec-item-${cat}`,
            type: 'item',
            title: `Add More ${cat}`,
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop&q=80',
            reason: `Your wardrobe has ${wardrobeCategories[cat] || 0} items in ${cat}. Adding more variety would expand your outfit options.`,
            tags: [cat, 'Wardrobe Gap', 'Essential'],
            match: 78 - i * 5,
          });
        }
      });

      // Color-based recommendation
      const colors = wardrobeItems.map(i => i.color).filter(Boolean);
      const uniqueColors = [...new Set(colors)];
      if (uniqueColors.length < 5 && wardrobeItems.length > 3) {
        recommendations.push({
          id: 'rec-item-color',
          type: 'item',
          title: 'Expand Your Color Palette',
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop&q=80',
          reason: `You primarily wear ${uniqueColors.slice(0, 3).join(', ')}. Adding complementary colors could create fresh outfit combinations.`,
          tags: ['Colors', 'Variety', 'Style'],
          match: 75,
        });
      }
    }

    // --- Outfit Recommendations ---
    if (!type || type === 'outfit') {
      if (wardrobeItems.length >= 3 && outfits.length < wardrobeItems.length / 2) {
        recommendations.push({
          id: 'rec-outfit-1',
          type: 'outfit',
          title: 'Create More Outfits',
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&q=80',
          reason: `You have ${wardrobeItems.length} wardrobe items but only ${outfits.length} outfits. Try combining items in new ways.`,
          tags: ['Outfit Planning', 'Creativity'],
          match: 88,
        });
      }
    }

    // --- Habit Recommendations ---
    if (!type || type === 'habit') {
      if (habits.length === 0) {
        recommendations.push({
          id: 'rec-habit-1',
          type: 'habit',
          title: 'Start a Style Habit',
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop&q=80',
          reason: 'Building a daily outfit planning habit can save time and boost your confidence.',
          tags: ['Productivity', 'Organization'],
          match: 80,
        });
      }

      const topStreak = habits.length > 0 ? Math.max(...habits.map(h => h.currentStreak)) : 0;
      if (topStreak >= 7) {
        const bestHabit = habits.find(h => h.currentStreak === topStreak);
        recommendations.push({
          id: 'rec-habit-streak',
          type: 'habit',
          title: `Keep Your ${bestHabit?.title} Streak!`,
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop&q=80',
          reason: `Amazing! You're on a ${topStreak}-day streak for "${bestHabit?.title}". Keep the momentum going!`,
          tags: ['Streak', 'Motivation', 'Growth'],
          match: 92,
        });
      }
    }

    // Sort by match score
    recommendations.sort((a, b) => b.match - a.match);

    // Filter by type if specified
    const filtered = type ? recommendations.filter(r => r.type === type) : recommendations;

    return successResponse(res, filtered.slice(0, 12));
  } catch (error) { next(error); }
}

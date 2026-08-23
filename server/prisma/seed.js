import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ELEVATE database...\n');

  // ── Clean existing data ──
  console.log('Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.outfitItem.deleteMany();
  await prisma.outfit.deleteMany();
  await prisma.wardrobeItem.deleteMany();
  await prisma.savedBrand.deleteMany();
  await prisma.savedStyle.deleteMany();
  await prisma.habitCompletion.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.skillMilestone.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.task.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.style.deleteMany();
  await prisma.fashionCategory.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──
  console.log('Creating users...');
  const password = await bcrypt.hash('Demo123!', 12);
  const adminPassword = await bcrypt.hash('Admin123!', 12);

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@elevate.local',
      phone: '+15550199',
      password,
      firstName: 'Alex',
      lastName: 'Morgan',
      role: 'USER',
      bio: 'Fashion enthusiast and personal development advocate.',
      preferredStyles: JSON.stringify(['Minimal', 'Smart Casual', 'Quiet Luxury']),
      preferredColors: JSON.stringify(['Neutrals', 'Earth Tones']),
      primaryOccasion: 'Casual',
      seasonFocus: 'All Season',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@elevate.local',
      phone: '+15550100',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      bio: 'Platform administrator.',
    },
  });

  console.log(`  ✓ Demo user: demo@elevate.local / Demo123!`);
  console.log(`  ✓ Admin user: admin@elevate.local / Admin123!`);

  // ── Fashion Categories ──
  console.log('Creating comprehensive fashion categories...');
  const categoriesData = [
    { name: 'Formal', slug: 'formal', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=750&fit=crop&q=80', description: 'Tailored suits, dress shirts, and polished silhouettes for executive and gala events.' },
    { name: 'Casual', slug: 'casual', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&h=750&fit=crop&q=80', description: 'Comfortable, versatile daily clothing built on denim, cotton basics, and relaxed fits.' },
    { name: 'Smart Casual', slug: 'smart-casual', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&h=750&fit=crop&q=80', description: 'Polished yet relaxed looks bridging the gap between formal and everyday casual.' },
    { name: 'Streetwear', slug: 'streetwear', image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=600&h=750&fit=crop&q=80', description: 'Contemporary urban street culture, oversized hoodies, tactical cargo, and hype sneakers.' },
    { name: 'Minimal', slug: 'minimal', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=750&fit=crop&q=80', description: 'Clean lines, neutral tones, and timeless pieces emphasizing simplicity and fabric quality.' },
    { name: 'Aesthetic', slug: 'aesthetic', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=750&fit=crop&q=80', description: 'Curated visual moodboards prioritizing color harmony, silhouette, and artistic expression.' },
    { name: 'Vintage', slug: 'vintage', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&h=750&fit=crop&q=80', description: 'Retro heritage and archive pieces from 60s, 70s, 80s, and 90s with modern flair.' },
    { name: 'Athleisure', slug: 'athleisure', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=750&fit=crop&q=80', description: 'Performance activewear engineered for both workouts and street-ready comfort.' },
    { name: 'Layered', slug: 'layered', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=750&fit=crop&q=80', description: 'Mastering dimensional garment volume, overshirts, knitwear, and structured outerwear.' },
    { name: 'Seasonal', slug: 'seasonal', image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=600&h=750&fit=crop&q=80', description: 'Weather-focused style rotations spanning Summer, Winter, Monsoon, Spring, and Autumn.' },
    { name: 'Avant-Garde', slug: 'avant-garde', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=750&fit=crop&q=80', description: 'Sculptural high-fashion runway silhouettes and architectural deconstructed design.' },
  ];

  const categories = await Promise.all(categoriesData.map(c => prisma.fashionCategory.create({ data: c })));

  const catMap = {};
  categories.forEach((c) => {
    catMap[c.name] = c.id;
  });

  // ── Styles (86 Styles Across All Categories) ──
  console.log('Creating comprehensive fashion styles catalogue...');
  const stylesData = [
    // ════════════════════════════════════════════════════════════
    // 1. Formal Category (8 Styles)
    // ════════════════════════════════════════════════════════════
    {
      name: 'Classic Formal',
      slug: 'classic-formal',
      categoryId: catMap['Formal'],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&h=900&fit=crop&q=85',
      description: 'Double-breasted navy or charcoal wool suit with crisp white dress shirt, silk tie, and polished Oxford shoes.',
      tags: JSON.stringify(['Bespoke', 'Tailoring', 'Executive', 'Classic']),
    },
    {
      name: 'Business Formal',
      slug: 'business-formal',
      categoryId: catMap['Formal'],
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=700&h=900&fit=crop&q=85',
      description: 'Single-breasted charcoal two-piece suit paired with a subtle spread-collar shirt and black leather cap-toe shoes.',
      tags: JSON.stringify(['Corporate', 'Professional', 'Structured', 'Office']),
    },
    {
      name: 'Modern Formal',
      slug: 'modern-formal',
      categoryId: catMap['Formal'],
      image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=700&h=900&fit=crop&q=85',
      description: 'Slim-cut tailored silhouette in slate blue, featuring peak lapels, pocket square, and monk strap footwear.',
      tags: JSON.stringify(['Modern', 'Slim Cut', 'Peak Lapels', 'Evening']),
    },
    {
      name: 'Evening Formal',
      slug: 'evening-formal',
      categoryId: catMap['Formal'],
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700&h=900&fit=crop&q=85',
      description: 'Midnight blue tuxedo with satin grosgrain lapels, French cuff evening shirt, silk bow tie, and patent leather shoes.',
      tags: JSON.stringify(['Black Tie', 'Tuxedo', 'Satin', 'Gala']),
    },
    {
      name: 'Minimal Formal',
      slug: 'minimal-formal',
      categoryId: catMap['Formal'],
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop&q=85',
      description: 'Deconstructed dark monochromatic suit with collarless button-down shirt and streamlined leather dress shoes.',
      tags: JSON.stringify(['Minimalist', 'Monochrome', 'Collarless', 'Contemporary']),
    },
    {
      name: 'Formal Layering',
      slug: 'formal-layering',
      categoryId: catMap['Formal'],
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&h=900&fit=crop&q=85',
      description: 'Structured camel wool overcoat draped over a tailored charcoal three-piece suit and silk necktie.',
      tags: JSON.stringify(['Overcoat', 'Three-Piece', 'Camel Coat', 'Winter']),
    },
    {
      name: 'Monochrome Formal',
      slug: 'monochrome-formal',
      categoryId: catMap['Formal'],
      image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=700&h=900&fit=crop&q=85',
      description: 'All-black formal ensemble featuring jet-black blazer, matching dress trousers, black knit tie, and polished derby shoes.',
      tags: JSON.stringify(['All Black', 'Noir', 'High Contrast', 'Sharp']),
    },
    {
      name: 'Summer Formal',
      slug: 'summer-formal',
      categoryId: catMap['Formal'],
      image: 'https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=700&h=900&fit=crop&q=85',
      description: 'Unlined sand-colored linen-blend suit with light sky-blue poplin shirt and suede tassel loafers.',
      tags: JSON.stringify(['Linen', 'Breathable', 'Summer', 'Lightweight']),
    },

    // ════════════════════════════════════════════════════════════
    // 2. Casual Category (8 Styles)
    // ════════════════════════════════════════════════════════════
    {
      name: 'Everyday Casual',
      slug: 'everyday-casual',
      categoryId: catMap['Casual'],
      image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&h=900&fit=crop&q=85',
      description: 'Heavyweight organic cotton crewneck tee, washed medium-blue denim jeans, and pristine white minimalist leather sneakers.',
      tags: JSON.stringify(['Essential', 'Cotton', 'Denim', 'Sneakers']),
    },
    {
      name: 'Relaxed Casual',
      slug: 'relaxed-casual',
      categoryId: catMap['Casual'],
      image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=700&h=900&fit=crop&q=85',
      description: 'Loose-fit garment-dyed hoodie over straight-leg washed cotton chinos and retro court trainers.',
      tags: JSON.stringify(['Comfort', 'Hoodie', 'Relaxed Fit', 'Weekend']),
    },
    {
      name: 'Clean Casual',
      slug: 'clean-casual',
      categoryId: catMap['Casual'],
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&h=900&fit=crop&q=85',
      description: 'Fitted white pique polo shirt with tailored beige chinos and clean canvas low-top sneakers.',
      tags: JSON.stringify(['Clean', 'Polo', 'Crisp', 'Versatile']),
    },
    {
      name: 'Weekend Casual',
      slug: 'weekend-casual',
      categoryId: catMap['Casual'],
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&h=900&fit=crop&q=85',
      description: 'Slub-knit waffle long-sleeve tee paired with olive cargo pants and suede trail sneakers.',
      tags: JSON.stringify(['Weekend', 'Waffle Knit', 'Olive', 'Off-Duty']),
    },
    {
      name: 'Minimal Casual',
      slug: 'minimal-casual',
      categoryId: catMap['Casual'],
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=700&h=900&fit=crop&q=85',
      description: 'Boxy drop-shoulder black tee with charcoal drawstring trousers and leather slide sandals.',
      tags: JSON.stringify(['Boxy Fit', 'Minimalist', 'Muted', 'Effortless']),
    },
    {
      name: 'Oversized Casual',
      slug: 'oversized-casual',
      categoryId: catMap['Casual'],
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=700&h=900&fit=crop&q=85',
      description: 'Oversized cotton poplin button-down shirt worn open over a tank top and wide-leg pleated trousers.',
      tags: JSON.stringify(['Oversized', 'Wide Leg', 'Drape', 'Flowy']),
    },
    {
      name: 'Denim Casual',
      slug: 'denim-casual',
      categoryId: catMap['Casual'],
      image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700&h=900&fit=crop&q=85',
      description: 'Classic trucker jacket in washed indigo paired with black denim jeans and Chelsea leather boots.',
      tags: JSON.stringify(['Trucker Jacket', 'Denim on Denim', 'Indigo', 'Rugged']),
    },
    {
      name: 'Summer Casual',
      slug: 'summer-casual',
      categoryId: catMap['Casual'],
      image: 'https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=700&h=900&fit=crop&q=85',
      description: 'Camp-collar printed resort shirt with sage green drawstring linen shorts and woven espadrilles.',
      tags: JSON.stringify(['Resort', 'Camp Collar', 'Shorts', 'Summer']),
    },

    // ════════════════════════════════════════════════════════════
    // 3. Smart Casual Category (8 Styles)
    // ════════════════════════════════════════════════════════════
    {
      name: 'Office Smart Casual',
      slug: 'office-smart-casual',
      categoryId: catMap['Smart Casual'],
      image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=700&h=900&fit=crop&q=85',
      description: 'Unstructured navy blazer, light grey wool trousers, fine-gauge merino knit crewneck, and leather derby shoes.',
      tags: JSON.stringify(['Office', 'Navy Blazer', 'Merino Wool', 'Business']),
    },
    {
      name: 'Minimal Smart Casual',
      slug: 'minimal-smart-casual',
      categoryId: catMap['Smart Casual'],
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&h=900&fit=crop&q=85',
      description: 'Clean black Harrington jacket with ivory mock-neck knit, dark tailored trousers, and minimalist Chelsea boots.',
      tags: JSON.stringify(['Mock Neck', 'Harrington', 'Monochrome', 'Sharp']),
    },
    {
      name: 'Layered Smart Casual',
      slug: 'layered-smart-casual',
      categoryId: catMap['Smart Casual'],
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&h=900&fit=crop&q=85',
      description: 'Tailored overshirt in textured wool over an Oxford button-down and pleated tapered trousers.',
      tags: JSON.stringify(['Overshirt', 'Wool Texture', 'Layered', 'Transitional']),
    },
    {
      name: 'Weekend Smart Casual',
      slug: 'weekend-smart-casual',
      categoryId: catMap['Smart Casual'],
      image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&h=900&fit=crop&q=85',
      description: 'Textured knit cardigan over a garment-washed tee, slim stretch chinos, and suede loafers.',
      tags: JSON.stringify(['Cardigan', 'Knitwear', 'Suede Loafers', 'Relaxed']),
    },
    {
      name: 'Neutral Smart Casual',
      slug: 'neutral-smart-casual',
      categoryId: catMap['Smart Casual'],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&h=900&fit=crop&q=85',
      description: 'Tonal oatmeal cashmere sweater, cream pleated trousers, and sand suede desert boots.',
      tags: JSON.stringify(['Tonal', 'Oatmeal', 'Cashmere', 'Warm Neutral']),
    },
    {
      name: 'Business Casual',
      slug: 'business-casual',
      categoryId: catMap['Smart Casual'],
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=700&h=900&fit=crop&q=85',
      description: 'Patterned houndstooth sport coat, crisp white dress shirt, navy chinos, and leather brogues.',
      tags: JSON.stringify(['Houndstooth', 'Brogues', 'Tailored', 'Corporate']),
    },
    {
      name: 'Evening Smart Casual',
      slug: 'evening-smart-casual',
      categoryId: catMap['Smart Casual'],
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=700&h=900&fit=crop&q=85',
      description: 'Black silk-blend polo shirt tucked into tailored charcoal trousers with horsebit loafers.',
      tags: JSON.stringify(['Silk Blend', 'Horsebit', 'Date Night', 'Evening']),
    },
    {
      name: 'Contemporary Smart Casual',
      slug: 'contemporary-smart-casual',
      categoryId: catMap['Smart Casual'],
      image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=700&h=900&fit=crop&q=85',
      description: 'Band-collar poplin shirt with relaxed pleated trousers and clean white leather tennis shoes.',
      tags: JSON.stringify(['Band Collar', 'Pleats', 'Contemporary', 'Modern']),
    },

    // ════════════════════════════════════════════════════════════
    // 4. Streetwear Category (8 Styles)
    // ════════════════════════════════════════════════════════════
    {
      name: 'Minimal Streetwear',
      slug: 'minimal-streetwear',
      categoryId: catMap['Streetwear'],
      image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=700&h=900&fit=crop&q=85',
      description: 'Heavyweight 400gsm boxy hoodie in washed asphalt, relaxed nylon track pants, and retro runner sneakers.',
      tags: JSON.stringify(['Heavyweight', 'Boxy Hoodie', 'Track Pants', 'Clean']),
    },
    {
      name: 'Oversized Streetwear',
      slug: 'oversized-streetwear',
      categoryId: catMap['Streetwear'],
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=700&h=900&fit=crop&q=85',
      description: 'Dropped-shoulder graphic tee over baggy carpenter denim with raw hems and chunky high-top sneakers.',
      tags: JSON.stringify(['Baggy', 'Carpenter Denim', 'Drop Shoulder', 'Skate']),
    },
    {
      name: 'Monochrome Streetwear',
      slug: 'monochrome-streetwear',
      categoryId: catMap['Streetwear'],
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&h=900&fit=crop&q=85',
      description: 'All-black street aesthetic with oversized technical bomber jacket, cargo sweatpants, and black runner shoes.',
      tags: JSON.stringify(['All Black', 'Bomber', 'Street Noir', 'Stealth']),
    },
    {
      name: 'Layered Streetwear',
      slug: 'layered-streetwear',
      categoryId: catMap['Streetwear'],
      image: 'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?w=700&h=900&fit=crop&q=85',
      description: 'Distressed denim vest over an oversized fleece hoodie, layered over longline t-shirt with tactical pants.',
      tags: JSON.stringify(['Fleece', 'Layering', 'Tactical', 'Urban']),
    },
    {
      name: 'Sneaker Streetwear',
      slug: 'sneaker-streetwear',
      categoryId: catMap['Streetwear'],
      image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&h=900&fit=crop&q=85',
      description: 'Hype sneaker focal point styled with cuffed selvedge denim, vintage graphic sweatshirt, and corduroy 5-panel cap.',
      tags: JSON.stringify(['Sneakerhead', 'Hype', '5-Panel', 'Street Heat']),
    },
    {
      name: 'Utility Streetwear',
      slug: 'utility-streetwear',
      categoryId: catMap['Streetwear'],
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&h=900&fit=crop&q=85',
      description: 'Multi-pocket tactical vest, durable ripstop cargo trousers, cross-body chest rig, and trail sneakers.',
      tags: JSON.stringify(['Ripstop', 'Tactical Vest', 'Multi Pocket', 'Utility']),
    },
    {
      name: 'Urban Streetwear',
      slug: 'urban-streetwear',
      categoryId: catMap['Streetwear'],
      image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=700&h=900&fit=crop&q=85',
      description: 'Colorblock windbreaker jacket with relaxed cargo joggers, bucket hat, and skate shoes.',
      tags: JSON.stringify(['Windbreaker', 'Bucket Hat', 'Metropolitan', '90s Vibe']),
    },
    {
      name: 'Vintage Streetwear',
      slug: 'vintage-streetwear',
      categoryId: catMap['Streetwear'],
      image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700&h=900&fit=crop&q=85',
      description: '90s collegiate embroidered crewneck, washed carpenter shorts, tube socks, and retro basketball kicks.',
      tags: JSON.stringify(['90s Retro', 'Embroidered', 'Collegiate', 'Vintage']),
    },

    // ════════════════════════════════════════════════════════════
    // 5. Minimal Category (8 Styles)
    // ════════════════════════════════════════════════════════════
    {
      name: 'Neutral Minimal',
      slug: 'neutral-minimal',
      categoryId: catMap['Minimal'],
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&h=900&fit=crop&q=85',
      description: 'Warm taupe wool sweater, ecru straight trousers, and minimalist leather trainers with zero excess branding.',
      tags: JSON.stringify(['Taupe', 'Ecru', 'Clean Lines', 'Pure']),
    },
    {
      name: 'Monochrome Minimal',
      slug: 'monochrome-minimal',
      categoryId: catMap['Minimal'],
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop&q=85',
      description: 'Black cashmere crewneck, tailored black wool trousers, and smooth matte black leather Chelsea boots.',
      tags: JSON.stringify(['Monochrome', 'Noir', 'Cashmere', 'Matte']),
    },
    {
      name: 'Clean Minimal',
      slug: 'clean-minimal',
      categoryId: catMap['Minimal'],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&h=900&fit=crop&q=85',
      description: 'Crisp optic white tee, relaxed navy cotton trousers, and minimalist leather tennis shoes.',
      tags: JSON.stringify(['Optic White', 'Navy', 'Simplicity', 'Timeless']),
    },
    {
      name: 'Scandinavian Minimal',
      slug: 'scandinavian-minimal',
      categoryId: catMap['Minimal'],
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=700&h=900&fit=crop&q=85',
      description: 'Copenhagen oversized double-face wool coat, cream turtleneck, and wide pleated wool trousers.',
      tags: JSON.stringify(['Scandi', 'Double Face', 'Turtleneck', 'Nordic']),
    },
    {
      name: 'Smart Minimal',
      slug: 'smart-minimal',
      categoryId: catMap['Minimal'],
      image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=700&h=900&fit=crop&q=85',
      description: 'Collarless unstructured blazer in dark charcoal with fine gauge knit and tapered trousers.',
      tags: JSON.stringify(['Collarless', 'Fine Gauge', 'Tailored', 'Sharp']),
    },
    {
      name: 'Casual Minimal',
      slug: 'casual-minimal',
      categoryId: catMap['Minimal'],
      image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&h=900&fit=crop&q=85',
      description: 'Heavyweight organic linen shirt with relaxed drawstring cotton pants and minimalist slides.',
      tags: JSON.stringify(['Organic Linen', 'Drawstring', 'Effortless', 'Relaxed']),
    },
    {
      name: 'Formal Minimal',
      slug: 'formal-minimal',
      categoryId: catMap['Minimal'],
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=700&h=900&fit=crop&q=85',
      description: 'Single-button peak-lapel black suit with concealed-placket dress shirt and seamless dress shoes.',
      tags: JSON.stringify(['Single Button', 'Concealed Placket', 'Sleek', 'Modern']),
    },
    {
      name: 'Seasonal Minimal',
      slug: 'seasonal-minimal',
      categoryId: catMap['Minimal'],
      image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=700&h=900&fit=crop&q=85',
      description: 'Lightweight unlined cotton-linen trench coat over neutral knitwear and tailored linen trousers.',
      tags: JSON.stringify(['Linen Trench', 'Transitional', 'Unlined', 'Neutral']),
    },

    // ════════════════════════════════════════════════════════════
    // 6. Aesthetic Category (8 Styles)
    // ════════════════════════════════════════════════════════════
    {
      name: 'Clean Aesthetic',
      slug: 'clean-aesthetic',
      categoryId: catMap['Aesthetic'],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&h=900&fit=crop&q=85',
      description: 'Crisp linen button-down with wide-leg beige pleated trousers, vintage metal sunglasses, and leather mules.',
      tags: JSON.stringify(['Clean Aesthetic', 'Linen', 'Pleated', 'Soft Light']),
    },
    {
      name: 'Dark Aesthetic',
      slug: 'dark-aesthetic',
      categoryId: catMap['Aesthetic'],
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&h=900&fit=crop&q=85',
      description: 'Draped black asymmetrical cardigan over distressed raw-edge tee, wax-coated denim, and combat boots.',
      tags: JSON.stringify(['Dark Aesthetic', 'Asymmetrical', 'Waxed Denim', 'Moody']),
    },
    {
      name: 'Neutral Aesthetic',
      slug: 'neutral-aesthetic',
      categoryId: catMap['Aesthetic'],
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&h=900&fit=crop&q=85',
      description: 'Tone-on-tone camel knit polo, sand-washed cargo trousers, and suede platform sneakers.',
      tags: JSON.stringify(['Tone-on-Tone', 'Sand', 'Suede', 'Cozy']),
    },
    {
      name: 'Vintage Aesthetic',
      slug: 'vintage-aesthetic',
      categoryId: catMap['Aesthetic'],
      image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700&h=900&fit=crop&q=85',
      description: 'Faded graphic souvenir tee with high-waisted corduroy pants and canvas sneakers with amber lenses.',
      tags: JSON.stringify(['Vintage Vibe', 'Corduroy', 'Amber Lenses', 'Nostalgia']),
    },
    {
      name: 'Soft Aesthetic',
      slug: 'soft-aesthetic',
      categoryId: catMap['Aesthetic'],
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=700&h=900&fit=crop&q=85',
      description: 'Pastel lavender mohair cardigan over cream heavyweight tee and relaxed washed light-blue jeans.',
      tags: JSON.stringify(['Mohair', 'Pastel', 'Soft Texture', 'Dreamy']),
    },
    {
      name: 'Urban Aesthetic',
      slug: 'urban-aesthetic',
      categoryId: catMap['Aesthetic'],
      image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=700&h=900&fit=crop&q=85',
      description: 'Technical cropped jacket with oversized pleated parachute pants and platform trail runners.',
      tags: JSON.stringify(['Parachute Pants', 'Cropped', 'Platform', 'Modernist']),
    },
    {
      name: 'Minimal Aesthetic',
      slug: 'minimal-aesthetic',
      categoryId: catMap['Aesthetic'],
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop&q=85',
      description: 'Architectural boxy poplin shirt paired with fluid wide-leg linen trousers and woven leather sandals.',
      tags: JSON.stringify(['Architectural', 'Fluid', 'Linen', 'Zen']),
    },
    {
      name: 'Layered Aesthetic',
      slug: 'layered-aesthetic',
      categoryId: catMap['Aesthetic'],
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&h=900&fit=crop&q=85',
      description: 'Cropped vest over oversized striped shirt, draped knit sweater tied across chest, and wide chinos.',
      tags: JSON.stringify(['Sweater Wrap', 'Cropped Vest', 'Layering', 'Editorial']),
    },

    // ════════════════════════════════════════════════════════════
    // 7. Vintage Category (8 Styles)
    // ════════════════════════════════════════════════════════════
    {
      name: 'Classic Vintage',
      slug: 'classic-vintage',
      categoryId: catMap['Vintage'],
      image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700&h=900&fit=crop&q=85',
      description: '1970s style suede trucker jacket with shearling collar, ribbed knitwear, and vintage raw denim jeans.',
      tags: JSON.stringify(['70s Style', 'Shearling', 'Suede', 'Retro']),
    },
    {
      name: 'Retro Casual',
      slug: 'retro-casual',
      categoryId: catMap['Vintage'],
      image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=700&h=900&fit=crop&q=85',
      description: 'Colorblock velour track jacket with relaxed washed jeans and gum-sole vintage trainers.',
      tags: JSON.stringify(['Velour', 'Gum Sole', 'Track Jacket', '80s']),
    },
    {
      name: 'Heritage Style',
      slug: 'heritage-style',
      categoryId: catMap['Vintage'],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&h=900&fit=crop&q=85',
      description: 'Waxed cotton field jacket, Harris tweed waistcoat, tattersall shirt, and brogue boots.',
      tags: JSON.stringify(['Waxed Cotton', 'Harris Tweed', 'Heritage', 'Country']),
    },
    {
      name: 'Vintage Denim',
      slug: 'vintage-denim',
      categoryId: catMap['Vintage'],
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&h=900&fit=crop&q=85',
      description: '14oz selvedge denim jacket with matching high-rise raw denim jeans and red-wing leather work boots.',
      tags: JSON.stringify(['Selvedge', '14oz', 'Raw Denim', 'Americana']),
    },
    {
      name: 'Vintage Formal',
      slug: 'vintage-formal',
      categoryId: catMap['Vintage'],
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=700&h=900&fit=crop&q=85',
      description: 'Double-breasted chalk-stripe wool suit with wide peak lapels, silk foulard pocket square, and oxblood brogues.',
      tags: JSON.stringify(['Chalk Stripe', 'Wide Lapels', 'Oxblood', 'Classic Sartorial']),
    },
    {
      name: '90s Inspired',
      slug: '90s-inspired',
      categoryId: catMap['Vintage'],
      image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=700&h=900&fit=crop&q=85',
      description: 'Oversized striped polo shirt, stonewash carpenter denim, bucket hat, and classic skate canvas shoes.',
      tags: JSON.stringify(['90s Revival', 'Stonewash', 'Striped Polo', 'Grungy']),
    },
    {
      name: 'Old Money Inspired',
      slug: 'old-money-inspired',
      categoryId: catMap['Vintage'],
      image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=700&h=900&fit=crop&q=85',
      description: 'Heritage cable-knit tennis sweater with tipped V-neck, pleated white trousers, and boat shoes.',
      tags: JSON.stringify(['Tennis Sweater', 'Tipped V-Neck', 'Ivy', 'Heritage']),
    },
    {
      name: 'Retro Streetwear',
      slug: 'retro-streetwear',
      categoryId: catMap['Vintage'],
      image: 'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?w=700&h=900&fit=crop&q=85',
      description: 'Vintage nylon athletic windbreaker, graphic college tee, track shorts, and vintage running shoes.',
      tags: JSON.stringify(['Nylon Windbreaker', 'Athletic Heritage', 'Retro Street', '90s']),
    },

    // ════════════════════════════════════════════════════════════
    // 8. Athleisure Category (8 Styles)
    // ════════════════════════════════════════════════════════════
    {
      name: 'Everyday Athleisure',
      slug: 'everyday-athleisure',
      categoryId: catMap['Athleisure'],
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&h=900&fit=crop&q=85',
      description: 'Tailored fleece zip jacket, 4-way stretch joggers, breathable technical tee, and cushioned knit sneakers.',
      tags: JSON.stringify(['Fleece Zip', '4-Way Stretch', 'Joggers', 'Comfort']),
    },
    {
      name: 'Minimal Athleisure',
      slug: 'minimal-athleisure',
      categoryId: catMap['Athleisure'],
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop&q=85',
      description: 'Seamless mock-neck compression top with clean technical commuter trousers and minimalist running shoes.',
      tags: JSON.stringify(['Seamless', 'Compression', 'Commuter', 'Sleek']),
    },
    {
      name: 'Sport Casual',
      slug: 'sport-casual',
      categoryId: catMap['Athleisure'],
      image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&h=900&fit=crop&q=85',
      description: 'Half-zip polar fleece pullover with woven training shorts over compression tights and running shoes.',
      tags: JSON.stringify(['Half-Zip', 'Polar Fleece', 'Training', 'Active']),
    },
    {
      name: 'Gym-to-Street',
      slug: 'gym-to-street',
      categoryId: catMap['Athleisure'],
      image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=700&h=900&fit=crop&q=85',
      description: 'Performance bomber jacket over dry-fit workout tee, tapered cargo joggers, and high-performance trainers.',
      tags: JSON.stringify(['Gym-to-Street', 'Performance Bomber', 'Dry-Fit', 'Activewear']),
    },
    {
      name: 'Monochrome Athleisure',
      slug: 'monochrome-athleisure',
      categoryId: catMap['Athleisure'],
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&h=900&fit=crop&q=85',
      description: 'Head-to-toe all-black technical setup: waterproof shell, technical joggers, and stealth black sneakers.',
      tags: JSON.stringify(['All Black', 'Waterproof Shell', 'Stealth', 'Technical']),
    },
    {
      name: 'Layered Athleisure',
      slug: 'layered-athleisure',
      categoryId: catMap['Athleisure'],
      image: 'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?w=700&h=900&fit=crop&q=85',
      description: 'Packable lightweight windbreaker over hooded tech sweatshirt with water-resistant training pants.',
      tags: JSON.stringify(['Packable', 'Windbreaker', 'Tech Hoodie', 'Weatherproof']),
    },
    {
      name: 'Travel Athleisure',
      slug: 'travel-athleisure',
      categoryId: catMap['Athleisure'],
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&h=900&fit=crop&q=85',
      description: 'Ultra-soft modal blend hoodie and sweatpants set styled with clean leather sneakers and luxury weekend duffel.',
      tags: JSON.stringify(['Travel', 'Modal Blend', 'Airport Style', 'Luxury Loungewear']),
    },
    {
      name: 'Summer Athleisure',
      slug: 'summer-athleisure',
      categoryId: catMap['Athleisure'],
      image: 'https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=700&h=900&fit=crop&q=85',
      description: 'Engineered mesh running tank, featherlight 5-inch running shorts, UV protection cap, and trail shoes.',
      tags: JSON.stringify(['Featherlight', 'Running Shorts', 'Summer', 'Breathable']),
    },

    // ════════════════════════════════════════════════════════════
    // 9. Layered Category (8 Styles)
    // ════════════════════════════════════════════════════════════
    {
      name: 'Shirt Layering',
      slug: 'shirt-layering',
      categoryId: catMap['Layered'],
      image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700&h=900&fit=crop&q=85',
      description: 'Heavy flannel overshirt layered over lightweight denim shirt, over a white waffle thermal undershirt.',
      tags: JSON.stringify(['Flannel', 'Double Shirt', 'Thermal', 'Texture']),
    },
    {
      name: 'Jacket Layering',
      slug: 'jacket-layering',
      categoryId: catMap['Layered'],
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&h=900&fit=crop&q=85',
      description: 'Tailored chore jacket over a denim jacket, layered over a fine merino wool crewneck sweater.',
      tags: JSON.stringify(['Chore Jacket', 'Denim Layer', 'Merino', 'Multi Jacket']),
    },
    {
      name: 'Overshirt Style',
      slug: 'overshirt-style',
      categoryId: catMap['Layered'],
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&h=900&fit=crop&q=85',
      description: 'Heavyweight boiled wool overshirt worn open over a fitted ribbed turtleneck and pleated chinos.',
      tags: JSON.stringify(['Boiled Wool', 'Overshirt', 'Ribbed Turtleneck', 'Smart']),
    },
    {
      name: 'Winter Layering',
      slug: 'winter-layering',
      categoryId: catMap['Layered'],
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=700&h=900&fit=crop&q=85',
      description: 'Down-insulated puffer vest over thick cable-knit sweater, topped with a heavy wool overcoat and cashmere scarf.',
      tags: JSON.stringify(['Puffer Vest', 'Cable Knit', 'Wool Coat', 'Sub-Zero']),
    },
    {
      name: 'Minimal Layering',
      slug: 'minimal-layering',
      categoryId: catMap['Layered'],
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&h=900&fit=crop&q=85',
      description: 'Structured technical overshirt over tone-on-tone mock neck with clean tailored wool trousers.',
      tags: JSON.stringify(['Technical Overshirt', 'Mock Neck', 'Tonal', 'Clean']),
    },
    {
      name: 'Street Layering',
      slug: 'street-layering',
      categoryId: catMap['Layered'],
      image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=700&h=900&fit=crop&q=85',
      description: 'Oversized distressed denim jacket layered over heavy French terry hoodie and curved-hem tee.',
      tags: JSON.stringify(['French Terry', 'Distressed Denim', 'Curved Hem', 'Urban']),
    },
    {
      name: 'Smart Layering',
      slug: 'smart-layering',
      categoryId: catMap['Layered'],
      image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=700&h=900&fit=crop&q=85',
      description: 'Fine gauge V-neck merino knit over an Oxford button-down shirt under a tailored herringbone blazer.',
      tags: JSON.stringify(['Herringbone', 'V-Neck', 'Oxford', 'Office Layer']),
    },
    {
      name: 'Transitional Layering',
      slug: 'transitional-layering',
      categoryId: catMap['Layered'],
      image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=700&h=900&fit=crop&q=85',
      description: 'Water-repellent trench coat over a lightweight fleece zip jacket and breathable cotton tee.',
      tags: JSON.stringify(['Trench Coat', 'Transitional', 'Spring/Autumn', 'Versatile']),
    },

    // ════════════════════════════════════════════════════════════
    // 10. Seasonal Category (8 Styles)
    // ════════════════════════════════════════════════════════════
    {
      name: 'Summer Linen & Breeze',
      slug: 'summer-linen',
      categoryId: catMap['Seasonal'],
      image: 'https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=700&h=900&fit=crop&q=85',
      description: 'Breezy open-weave linen shirt, lightweight pleated linen-cotton shorts, and woven leather sandals.',
      tags: JSON.stringify(['Summer', 'Linen', 'Heatwave', 'Breathable', 'Resort']),
    },
    {
      name: 'Winter Heavy Overcoat',
      slug: 'winter-overcoat',
      categoryId: catMap['Seasonal'],
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=700&h=900&fit=crop&q=85',
      description: 'Heavy Melton wool double-breasted overcoat, cashmere turtleneck, corduroy trousers, and shearling boots.',
      tags: JSON.stringify(['Winter', 'Melton Wool', 'Cashmere', 'Cold Weather', 'Shearling']),
    },
    {
      name: 'Monsoon & Rain Protection',
      slug: 'monsoon-rain',
      categoryId: catMap['Seasonal'],
      image: 'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?w=700&h=900&fit=crop&q=85',
      description: 'Gore-Tex waterproof hooded storm parka, water-repellent tapered pants, and seam-sealed storm boots.',
      tags: JSON.stringify(['Monsoon', 'Rainwear', 'Gore-Tex', 'Waterproof', 'Seam-Sealed']),
    },
    {
      name: 'Spring Transitional',
      slug: 'spring-transitional',
      categoryId: catMap['Seasonal'],
      image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=700&h=900&fit=crop&q=85',
      description: 'Lightweight Harrington jacket in sage green, Breton stripe knit tee, light chinos, and canvas sneakers.',
      tags: JSON.stringify(['Spring', 'Harrington', 'Breton Stripe', 'Fresh', 'Transitional']),
    },
    {
      name: 'Autumn Warm Earth Tones',
      slug: 'autumn-earth-tones',
      categoryId: catMap['Seasonal'],
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&h=900&fit=crop&q=85',
      description: 'Suede jacket in warm cognac brown, olive green merino sweater, raw selvedge denim, and leather boots.',
      tags: JSON.stringify(['Autumn', 'Cognac Suede', 'Earth Tones', 'Fall Foliage', 'Merino']),
    },
    {
      name: 'High Summer Resort',
      slug: 'high-summer-resort',
      categoryId: catMap['Seasonal'],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&h=900&fit=crop&q=85',
      description: 'Camp-collar silk-blend floral shirt, ivory drawstring linen trousers, and woven Panama sun hat.',
      tags: JSON.stringify(['High Summer', 'Silk Blend', 'Panama Hat', 'Vacation', 'Resort']),
    },
    {
      name: 'Deep Winter Puffer',
      slug: 'deep-winter-puffer',
      categoryId: catMap['Seasonal'],
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&h=900&fit=crop&q=85',
      description: '700-fill down puffer parka with high storm collar, fleece-lined thermal pants, and insulated gloves.',
      tags: JSON.stringify(['Deep Winter', '700-Fill Down', 'Parka', 'Thermal', 'Snow']),
    },
    {
      name: 'Transitional Weather Jacket',
      slug: 'transitional-weather-jacket',
      categoryId: catMap['Seasonal'],
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&h=900&fit=crop&q=85',
      description: 'Waxed cotton field overshirt, textured waffle knit, durable chinos, and all-weather Chelsea boots.',
      tags: JSON.stringify(['Transitional', 'All-Weather', 'Waxed Cotton', 'Versatile', 'Layered']),
    },

    // ════════════════════════════════════════════════════════════
    // 11. Avant-Garde Category (6 Styles)
    // ════════════════════════════════════════════════════════════
    {
      name: 'Architectural Runway',
      slug: 'architectural-runway',
      categoryId: catMap['Avant-Garde'],
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&h=900&fit=crop&q=85',
      description: 'Sculptural asymmetric coat with exaggerated geometric collar, draped trousers, and platform boots.',
      tags: JSON.stringify(['Runway', 'Sculptural', 'Asymmetric', 'High Fashion']),
    },
    {
      name: 'Deconstructed Tailoring',
      slug: 'deconstructed-tailoring',
      categoryId: catMap['Avant-Garde'],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&h=900&fit=crop&q=85',
      description: 'Blazer with exposed white basting stitches, raw unhemmed seams, and split layered lapels.',
      tags: JSON.stringify(['Deconstructed', 'Raw Hem', 'Japanese Design', 'Artisanal']),
    },
    {
      name: 'Draped Monochrome',
      slug: 'draped-monochrome',
      categoryId: catMap['Avant-Garde'],
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&h=900&fit=crop&q=85',
      description: 'Fluid elongated black tunic layered over wide-leg samurai trousers with high-top avant-garde sneakers.',
      tags: JSON.stringify(['Draped', 'All Black', 'Fluid', 'Samurai']),
    },
    {
      name: 'Structural Leather',
      slug: 'structural-leather',
      categoryId: catMap['Avant-Garde'],
      image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=700&h=900&fit=crop&q=85',
      description: 'Architectural bonded leather jacket with asymmetric zipper and structural folded collars.',
      tags: JSON.stringify(['Bonded Leather', 'Folded Collar', 'Futuristic', 'Edgy']),
    },
    {
      name: 'Future Cyber-Goth',
      slug: 'future-cyber-goth',
      categoryId: catMap['Avant-Garde'],
      image: 'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?w=700&h=900&fit=crop&q=85',
      description: 'Modular nylon trench with magnetic Fidlock buckles, face-shield hood, and chunky platform boots.',
      tags: JSON.stringify(['Cyber Goth', 'Fidlock', 'Modular', 'Futuristic']),
    },
    {
      name: 'Conceptual High Fashion',
      slug: 'conceptual-fashion',
      categoryId: catMap['Avant-Garde'],
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=700&h=900&fit=crop&q=85',
      description: 'Oversized cocoon silhouette in crinkled metallic fabric with sculptural volume and high dramatic impact.',
      tags: JSON.stringify(['Cocoon Silhouette', 'Metallic', 'Voluminous', 'Haute Couture']),
    },
    {
      name: 'Asymmetric Darkwear',
      slug: 'asymmetric-darkwear',
      categoryId: catMap['Avant-Garde'],
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&h=900&fit=crop&q=85',
      description: 'Layered matte black asymmetric duster with extended cuffs, dropped-crotch trousers, and harness detailing.',
      tags: JSON.stringify(['Darkwear', 'Asymmetric', 'Harness', 'Avant-Garde']),
    },
    {
      name: 'Neo-Tokyo Structural',
      slug: 'neo-tokyo-structural',
      categoryId: catMap['Avant-Garde'],
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop&q=85',
      description: 'Kimono-lapel structured coat with magnetic wrap belt, tailored wide culottes, and tabi leather split-toe boots.',
      tags: JSON.stringify(['Kimono Lapel', 'Tabi Boots', 'Japanese Avant-Garde', 'Structural']),
    },
  ];

  await Promise.all(stylesData.map((s) => prisma.style.create({ data: s })));
  console.log(`  ✓ Created ${stylesData.length} fashion styles across ${categories.length} categories.`);

  // ── Brands ──
  console.log('Creating brands...');
  const brandsData = [
    { name: 'Ralph Lauren', logo: '🐎', description: 'Iconic American brand known for premium casual wear, suits, and polo shirts.', category: 'Luxury', priceSegment: 'Premium', styles: JSON.stringify(['Formal', 'Preppy', 'Old Money']), website: 'https://ralphlauren.com' },
    { name: 'Loro Piana', logo: '🧶', description: 'Italian standard for ultra-luxury cashmere, rare vicuña wool, and quiet luxury tailoring.', category: 'High Luxury', priceSegment: 'Luxury', styles: JSON.stringify(['Quiet Luxury', 'Minimal', 'Formal']), website: 'https://loropiana.com' },
    { name: 'Acne Studios', logo: '🎀', description: 'Stockholm fashion house celebrated for directional tailoring, Scandi minimalism, and denim.', category: 'Contemporary', priceSegment: 'Premium', styles: JSON.stringify(['Scandi Minimal', 'Aesthetic', 'Urban']), website: 'https://acnestudios.com' },
    { name: 'Nike', logo: '🏃', description: 'Global leader in athletic footwear, performance sportswear, and iconic sneaker culture.', category: 'Sportswear', priceSegment: 'Mid-range', styles: JSON.stringify(['Athleisure', 'Streetwear', 'Casual']), website: 'https://nike.com' },
    { name: 'Zara', logo: '👗', description: 'Fast-fashion retailer offering on-trend clothing, accessories, and runway-inspired drops.', category: 'Fast Fashion', priceSegment: 'Affordable', styles: JSON.stringify(['Smart Casual', 'Minimal', 'Parisian Chic']), website: 'https://zara.com' },
    { name: 'Gucci', logo: '✨', description: 'Italian luxury house renowned for eclectic, maximalist fashion and Florentine leather craftsmanship.', category: 'High Fashion', priceSegment: 'Luxury', styles: JSON.stringify(['Formal', 'Avant-Garde', 'Streetwear']), website: 'https://gucci.com' },
    { name: 'Uniqlo', logo: '🧵', description: 'Japanese casualwear brand focused on high-quality basics and functional LifeWear.', category: 'Essentials', priceSegment: 'Affordable', styles: JSON.stringify(['Minimal', 'Casual', 'Normcore']), website: 'https://uniqlo.com' },
    { name: 'Adidas', logo: '⚽', description: 'German sportswear powerhouse merging athletic performance with high-profile lifestyle collaborations.', category: 'Sportswear', priceSegment: 'Mid-range', styles: JSON.stringify(['Athleisure', 'Streetwear', 'Casual']), website: 'https://adidas.com' },
    { name: "Levi's", logo: '👖', description: 'The original American denim company, setting the global gold standard for jeans since 1853.', category: 'Denim', priceSegment: 'Mid-range', styles: JSON.stringify(['Casual', 'Vintage', 'Grunge', 'Western']), website: 'https://levi.com' },
    { name: 'Patagonia', logo: '🏔️', description: 'Outdoor clothing company built on environmental activism, fleece outerwear, and durable gear.', category: 'Outdoor', priceSegment: 'Premium', styles: JSON.stringify(['Normcore', 'Casual', 'Layered']), website: 'https://patagonia.com' },
    { name: 'Burberry', logo: '🧥', description: 'British luxury fashion house famous for gabardine trench coats, check motifs, and modern outerwear.', category: 'Luxury', priceSegment: 'Luxury', styles: JSON.stringify(['Formal', 'Smart Casual', 'Parisian Chic']), website: 'https://burberry.com' },
    { name: 'COS', logo: '🪡', description: 'London-based brand championing architectural minimalism, sustainable fabrics, and modern shapes.', category: 'Contemporary', priceSegment: 'Mid-range', styles: JSON.stringify(['Minimal', 'Scandi Minimal', 'Smart Casual']), website: 'https://cos.com' },
    { name: 'Supreme', logo: '📦', description: 'New York streetwear titan at the epicenter of skateboarding and global youth culture.', category: 'Streetwear', priceSegment: 'Premium', styles: JSON.stringify(['Streetwear', 'Grunge', 'Y2K']), website: 'https://supremenewyork.com' },
    { name: 'Arc’teryx', logo: '🦅', description: 'Canadian high-performance technical apparel and vanguard of modern urban techwear.', category: 'Techwear', priceSegment: 'Premium', styles: JSON.stringify(['Techwear', 'Normcore', 'Athleisure']), website: 'https://arcteryx.com' },
  ];

  await Promise.all(brandsData.map((b) => prisma.brand.create({ data: b })));

  // ── Goals (Demo user) ──
  console.log('Creating goals...');
  await prisma.goal.createMany({
    data: [
      { userId: demoUser.id, title: 'Run a marathon', description: 'Complete a full 42km marathon by year end', deadline: new Date('2026-12-31'), priority: 'HIGH', progress: 45, status: 'ACTIVE' },
      { userId: demoUser.id, title: 'Learn Spanish', description: 'Achieve B2 level fluency in Spanish', deadline: new Date('2027-06-30'), priority: 'MEDIUM', progress: 20, status: 'ACTIVE' },
      { userId: demoUser.id, title: 'Read 24 books', description: 'Read 2 books per month for self-improvement', deadline: new Date('2026-12-31'), priority: 'LOW', progress: 67, status: 'ACTIVE' },
    ],
  });

  // ── Tasks (Demo user) ──
  console.log('Creating tasks...');
  await prisma.task.createMany({
    data: [
      { userId: demoUser.id, title: 'Morning run — 5km', dueDate: new Date('2026-08-24'), priority: 'HIGH', status: 'PENDING', category: 'Fitness' },
      { userId: demoUser.id, title: 'Complete Spanish lesson 14', dueDate: new Date('2026-08-24'), priority: 'MEDIUM', status: 'PENDING', category: 'Learning' },
      { userId: demoUser.id, title: 'Review goal progress', dueDate: new Date('2026-08-25'), priority: 'LOW', status: 'PENDING', category: 'Planning' },
      { userId: demoUser.id, title: 'Prepare healthy meal prep', dueDate: new Date('2026-08-23'), priority: 'MEDIUM', status: 'COMPLETED', category: 'Health' },
      { userId: demoUser.id, title: 'Update wardrobe inventory', dueDate: new Date('2026-08-26'), priority: 'LOW', status: 'PENDING', category: 'Style' },
    ],
  });

  // ── Habits (Demo user) ──
  console.log('Creating habits...');
  const habitsData = [
    { userId: demoUser.id, title: 'Morning Meditation', frequency: 'Daily', currentStreak: 14, bestStreak: 30 },
    { userId: demoUser.id, title: 'Drink 8 glasses of water', frequency: 'Daily', currentStreak: 7, bestStreak: 21 },
    { userId: demoUser.id, title: 'Exercise', frequency: 'Daily', currentStreak: 5, bestStreak: 15 },
    { userId: demoUser.id, title: 'Read for 30 minutes', frequency: 'Daily', currentStreak: 22, bestStreak: 22 },
    { userId: demoUser.id, title: 'Weekly review', frequency: 'Weekly', currentStreak: 8, bestStreak: 12 },
  ];

  const habits = await Promise.all(habitsData.map((h) => prisma.habit.create({ data: h })));
  await prisma.habitCompletion.create({ data: { habitId: habits[0].id, completedAt: new Date() } });
  await prisma.habitCompletion.create({ data: { habitId: habits[3].id, completedAt: new Date() } });

  console.log('\n✨ Database seeding completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

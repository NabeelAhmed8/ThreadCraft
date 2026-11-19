import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { extractTokenFromRequest, verifyToken } from "@/lib/jwt";
import { clearProductsCache } from "@/app/api/products/route";

const INITIAL_PRODUCTS = [
  {
    name: "Heavyweight Boxy Crewneck Tee",
    slug: "heavyweight-boxy-crewneck-tee",
    description: "Crafted from 280 GSM combed organic cotton. Features a relaxed drop-shoulder cut, dense ribbed collar that keeps its shape, and a clean minimalist hem.",
    price: 42,
    compareAtPrice: 55,
    category: "men",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Washed Black", "Chalk White", "Olive Drab"],
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 35,
    featured: true
  },
  {
    name: "Japanese Selvedge Denim Overshirt",
    slug: "japanese-selvedge-denim-overshirt",
    description: "13.5oz raw selvedge denim woven on vintage shuttle looms. Features matte horn buttons, dual utility chest pockets, and reinforced flat-felled seams.",
    price: 145,
    compareAtPrice: 180,
    category: "men",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Indigo Raw", "Vintage Stone Wash"],
    images: [
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 18,
    featured: true
  },
  {
    name: "Brushed Mohair Knit Cardigan",
    slug: "brushed-mohair-knit-cardigan",
    description: "Luxuriously soft mohair and alpaca wool blend. Designed with a deep V-neckline, tonal mother-of-pearl buttons, and a relaxed, slouchy silhouette.",
    price: 165,
    compareAtPrice: 210,
    category: "outerwear",
    sizes: ["S", "M", "L"],
    colors: ["Sage Green", "Charcoal Melange", "Oatmeal"],
    images: [
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 14,
    featured: true
  },
  {
    name: "Relaxed Pleated Linen Trouser",
    slug: "relaxed-pleated-linen-trouser",
    description: "100% Normandy flax linen with double front pleats. Features a mid-rise waist, subtle taper through the leg, and an elasticated back waistband for refined comfort.",
    price: 95,
    compareAtPrice: 120,
    category: "men",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Bone White", "Black", "Earthy Taupe"],
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 24,
    featured: false
  },
  {
    name: "Oversized Crisp Poplin Shirt",
    slug: "oversized-crisp-poplin-shirt",
    description: "Tailored from 120-thread-count organic cotton poplin. Longline fit with exaggerated cuffs, curved split hem, and concealed button placket.",
    price: 78,
    compareAtPrice: 98,
    category: "women",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Pure White", "Sky Blue Stripe", "Midnight Black"],
    images: [
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 30,
    featured: true
  },
  {
    name: "500 GSM Heavy Loopback Hoodie",
    slug: "500-gsm-heavy-loopback-hoodie",
    description: "Ultra-dense custom knit french terry with brushed interior. Double-layered hood without drawstrings, seamless kangaroo pocket, and ribbed side gussets.",
    price: 115,
    compareAtPrice: 140,
    category: "outerwear",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Washed Anthracite", "Heather Gray", "Forest Green"],
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 22,
    featured: true
  },
  {
    name: "Minimalist High-Waist Wool Pant",
    slug: "minimalist-high-waist-wool-pant",
    description: "Italian tropical virgin wool tailored with sharp pressed creases. Clean hook-and-bar closure with side slant pockets and an elegant wide drape.",
    price: 130,
    compareAtPrice: 165,
    category: "women",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Charcoal", "Camel", "Black"],
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 16,
    featured: false
  },
  {
    name: "Double-Breasted Wool Trench Coat",
    slug: "double-breasted-wool-trench-coat",
    description: "Heavyweight boiled wool outerwear with raglan sleeves and a storm flap. Features a matching self-fabric belt with buckle and viscose lining.",
    price: 280,
    compareAtPrice: 340,
    category: "outerwear",
    sizes: ["S", "M", "L"],
    colors: ["Camel Melange", "Dark Espresso"],
    images: [
      "https://images.unsplash.com/photo-1539533018447-63fcce667823?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 10,
    featured: true
  },
  {
    name: "Organic Ribbed Baby Tee",
    slug: "organic-ribbed-baby-tee",
    description: "95% GOTS certified cotton with 5% elastane for subtle stretch. Vintage cropped length, micro-rib finish, and bound crew neckline.",
    price: 34,
    compareAtPrice: 45,
    category: "casual",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Cream", "Black", "Dusty Rose"],
    images: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 40,
    featured: false
  },
  {
    name: "Chunky Waffle Knit Thermal Longsleeve",
    slug: "chunky-waffle-knit-thermal-longsleeve",
    description: "Honeycomb textured 360 GSM combed cotton thermal. Ribbed cuff hems, flatlock stitching throughout, and garment dyed for a rich lived-in tone.",
    price: 58,
    compareAtPrice: 72,
    category: "casual",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Off-White", "Washed Olive", "Iron Black"],
    images: [
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 26,
    featured: false
  },
  {
    name: "Raw-Hem Denim Chore Jacket",
    slug: "raw-hem-denim-chore-jacket",
    description: "Inspired by 1940s French workwear. Three exterior patch pockets, subtle fray at the hem, and antique brass buttons with branded stamp.",
    price: 128,
    compareAtPrice: 160,
    category: "outerwear",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Bleached Sky", "Rigid Black"],
    images: [
      "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 19,
    featured: false
  },
  {
    name: "Silk-Cotton Sleeveless Knit Tank",
    slug: "silk-cotton-sleeveless-knit-tank",
    description: "Fine gauge 70/30 Mulberry silk and organic cotton. Semi-matte lustrous finish with high square neckline and ribbed tubular border.",
    price: 64,
    compareAtPrice: 80,
    category: "women",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Champagne", "Espresso", "Ivory"],
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 28,
    featured: false
  },
  {
    name: "Vintage Wash Carpenter Pant",
    slug: "vintage-wash-carpenter-pant",
    description: "12oz duck canvas with stonewash treatment. Reinforced knee panels, hammer loop detail, and rear patch pockets cut in a straight, wide leg.",
    price: 88,
    compareAtPrice: 110,
    category: "men",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Washed Sand", "Faded Ink"],
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 21,
    featured: false
  },
  {
    name: "Seamless Merino Wool Mockneck",
    slug: "seamless-merino-wool-mockneck",
    description: "Extrafine 19.5 micron merino wool knit 3D seamlessly on Shima Seiki machines. Zero seam chafing, breathable natural thermal regulation, and clean mock collar.",
    price: 110,
    compareAtPrice: 135,
    category: "outerwear",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Charcoal Grey", "Navy", "Raw Ecru"],
    images: [
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 17,
    featured: true
  },
  {
    name: "Tailored Linen Blend Bermuda Shorts",
    slug: "tailored-linen-blend-bermuda-shorts",
    description: "Knee-length relaxed tailored shorts in breathable linen-viscose weave. Front zip with horn button, angled pockets, and rear welt pockets.",
    price: 68,
    compareAtPrice: 85,
    category: "casual",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Stone Khaki", "Deep Navy", "Olive"],
    images: [
      "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 32,
    featured: false
  },
  {
    name: "Tiered Organic Poplin Midi Dress",
    slug: "tiered-organic-poplin-midi-dress",
    description: "Effortless lightweight cotton poplin with gathered tiered skirts. Features a scoop neckline, discreet side seam pockets, and an airy relaxed volume.",
    price: 125,
    compareAtPrice: 155,
    category: "women",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Terracotta", "Black", "Bone"],
    images: [
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 15,
    featured: true
  },
  {
    name: "Heavy Fleece Relaxed Sweatpant",
    slug: "heavy-fleece-relaxed-sweatpant",
    description: "480 GSM dense cotton fleece with brushed interior. Thick ribbed waistband with natural cotton drawstring, deep front pockets, and elastic cuffs.",
    price: 82,
    compareAtPrice: 105,
    category: "casual",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Heather Grey", "Washed Black", "Forest Green"],
    images: [
      "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 38,
    featured: false
  },
  {
    name: "Classic Oxford Cloth Button Down",
    slug: "classic-oxford-cloth-button-down",
    description: "Durable heavy oxford cotton woven in Portugal. Subtly rolled 3-finger button-down collar, chest spade pocket, and locker loop at back box pleat.",
    price: 76,
    compareAtPrice: 95,
    category: "men",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Classic Blue", "White", "Pink Oxford"],
    images: [
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 27,
    featured: false
  },
  {
    name: "Crinkled Nylon Coach Jacket",
    slug: "crinkled-nylon-coach-jacket",
    description: "Water-repellent taslan crinkle nylon with lightweight breathable mesh lining. Matte snap closures, drawcord hem, and elasticated cuffs.",
    price: 108,
    compareAtPrice: 135,
    category: "outerwear",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Slate Black", "Desert Sand"],
    images: [
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 20,
    featured: false
  },
  {
    name: "Minimalist Ribbed Beanie & Scarf Set",
    slug: "minimalist-ribbed-beanie-scarf-set",
    description: "100% Merino lambswool knit in 2x2 rib structure. Itch-free softness, foldable cuff beanie, and matching 180cm scarf.",
    price: 62,
    compareAtPrice: 78,
    category: "casual",
    sizes: ["One Size"],
    colors: ["Charcoal", "Oatmeal", "Black"],
    images: [
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=800&q=80"
    ],
    inStock: true,
    stockCount: 45,
    featured: false
  }
];

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized. Admin privileges required." },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin privileges required." },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const results = [];
    for (const item of INITIAL_PRODUCTS) {
      const existing = await Product.findOne({ slug: item.slug });
      if (!existing) {
        const created = await Product.create(item);
        results.push(created);
      }
    }

    clearProductsCache();

    return NextResponse.json({
      success: true,
      message: `Seed complete. Inserted ${results.length} new products (${20 - results.length} already existed).`,
      count: results.length,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to seed products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

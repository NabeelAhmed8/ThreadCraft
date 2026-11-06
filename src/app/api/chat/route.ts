import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { ChatProduct } from "@/types/chat";
import { generateGeminiContent, GeminiContentItem } from "@/lib/gemini";
import { extractTokenFromRequest, verifyToken } from "@/lib/jwt";

interface ChatRequestItem {
  role: "user" | "assistant";
  content: string;
}

/**
 * Chat API Route
 * Single Responsibility: Orchestrate store context (live catalog & order lookup) and dispatch to Gemini.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [] } = body as {
      message: string;
      history?: ChatRequestItem[];
    };

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message content cannot be empty." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Fetch live in-stock products for dynamic catalog matching
    const liveProducts = await Product.find({ inStock: true })
      .select("_id name price category description sizes colors images")
      .limit(30)
      .lean();

    const catalogContext = liveProducts
      .map(
        (p) =>
          `[ID: ${p._id.toString()}] ${p.name} - $${p.price} | Category: ${p.category} | Sizes: ${p.sizes.join(", ")} | Description: ${p.description}`
      )
      .join("\n");

    // 2. Real-time Order lookup if customer provided an order number (e.g. TC-12345)
    let orderContext = "";
    const orderMatch = message.match(/TC-[A-Za-z0-9]+/i);
    if (orderMatch) {
      const order = await Order.findOne({
        orderNumber: orderMatch[0].toUpperCase(),
      }).lean();

      if (order) {
        const token = extractTokenFromRequest(request);
        const decoded = token ? verifyToken(token) : null;
        const isAuthorized =
          decoded &&
          (decoded.role === "admin" ||
            (decoded.email && decoded.email.toLowerCase() === order.customer.email.toLowerCase()));

        if (isAuthorized) {
          orderContext = `\nFound matching order details:\nOrder: ${order.orderNumber}\nStatus: ${order.orderStatus}\nTotal: $${order.total}\nPayment Method: ${order.paymentMethod}\nPayment Status: ${order.paymentStatus}\nCustomer: ${order.customer.fullName}`;
        } else {
          orderContext = `\nUser asked about order '${order.orderNumber}'. For customer privacy and security, tell the user they must be signed into the account that placed this order to view tracking details, or visit their Profile > Orders tab.`;
        }
      } else {
        orderContext = `\nUser searched for order '${orderMatch[0]}', but it was not found in the database. Advise them to double-check their order number or view order history in their Profile page.`;
      }
    }

    // 3. System Prompt for ThreadCraft Concierge & Stylist
    const systemPrompt = `You are "ThreadCraft Concierge", an intelligent, knowledgeable, and elegant personal shopping assistant for ThreadCraft Studio (a contemporary, minimalist clothing brand).

YOUR ROLES & RESPONSIBILITIES:
1. PERSONALIZED STYLE & OUTFIT RECOMMENDATIONS:
   - Provide thoughtful, tailored fashion recommendations based on user occasions (weddings, casual outings, office wear, parties, seasonal collections).
   - Suggest color matching, garment pairings, and minimalist styling advice.

2. SIZE & FIT ADVICE:
   - S: Chest 36-38", Waist 30-32"
   - M: Chest 39-41", Waist 32-34"
   - L: Chest 42-44", Waist 34-36"
   - XL: Chest 45-47", Waist 36-38"
   - Explain fit differences (boxy/relaxed oversized vs regular classic cuts).

3. STORE POLICIES & ORDER ASSISTANCE:
   - Shipping: Free delivery across Pakistan on orders over $75. Standard shipping is $10. Delivery time is 2-4 business days.
   - Payment Methods: Cash on Delivery (COD), Visa / Mastercard credit/debit card, online card payment.
   - Returns & Exchanges: 14-day hassle-free return/exchange policy if garments are unworn with original tags attached.
   - Order Tracking: Users can track orders in real-time by giving their Order Number (e.g. TC-XXXXXX) or via their Profile page.

4. MULTILINGUAL & CASUAL FLUENCY:
   - You understand and speak fluent English, Urdu, and Roman Urdu/Hindi (e.g., "Aapko wedding ya casual wear ke liye outfit chahiye?").
   - Respond in the language or style used by the customer naturally.

5. LIVE STORE CATALOG & DYNAMIC PRODUCT MATCHING:
   - You have access to our live inventory catalog below.
   - Whenever you recommend any item from our catalog, insert its product tag: [PRODUCT:productId] next to the product name.
   - Example: "I recommend the **Heavyweight Boxy Cotton Tee** ($45) [PRODUCT:67123...]. It features an organic cotton drop-shoulder cut."

6. PROFESSIONALISM & BRAND IDENTITY:
   - Never mention internal AI model names (such as Gemini, 3.8 Flash, LLM, or Google). You represent ThreadCraft Studio's client concierge and personal styling advisory.
   - Maintain a polished, luxury boutique tone.

LIVE PRODUCT CATALOG:
${catalogContext}
${orderContext ? `\nREAL-TIME ORDER CONTEXT:\n${orderContext}` : ""}

Keep your responses helpful, polite, and well-structured using markdown bullet points and bold text where appropriate.`;

    // 4. Format conversation history
    const contents: GeminiContentItem[] = [
      ...history.map((msg) => ({
        role: (msg.role === "assistant" ? "model" : "user") as "user" | "model",
        parts: [{ text: msg.content }],
      })),
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    // 5. Generate content using multi-model cascade (Gemini 4 Argon down to 1.0)
    const preferredModel = process.env.GEMINI_MODEL || "gemini-4-argon";
    const { text: rawReply } = await generateGeminiContent({
      systemPrompt,
      contents,
      preferredModel,
    });

    // 6. Extract product tags [PRODUCT:id] to provide rich interactive cards
    const productTagRegex = /\[PRODUCT:([a-fA-F0-9]{24})\]/g;
    const matchedProductIds = new Set<string>();
    let match;
    while ((match = productTagRegex.exec(rawReply)) !== null) {
      matchedProductIds.add(match[1]);
    }

    // Clean out the raw bracket tags from reply text
    const cleanReply = rawReply.replace(productTagRegex, "").trim();

    // Map matched IDs to full product objects
    const recommendedProducts: ChatProduct[] = liveProducts
      .filter((p) => matchedProductIds.has(p._id.toString()))
      .map((p) => ({
        id: p._id.toString(),
        name: p.name,
        price: p.price,
        category: p.category,
        image: p.images[0] || "/placeholder.jpg",
      }));

    return NextResponse.json({
      success: true,
      reply: cleanReply,
      products: recommendedProducts,
    });
  } catch (error: unknown) {
    console.error("Chat route error:", error);
    const message =
      error instanceof Error ? error.message : "Error generating AI response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

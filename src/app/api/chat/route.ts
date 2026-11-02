import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { ChatProduct } from "@/types/chat";

interface ChatRequestItem {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

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

    // 1. Fetch live product catalog from database for accurate recommendations
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

    // 2. Check if user is asking about a specific order (e.g. TC-12345)
    let orderContext = "";
    const orderMatch = message.match(/TC-[A-Za-z0-9]+/i);
    if (orderMatch) {
      const order = await Order.findOne({
        orderNumber: new RegExp(orderMatch[0], "i"),
      }).lean();

      if (order) {
        orderContext = `\nFound matching order details:\nOrder: ${order.orderNumber}\nStatus: ${order.orderStatus}\nTotal: $${order.total}\nPayment Method: ${order.paymentMethod}\nPayment Status: ${order.paymentStatus}\nCustomer: ${order.customer.fullName}`;
      } else {
        orderContext = `\nUser searched for order '${orderMatch[0]}', but it was not found in the database. Advise them to double-check their order number or view order history inside their Profile page.`;
      }
    }

    // 3. System Prompt for ThreadCraft AI Stylist & Concierge
    const systemPrompt = `You are "ThreadCraft AI Stylist & Concierge", an intelligent, knowledgeable, and elegant personal shopping assistant for ThreadCraft Studio (a contemporary, minimalist clothing brand).

YOUR ROLES & RESPONSIBILITIES:
1. PERSONALIZED STYLE & OUTFIT RECOMMENDATIONS:
   - Provide thoughtful, tailored fashion recommendations based on user occasions (weddings, casual outings, office wear, parties, seasonal collections).
   - Suggest color matching, garment pairings, and minimalist styling advice.

2. SIZE & FIT ADVICE:
   - Size Matrix:
     - S (Small): Chest 36-38", Waist 30-32"
     - M (Medium): Chest 39-41", Waist 32-34"
     - L (Large): Chest 42-44", Waist 34-36"
     - XL (Extra Large): Chest 45-47", Waist 36-38"
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

    // 4. Format conversation history for Gemini API
    const formattedContents = [
      ...history.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    // 5. Call Gemini API
    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: formattedContents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API Error:", data);
      throw new Error(data.error?.message || "Failed to communicate with Gemini API.");
    }

    const rawReply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I am here to help you discover our ThreadCraft collection. What style or size are you looking for today?";

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


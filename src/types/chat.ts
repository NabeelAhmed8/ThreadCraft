export interface ChatProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: ChatProduct[];
  timestamp: string;
}


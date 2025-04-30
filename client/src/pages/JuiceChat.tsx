import React, { useState, useRef, useEffect } from "react";
import { 
  ChevronRight, 
  Send, 
  RefreshCw, 
  Sparkles, 
  Heart,
  Shield,
  Brain,
  Zap,
  Droplet,
  Flame,
  Apple,
  ShoppingCart,
  Plus
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  juice?: JuiceRecommendation;
}

interface JuiceRecommendation {
  name: string;
  image: string;
  ingredients: string;
  benefits: string[];
  tags: string[];
  id?: number;
  price?: number;
}

const juiceData: JuiceRecommendation[] = [
  {
    id: 1,
    name: "Liquid Sunset",
    image: "/assets/fae075af-fc0e-481c-8512-a972f44425b6-removebg-preview.png",
    ingredients: "Carrot, turmeric, pineapple, and ginger blend for immunity boosting.",
    benefits: [
      "Powerful anti-inflammatory blend rich in carotenoids",
      "Turmeric and ginger provide strong anti-inflammatory and antioxidant properties",
      "May help reduce pain and support immune function",
      "Pineapple contains bromelain which aids digestion",
      "Reduces inflammation"
    ],
    tags: ["immunity", "anti-inflammatory", "digestion", "pain relief"],
    price: 3500
  },
  {
    id: 2,
    name: "Green Guardian",
    image: "/assets/10f5e9d3-8a86-4858-8ad1-5859e7e98e89-removebg-preview.png",
    ingredients: "Kale, cucumber, green apple, mint, and a hint of lemon for detoxification.",
    benefits: [
      "Rich in vitamins A, C, K and antioxidants",
      "Supports hydration, digestion, and immune health",
      "Low sugar and adds a refreshing taste",
      "Provides anti-inflammatory effect"
    ],
    tags: ["detox", "immunity", "refreshing", "digestion", "low sugar", "hydration"],
    price: 3200
  },
  {
    id: 3,
    name: "Berry Bliss",
    image: "/assets/8e75a215-9279-4c1f-8c70-c51150da25a5-removebg-preview.png",
    ingredients: "Strawberry, blueberry, raspberry, and apple juice blend rich in antioxidants.",
    benefits: [
      "High in vitamin C which boosts immune function",
      "Contains antioxidants that fight free radicals",
      "Reduces inflammation",
      "Rich in vitamins that support skin health",
      "May help lower cholesterol"
    ],
    tags: ["immunity", "skin health", "antioxidants", "vitamin c"],
    price: 3500
  },
  {
    id: 4,
    name: "Zesty Citrus",
    image: "/assets/ac4187c6-a203-4f78-852d-d28399fba46d-removebg-preview.png",
    ingredients: "Orange, lemon, and grapefruit with a hint of ginger for immune support.",
    benefits: [
      "Rich in vitamins A, C and digestive enzymes",
      "Tropical blend supports immune health, digestion, and skin health",
      "The citrus fruits provide antioxidants that help fight free radicals",
      "Mango offers vision-supporting vitamin A"
    ],
    tags: ["immunity", "digestion", "skin health", "antioxidants", "tropical"],
    price: 3000
  },
  {
    id: 5,
    name: "Energy Boost",
    image: "/assets/acf70a16-0bc1-4fff-ab1f-8d93de00e191-removebg-preview.png",
    ingredients: "Beetroot, apple, ginger, and lemon for natural energy enhancement.",
    benefits: [
      "Powerful blood pressure regulator due to beetroot's nitrates",
      "Contains anti-inflammatory compounds from ginger",
      "Rich in vitamins A, C, and B6",
      "May support improved circulation, athletic performance, and detoxification"
    ],
    tags: ["blood pressure", "athletic performance", "circulation", "detox", "anti-inflammatory"],
    price: 3700
  },
  {
    id: 6,
    name: "Tropical Wave",
    image: "/assets/ea4e5741-0311-4042-94b0-5d295542c844-removebg-preview.png",
    ingredients: "Pineapple, mango, passion fruit, and coconut water for hydration.",
    benefits: [
      "Excellent for hydration and electrolyte balance",
      "Contains vitamins A, C and B6",
      "Natural sweetness and enzyme combination",
      "Supports heart health and digestion",
      "Bromelain from pineapple has anti-inflammatory properties"
    ],
    tags: ["hydration", "heart health", "digestion", "electrolytes", "anti-inflammatory"],
    price: 3300
  },
  {
    id: 7,
    name: "Beetroot Mix",
    image: "/assets/acf70a16-0bc1-4fff-ab1f-8d93de00e191-removebg-preview.png",
    ingredients: "Beetroot + Watermelon + Pineapple + Ginger",
    benefits: [
      "Powerful blood pressure regulator due to beetroot's nitrates",
      "Contains anti-inflammatory compounds from ginger",
      "Rich in vitamins A, C, and B6",
      "May support improved circulation, athletic performance, and detoxification"
    ],
    tags: ["blood pressure", "athletic performance", "circulation", "detox", "anti-inflammatory"],
    price: 2600
  },
  {
    id: 8,
    name: "Dragon's Breath",
    image: "/assets/acf70a16-0bc1-4fff-ab1f-8d93de00e191-removebg-preview.png",
    ingredients: "Orange + Ginger + Pineapple + Apple",
    benefits: [
      "Immune-boosting combination rich in vitamin C from orange and apple",
      "Ginger provides warming anti-inflammatory action",
      "Pineapple provides bromelain which supports reduced inflammation and improved digestion"
    ],
    tags: ["immunity", "anti-inflammatory", "digestion", "warming"],
    price: 2500
  }
];

// Keywords for matching user queries to juice recommendations
const keywordMap: Record<string, string[]> = {
  "immunity": ["Liquid Sunset", "Green Guardian", "Berry Bliss", "Zesty Citrus", "Dragon's Breath"],
  "immune": ["Liquid Sunset", "Green Guardian", "Berry Bliss", "Zesty Citrus", "Dragon's Breath"],
  "cold": ["Zesty Citrus", "Dragon's Breath"],
  "flu": ["Zesty Citrus", "Dragon's Breath"],
  "digestion": ["Liquid Sunset", "Green Guardian", "Zesty Citrus", "Tropical Wave", "Dragon's Breath"],
  "stomach": ["Liquid Sunset", "Green Guardian", "Zesty Citrus", "Tropical Wave", "Dragon's Breath"],
  "digestive": ["Liquid Sunset", "Green Guardian", "Zesty Citrus", "Tropical Wave", "Dragon's Breath"],
  "hydration": ["Green Guardian", "Tropical Wave"],
  "hydrate": ["Green Guardian", "Tropical Wave"],
  "thirsty": ["Tropical Wave"],
  "skin": ["Berry Bliss", "Zesty Citrus"],
  "complexion": ["Berry Bliss", "Zesty Citrus"],
  "acne": ["Berry Bliss", "Zesty Citrus"],
  "inflammation": ["Liquid Sunset", "Tropical Wave", "Energy Boost", "Dragon's Breath"],
  "inflammatory": ["Liquid Sunset", "Tropical Wave", "Energy Boost", "Dragon's Breath"],
  "pain": ["Liquid Sunset"],
  "ache": ["Liquid Sunset"],
  "heart": ["Tropical Wave"],
  "cardiovascular": ["Tropical Wave", "Energy Boost"],
  "blood pressure": ["Energy Boost"],
  "hypertension": ["Energy Boost"],
  "pressure": ["Energy Boost"],
  "circulation": ["Energy Boost"],
  "detox": ["Green Guardian", "Energy Boost"],
  "cleanse": ["Green Guardian", "Energy Boost"],
  "energy": ["Zesty Citrus", "Energy Boost"],
  "tired": ["Zesty Citrus", "Energy Boost"],
  "fatigue": ["Zesty Citrus", "Energy Boost"],
  "workout": ["Energy Boost", "Tropical Wave"],
  "exercise": ["Energy Boost", "Tropical Wave"],
  "athletic": ["Energy Boost"],
  "performance": ["Energy Boost"],
  "vitamin c": ["Zesty Citrus", "Dragon's Breath"],
  "vitamin a": ["Green Guardian", "Tropical Wave"],
  "antioxidant": ["Green Guardian", "Berry Bliss", "Zesty Citrus"],
  "refreshing": ["Green Guardian", "Tropical Wave"]
};

const JuiceChat: React.FC = () => {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm Eden, your juice guide. Tell me what health benefits you're looking for, or any specific concerns, and I'll recommend the perfect juice for you! 🍹",
      sender: "bot"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handleAddToCart = (juiceId: number) => {
    if (!juiceId) return;
    
    // Find the juice in our data
    const juice = juiceData.find(j => j.id === juiceId);
    if (!juice || !juice.id) return;
    
    // Convert our JuiceRecommendation to the format expected by the cart
    const cartJuice = {
      id: juice.id,
      name: juice.name,
      description: juice.ingredients,
      price: juice.price || 0,
      imageUrl: juice.image,
      category: juice.tags[0] || "detox",
      stock: 10, // Default stock value
      featured: false,
      sku: `JUICE-${juice.id}`
    };
    
    addItem(cartJuice, 1);
    toast({
      title: "Added to cart",
      description: `${juice.name} has been added to your cart.`,
      variant: "default",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user"
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate thinking delay
    setTimeout(() => {
      const response = generateResponse(input);
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const generateResponse = (message: string): Message => {
    const lowercaseQuery = message.toLowerCase();
    let matchedJuices: Set<string> = new Set();
    
    // Find relevant juices based on keywords
    Object.entries(keywordMap).forEach(([keyword, juiceNames]) => {
      if (lowercaseQuery.includes(keyword.toLowerCase())) {
        juiceNames.forEach(name => matchedJuices.add(name));
      }
    });
    
    // If no direct keyword matches, try to find the most relevant juice based on general health terms
    if (matchedJuices.size === 0) {
      if (lowercaseQuery.includes("health") || lowercaseQuery.includes("healthy") || lowercaseQuery.includes("wellness")) {
        return {
          id: Date.now().toString(),
          content: "I'd be happy to recommend a juice for your general health! Could you tell me more specifically what aspect of health you're interested in? For example: immunity, digestion, hydration, energy, etc.",
          sender: "bot"
        };
      }
      
      // If still no matches, offer a general recommendation
      const randomJuice = juiceData[Math.floor(Math.random() * juiceData.length)];
      if (!randomJuice) {
        return {
          id: Date.now().toString(),
          content: "I'm having trouble finding a juice recommendation. Could you please tell me more about what you're looking for?",
          sender: "bot"
        };
      }
      
      return {
        id: Date.now().toString(),
        content: `I don't have a specific recommendation based on your query, but I think you might enjoy our ${randomJuice.name}. Would you like to know more about it, or can you tell me more specifically what health benefits you're looking for?`,
        sender: "bot",
        juice: randomJuice
      };
    }
    
    // If we have matches, find the best one
    const matchedJuiceArray = Array.from(matchedJuices);
    
    // If multiple matches, select one
    const selectedJuiceName = matchedJuiceArray[Math.floor(Math.random() * matchedJuiceArray.length)];
    const selectedJuice = juiceData.find(juice => juice.name === selectedJuiceName);
    
    // Ensure we found a valid juice
    if (!selectedJuice) {
      return {
        id: Date.now().toString(),
        content: "I apologize, but I'm having trouble finding the perfect juice recommendation. Could you please try describing your needs again?",
        sender: "bot"
      };
    }

    return {
      id: Date.now().toString(),
      content: `Based on your needs, I recommend our **${selectedJuice.name}**! It's a perfect blend of ${selectedJuice.ingredients} that provides exactly what you're looking for. Would you like to know more about its specific benefits?`,
      sender: "bot",
      juice: selectedJuice
    };
  };

  const resetChat = () => {
    setMessages([
      {
        id: "1",
        content: "Hello! I'm Eden, your juice guide. Tell me what health benefits you're looking for, or any specific concerns, and I'll recommend the perfect juice for you! 🍹",
        sender: "bot"
      }
    ]);
  };

  const getJuiceIcon = (tags: string[]) => {
    if (tags.includes("immunity")) return <Shield className="h-5 w-5 text-amber-500" />;
    if (tags.includes("energy") || tags.includes("athletic")) return <Zap className="h-5 w-5 text-yellow-500" />;
    if (tags.includes("hydration")) return <Droplet className="h-5 w-5 text-blue-500" />;
    if (tags.includes("anti-inflammatory")) return <Flame className="h-5 w-5 text-red-500" />;
    if (tags.includes("heart health")) return <Heart className="h-5 w-5 text-red-500" />;
    if (tags.includes("digestion")) return <Apple className="h-5 w-5 text-green-500" />;
    return <Sparkles className="h-5 w-5 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="rounded-xl shadow-lg overflow-hidden">
            {/* Chat header */}
            <div className="bg-gradient-to-r from-amber-400 to-yellow-500 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-white" />
                <h2 className="text-lg font-semibold text-white">Sip of Eden Juice Guide</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 border-0 text-white hover:bg-white/30"
                onClick={resetChat}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
            
            {/* Chat messages */}
            <div className="p-4 h-[500px] overflow-y-auto bg-white">
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 ${
                          message.sender === "user"
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-gray-100 rounded-tl-none"
                        }`}
                      >
                        <div className="text-sm">{message.content}</div>
                        
                        {/* Juice recommendation card */}
                        {message.juice && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="mt-3 bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                          >
                            <div className="flex items-center p-3 bg-gradient-to-r from-amber-50 to-yellow-50">
                              <div className="h-16 w-16 overflow-hidden rounded-lg bg-white p-1 flex items-center justify-center">
                                <img 
                                  src={message.juice.image} 
                                  alt={message.juice.name} 
                                  className="h-full object-contain"
                                />
                              </div>
                              <div className="ml-3">
                                <h3 className="font-semibold text-gray-800 flex items-center">
                                  {getJuiceIcon(message.juice.tags)}
                                  <span className="ml-1">{message.juice.name}</span>
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">{message.juice.ingredients}</p>
                              </div>
                            </div>
                            
                            <div className="p-3 border-t border-gray-100">
                              <p className="text-xs text-gray-700 font-medium mb-2">Health Benefits:</p>
                              <ul className="space-y-1">
                                {message.juice.benefits.map((benefit, idx) => (
                                  <li key={idx} className="text-xs text-gray-600 flex items-start">
                                    <ChevronRight className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                    <span className="ml-1">{benefit}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="px-3 pb-3 flex flex-wrap gap-1">
                              {message.juice.tags.slice(0, 4).map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="p-3 border-t border-gray-100 flex justify-between items-center">
                              <div className="text-xs font-medium text-gray-700">₦{message.juice.price?.toLocaleString()}</div>
                              <Button 
                                onClick={() => message.juice?.id && handleAddToCart(message.juice.id)}
                                size="sm"
                                className="rounded-full bg-teal-500 hover:bg-teal-600"
                              >
                                <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                                Add to cart
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                          <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Chat input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Ask about juice benefits (e.g., 'I need energy' or 'Help with digestion')"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="rounded-full bg-white"
                />
                <Button
                  onClick={handleSend}
                  disabled={input.trim() === "" || isTyping}
                  className="rounded-full bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-center mt-2 text-gray-500">
                Try asking about immunity, digestion, energy, hydration, or skin health
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JuiceChat;
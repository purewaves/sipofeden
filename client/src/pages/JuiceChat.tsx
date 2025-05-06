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
import { useQuery } from "@tanstack/react-query";
import { Juice } from "@shared/schema"; // Use the shared Juice type

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  juice?: Juice; // Use the actual Juice type for recommendations
}

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
  
  // Fetch all juices from the API to use for recommendations
  const { data: allJuices = [], isLoading: isLoadingJuices } = useQuery<Juice[]>({
    queryKey: ['/api/juices'],
  });
  
  const handleAddToCart = (juice: Juice | undefined) => {
    if (!juice || !juice.id) return;
    
    // The fetched juice object should already be in the correct format
    addItem(juice, 1);
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
      // Pass the fetched juices to the response generator
      const response = generateResponse(input, allJuices);
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  // Updated response generator to use fetched juice data
  const generateResponse = (message: string, availableJuices: Juice[]): Message => {
    const lowerCaseMessage = message.toLowerCase();
    
    // Basic keyword matching for demonstration
    const keywords = ["detox", "immunity", "energy", "antioxidant", "wellness", "hydration", "skin", "digestion"];
    const matchedKeywords = keywords.filter(keyword => lowerCaseMessage.includes(keyword));

    let recommendedJuices: Juice[] = [];

    if (matchedKeywords.length > 0) {
      recommendedJuices = availableJuices.filter(juice => 
        matchedKeywords.some(keyword => juice.category.toLowerCase().includes(keyword))
      );
    } else {
      // If no keywords match, recommend a random juice
      recommendedJuices = availableJuices.length > 0 ? [availableJuices[Math.floor(Math.random() * availableJuices.length)]] : [];
    }
    
    if (recommendedJuices.length === 0) {
       // Handle case where no juices are available or match
      if (availableJuices.length === 0) {
        return {
          id: Date.now().toString(),
            content: "I'm sorry, I couldn't fetch any juices to recommend right now. Please try again later.",
          sender: "bot"
        };
      } else {
         // Recommend a random one if no keywords matched but juices exist
         recommendedJuices = [availableJuices[Math.floor(Math.random() * availableJuices.length)]];
      }
    }
    
    // Select one juice to recommend from the filtered list
    const selectedJuice = recommendedJuices[Math.floor(Math.random() * recommendedJuices.length)];
    
    return {
      id: Date.now().toString(),
      content: `Based on your needs, I recommend our **${selectedJuice.name}**! It's great for ${selectedJuice.category}. Would you like to add it to your cart?`,
      sender: "bot",
      juice: selectedJuice // Attach the actual Juice object
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

  // Function to get display tags (use category for simplicity now)
  const getDisplayTags = (juice: Juice): string[] => {
    return [juice.category]; // Can expand this later if needed
  };

  const getJuiceIcon = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes("immunity")) return <Shield className="h-5 w-5 text-amber-500" />;
    if (lowerCategory.includes("energy")) return <Zap className="h-5 w-5 text-yellow-500" />;
    if (lowerCategory.includes("hydration")) return <Droplet className="h-5 w-5 text-blue-500" />;
    if (lowerCategory.includes("anti-inflammatory")) return <Flame className="h-5 w-5 text-red-500" />;
    if (lowerCategory.includes("heart")) return <Heart className="h-5 w-5 text-red-500" />;
    if (lowerCategory.includes("digestion")) return <Apple className="h-5 w-5 text-green-500" />;
    if (lowerCategory.includes("detox")) return <Droplet className="h-5 w-5 text-green-500" />;
    return <Sparkles className="h-5 w-5 text-primary" />;
  };

  return (
    <div className="flex flex-col h-[600px] bg-gradient-to-b from-amber-50 to-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
        <h2 className="font-semibold text-gray-800">Chat with Eden</h2>
        <Button variant="ghost" size="sm" onClick={resetChat} className="text-gray-500 hover:text-gray-700">
          <RefreshCw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>
            
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
              initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                className={`max-w-[75%] p-3 rounded-lg ${ 
                  message.sender === 'user' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
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
                          src={message.juice.imageUrl} // Use imageUrl from Juice object
                                  alt={message.juice.name} 
                                  className="h-full object-contain"
                                />
                              </div>
                              <div className="ml-3">
                                <h3 className="font-semibold text-gray-800 flex items-center">
                          {getJuiceIcon(message.juice.category)}
                                  <span className="ml-1">{message.juice.name}</span>
                                </h3>
                        {/* Show description or category */}
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{message.juice.description}</p>
                              </div>
                            </div>
                            
                    {/* Simplified benefits display */}
                    {/* 
                            <div className="p-3 border-t border-gray-100">
                      <p className="text-xs text-gray-700 font-medium mb-2">Key Benefit:</p>
                      <p className="text-xs text-gray-600">{message.juice.category}</p>
                            </div>
                    */}
                            
                    <div className="px-3 pb-3 flex flex-wrap gap-1 mt-2">
                      {getDisplayTags(message.juice).map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="p-3 border-t border-gray-100 flex justify-between items-center">
                              <div className="text-xs font-medium text-gray-700">₦{message.juice.price?.toLocaleString()}</div>
                              <Button 
                        onClick={() => handleAddToCart(message.juice)} // Pass the whole juice object
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
              <div className="max-w-[75%] p-3 rounded-lg bg-gray-100 text-gray-500">
                <motion.span
                   animate={{ opacity: [0.5, 1, 0.5] }}
                   transition={{ duration: 1, repeat: Infinity }}
                >Typing...
                </motion.span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>
            
      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
                <Input
                  type="text"
            placeholder="Ask about juice benefits..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={isLoadingJuices} // Disable input while loading juices
          />
          <Button onClick={handleSend} disabled={input.trim() === "" || isTyping || isLoadingJuices}>
                  <Send className="h-4 w-4" />
                </Button>
        </div>
         {isLoadingJuices && <p className="text-xs text-gray-500 mt-1">Loading juice data...</p>}
      </div>
    </div>
  );
};

export default JuiceChat;
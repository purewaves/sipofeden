import { Request, Response } from 'express';
import { storage } from './storage';
import type { Juice } from '@shared/schema';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  messages: ChatMessage[];
  customerInfo?: {
    name?: string;
    preferences?: string[];
    healthGoals?: string[];
  };
}

// In-memory chat sessions (in production, use Redis or database)
const chatSessions = new Map<string, ChatSession>();

/**
 * AI Chat Assistant for Sip of Eden
 * Provides 24/7 customer support with product information, health advice, and recipe suggestions
 */
export class SipOfEdenChatAssistant {
  private juices: Juice[] = [];
  
  constructor() {
    this.loadJuices();
  }
  
  private async loadJuices() {
    try {
      this.juices = await storage.getAllJuices();
      console.log(`Loaded ${this.juices.length} juices for AI chat assistant`);
    } catch (error) {
      console.error('Error loading juices for chat assistant:', error);
    }
  }
  
  /**
   * Process a chat message and generate an AI response
   */
  async processMessage(sessionId: string, userMessage: string, userInfo?: any): Promise<{
    response: string;
    suggestions?: string[];
    recommendedJuices?: Juice[];
    actionRequired?: string;
  }> {
    try {
      // Get or create chat session
      let session = chatSessions.get(sessionId);
      if (!session) {
        session = {
          id: sessionId,
          messages: [],
          customerInfo: userInfo
        };
        chatSessions.set(sessionId, session);
      }
      
      // Add user message to session
      session.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });
      
      // Analyze user intent and generate response
      const response = await this.generateResponse(userMessage, session);
      
      // Add AI response to session
      session.messages.push({
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      });
      
      return response;
    } catch (error) {
      console.error('Error processing chat message:', error);
      return {
        response: "I apologize, but I'm having trouble processing your request right now. Please try again or contact our support team for immediate assistance.",
        suggestions: ["Try rephrasing your question", "Contact support", "Browse our products"]
      };
    }
  }
  
  /**
   * Generate AI response based on user message and context
   */
  private async generateResponse(userMessage: string, session: ChatSession): Promise<{
    response: string;
    suggestions?: string[];
    recommendedJuices?: Juice[];
    actionRequired?: string;
  }> {
    const message = userMessage.toLowerCase();
    
    // Refresh juices if needed
    if (this.juices.length === 0) {
      await this.loadJuices();
    }
    
    // Intent Detection and Response Generation
    
    // 1. Product Information Queries
    if (this.isProductQuery(message)) {
      return this.handleProductQuery(message);
    }
    
    // 2. Health and Nutrition Advice
    if (this.isHealthQuery(message)) {
      return this.handleHealthQuery(message);
    }
    
    // 3. Order Status Checking
    if (this.isOrderQuery(message)) {
      return this.handleOrderQuery(message);
    }
    
    // 4. Recipe Suggestions
    if (this.isRecipeQuery(message)) {
      return this.handleRecipeQuery(message);
    }
    
    // 5. Subscription Inquiries
    if (this.isSubscriptionQuery(message)) {
      return this.handleSubscriptionQuery(message);
    }
    
    // 6. General Greeting/Help
    if (this.isGreeting(message)) {
      return this.handleGreeting(session);
    }
    
    // 7. Complaint or Issue
    if (this.isComplaint(message)) {
      return this.handleComplaint(message);
    }
    
    // Default response with helpful suggestions
    return this.handleGeneralQuery(message);
  }
  
  private isProductQuery(message: string): boolean {
    const productKeywords = ['juice', 'product', 'ingredients', 'flavor', 'taste', 'nutrition', 'calories', 'vitamins', 'what is', 'tell me about'];
    return productKeywords.some(keyword => message.includes(keyword));
  }
  
  private isHealthQuery(message: string): boolean {
    const healthKeywords = ['health', 'benefits', 'immune', 'detox', 'energy', 'weight', 'vitamin', 'antioxidant', 'cleanse', 'wellness'];
    return healthKeywords.some(keyword => message.includes(keyword));
  }
  
  private isOrderQuery(message: string): boolean {
    const orderKeywords = ['order', 'track', 'shipping', 'delivery', 'status', 'when will', 'where is'];
    return orderKeywords.some(keyword => message.includes(keyword));
  }
  
  private isRecipeQuery(message: string): boolean {
    const recipeKeywords = ['recipe', 'mix', 'combine', 'blend', 'smoothie', 'drink', 'how to make'];
    return recipeKeywords.some(keyword => message.includes(keyword));
  }
  
  private isSubscriptionQuery(message: string): boolean {
    const subscriptionKeywords = ['subscription', 'subscribe', 'weekly', 'monthly', 'plan', 'recurring', 'delivery'];
    return subscriptionKeywords.some(keyword => message.includes(keyword));
  }
  
  private isGreeting(message: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'help'];
    return greetings.some(greeting => message.includes(greeting));
  }
  
  private isComplaint(message: string): boolean {
    const complaintKeywords = ['problem', 'issue', 'complaint', 'wrong', 'bad', 'terrible', 'awful', 'disappointed', 'refund'];
    return complaintKeywords.some(keyword => message.includes(keyword));
  }
  
  private handleProductQuery(message: string): { response: string; suggestions?: string[]; recommendedJuices?: Juice[] } {
    // Find relevant juices based on query
    const relevantJuices = this.findRelevantJuices(message);
    
    if (relevantJuices.length > 0) {
      const juice = relevantJuices[0];
      return {
        response: `I'd love to tell you about our ${juice.name}! ${juice.description} It's priced at ₦${juice.price.toLocaleString()} and is currently ${juice.stock > 0 ? 'in stock' : 'out of stock'}. This juice is perfect for anyone looking for ${juice.category?.toLowerCase()} benefits.`,
        suggestions: ['Add to cart', 'See nutritional info', 'View other similar juices', 'Ask about health benefits'],
        recommendedJuices: relevantJuices.slice(0, 3)
      };
    }
    
    // General product information
    return {
      response: `We offer ${this.juices.length} premium organic cold-pressed juices! Our collection includes green juices packed with nutrients, antioxidant-rich berry blends, vitamin C-loaded citrus juices, and detoxifying root vegetable mixes. Each juice is freshly made with organic ingredients and no preservatives. Would you like to know about a specific type of juice or see our featured products?`,
      suggestions: ['Show featured juices', 'Tell me about green juices', 'What are your best sellers?', 'Nutritional information'],
      recommendedJuices: this.juices.filter(j => j.featured).slice(0, 3)
    };
  }
  
  private handleHealthQuery(message: string): { response: string; suggestions?: string[]; recommendedJuices?: Juice[] } {
    let healthResponse = '';
    let recommendedJuices: Juice[] = [];
    
    if (message.includes('immune') || message.includes('vitamin c')) {
      healthResponse = "Boost your immunity with our citrus-rich juices! Vitamin C is essential for immune system support. Our Citrus Sunshine blend combines orange, grapefruit, and lemon for maximum vitamin C content.";
      recommendedJuices = this.juices.filter(j => j.category?.toLowerCase().includes('citrus'));
    } else if (message.includes('detox') || message.includes('cleanse')) {
      healthResponse = "Detox naturally with our green juice blends! Green vegetables like kale, spinach, and celery help cleanse your system and provide essential nutrients. Our Green Machine is perfect for daily detox.";
      recommendedJuices = this.juices.filter(j => j.category?.toLowerCase().includes('green'));
    } else if (message.includes('energy') || message.includes('boost')) {
      healthResponse = "Get natural energy from our nutrient-dense juices! Root vegetables like beets and carrots provide natural sugars and iron for sustained energy. Try our Beet Energy or Carrot Ginger Blast.";
      recommendedJuices = this.juices.filter(j => j.category?.toLowerCase().includes('root'));
    } else if (message.includes('antioxidant')) {
      healthResponse = "Protect your cells with antioxidant-rich berry juices! Berries, pomegranate, and acai are loaded with antioxidants that fight free radicals and support overall health.";
      recommendedJuices = this.juices.filter(j => j.category?.toLowerCase().includes('berry'));
    } else {
      healthResponse = "Our organic cold-pressed juices offer numerous health benefits: immune support from vitamin C, detox support from greens, natural energy from root vegetables, and antioxidant protection from berries. Each juice is designed to support your wellness goals!";
      recommendedJuices = this.juices.filter(j => j.featured);
    }
    
    return {
      response: healthResponse,
      suggestions: ['Show health benefits', 'Recommend for my goals', 'Nutritional facts', 'Start a cleanse program'],
      recommendedJuices: recommendedJuices.slice(0, 3)
    };
  }
  
  private handleOrderQuery(message: string): { response: string; suggestions?: string[]; actionRequired?: string } {
    return {
      response: "I'd be happy to help you track your order! To check your order status, I'll need your order number. If you don't have it handy, you can find it in your confirmation email. For immediate assistance with order tracking, our admin team can help you directly.",
      suggestions: ['Contact admin support', 'Check confirmation email', 'View order history', 'Update delivery address'],
      actionRequired: 'provide_order_number'
    };
  }
  
  private handleRecipeQuery(message: string): { response: string; suggestions?: string[] } {
    const recipes = [
      "🌟 Morning Boost: Mix Green Machine + Citrus Sunshine (50/50) for the perfect morning energy blend!",
      "🍓 Antioxidant Power: Combine Berry Antioxidant + Carrot Ginger (70/30) for immune support!",
      "🥒 Hydration Hero: Blend Celery Hydrator + a splash of lemon for ultimate hydration!",
      "🥕 Energy Smoothie: Mix Beet Energy + Carrot Ginger + ice for a natural pre-workout drink!",
      "🍃 Detox Elixir: Combine Green Machine + Celery Hydrator + mint for deep cleansing!"
    ];
    
    return {
      response: `Here are some delicious juice recipes you can make with our products:\n\n${recipes.join('\n\n')}\n\nAll our juices can be mixed together or enjoyed on their own. For best results, consume within 24 hours of opening and keep refrigerated.`,
      suggestions: ['Try a recipe', 'Custom blend request', 'Nutrition tips', 'Storage instructions']
    };
  }
  
  private handleSubscriptionQuery(message: string): { response: string; suggestions?: string[] } {
    return {
      response: "Our subscription plans are perfect for regular juice lovers! We offer two options:\n\n🌿 Weekly Fresh Plan: 6 bottles weekly for ₦45,999 (free delivery, mix & match flavors)\n🏆 Monthly Wellness Plan: 20 bottles monthly for ₦149,999 (15% savings, nutrition guide included)\n\nBoth plans can be cancelled anytime, and you can pause deliveries when needed. Subscribers get early access to new flavors and exclusive discounts!",
      suggestions: ['Start Weekly Plan', 'Start Monthly Plan', 'Customize my plan', 'Pause subscription', 'Gift a subscription']
    };
  }
  
  private handleGreeting(session: ChatSession): { response: string; suggestions?: string[] } {
    const timeOfDay = new Date().getHours();
    let greeting = 'Hello';
    
    if (timeOfDay < 12) greeting = 'Good morning';
    else if (timeOfDay < 17) greeting = 'Good afternoon';
    else greeting = 'Good evening';
    
    return {
      response: `${greeting}! Welcome to Sip of Eden! 🌿 I'm your personal juice assistant, here to help you 24/7. I can help you find the perfect juice for your needs, answer questions about health benefits, track orders, suggest recipes, and provide nutrition advice. What can I help you with today?`,
      suggestions: ['Browse our juices', 'Health recommendations', 'Track my order', 'Recipe ideas', 'Subscription plans']
    };
  }
  
  private handleComplaint(message: string): { response: string; suggestions?: string[]; actionRequired?: string } {
    return {
      response: "I sincerely apologize for any inconvenience you've experienced. Your satisfaction is our top priority, and I want to make this right immediately. Please provide details about the issue so I can assist you better, or I can connect you directly with our admin team for immediate resolution. We stand behind the quality of our products and service.",
      suggestions: ['Speak to admin', 'Request refund', 'Report product issue', 'Get replacement'],
      actionRequired: 'escalate_to_admin'
    };
  }
  
  private handleGeneralQuery(message: string): { response: string; suggestions?: string[] } {
    return {
      response: "I'm here to help with anything related to our organic cold-pressed juices! I can assist you with product information, health benefits, order tracking, recipe suggestions, subscription plans, and general wellness advice. Feel free to ask me anything about our juices or how they can support your health goals.",
      suggestions: ['Browse products', 'Health benefits', 'Recipe ideas', 'Subscription info', 'Contact support']
    };
  }
  
  private findRelevantJuices(query: string): Juice[] {
    const searchTerms = query.toLowerCase().split(' ');
    
    return this.juices.filter(juice => {
      const searchText = `${juice.name} ${juice.description} ${juice.category}`.toLowerCase();
      return searchTerms.some(term => searchText.includes(term));
    }).sort((a, b) => b.featured ? 1 : -1);
  }
}

// Global chat assistant instance
export const chatAssistant = new SipOfEdenChatAssistant();

/**
 * Express route handlers for chat API
 */
export const chatRoutes = {
  /**
   * POST /api/chat/message
   * Send a message to the AI chat assistant
   */
  async sendMessage(req: Request, res: Response) {
    try {
      const { message, sessionId, userInfo } = req.body;
      
      if (!message || !sessionId) {
        return res.status(400).json({ 
          error: 'Message and sessionId are required' 
        });
      }
      
      const response = await chatAssistant.processMessage(sessionId, message, userInfo);
      
      res.json({
        success: true,
        ...response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in chat message endpoint:', error);
      res.status(500).json({ 
        error: 'Failed to process chat message',
        fallbackResponse: "I'm experiencing technical difficulties. Please try again or contact our support team."
      });
    }
  },
  
  /**
   * GET /api/chat/session/:sessionId
   * Get chat session history
   */
  async getSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const session = chatSessions.get(sessionId);
      
      if (!session) {
        return res.json({
          success: true,
          session: {
            id: sessionId,
            messages: [],
            customerInfo: null
          }
        });
      }
      
      res.json({
        success: true,
        session
      });
    } catch (error) {
      console.error('Error getting chat session:', error);
      res.status(500).json({ 
        error: 'Failed to get chat session' 
      });
    }
  },
  
  /**
   * DELETE /api/chat/session/:sessionId
   * Clear chat session
   */
  async clearSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      chatSessions.delete(sessionId);
      
      res.json({
        success: true,
        message: 'Chat session cleared'
      });
    } catch (error) {
      console.error('Error clearing chat session:', error);
      res.status(500).json({ 
        error: 'Failed to clear chat session' 
      });
    }
  }
};
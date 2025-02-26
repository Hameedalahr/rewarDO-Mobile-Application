import { Platform } from 'react-native';

const DEEPSEEK_API_URL = 'https://api.deepseek.ai/v1';
const DEEPSEEK_API_KEY = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;

const MAX_RETRIES = 2; // Reduced from 3 to 2 for faster fallback
const RETRY_DELAY = 500; // Reduced from 1000ms to 500ms for faster response

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Cache for storing recent responses
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function generateAIResponse(messages: ChatMessage[]) {
  const lastMessage = messages[messages.length - 1].content;
  const cacheKey = JSON.stringify(messages);
  
  // Check cache first
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.response;
  }

  // If no API key is configured, use mock responses immediately
  if (!DEEPSEEK_API_KEY) {
    const mockResponse = getMockResponse(lastMessage);
    responseCache.set(cacheKey, { response: mockResponse, timestamp: Date.now() });
    return mockResponse;
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-coder-6.7b-instruct',
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      responseCache.set(cacheKey, { response: aiResponse, timestamp: Date.now() });
      return aiResponse;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('DeepSeek AI request timed out');
        continue;
      }
      
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAY * Math.pow(2, attempt));
        continue;
      }
      
      console.warn('DeepSeek AI: Falling back to mock response');
      const mockResponse = getMockResponse(lastMessage);
      responseCache.set(cacheKey, { response: mockResponse, timestamp: Date.now() });
      return mockResponse;
    }
  }

  const mockResponse = getMockResponse(lastMessage);
  responseCache.set(cacheKey, { response: mockResponse, timestamp: Date.now() });
  return mockResponse;
}

// Improved mock responses with more variety
function getMockResponse(prompt: string) {
  const lowercasePrompt = prompt.toLowerCase();
  
  if (lowercasePrompt.includes('task') || lowercasePrompt.includes('priority')) {
    const responses = [
      `Here's my task prioritization advice:
1. Focus on high-impact tasks first
2. Break down complex tasks into smaller steps
3. Consider deadlines and dependencies
4. Balance urgent vs important tasks`,
      `Let me help you prioritize:
1. Identify your most critical deadlines
2. Focus on tasks with biggest impact
3. Handle quick wins in between
4. Schedule breaks to stay productive`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowercasePrompt.includes('focus') || lowercasePrompt.includes('session')) {
    const responses = [
      `Based on productivity research:
• Start with 25-minute focus sessions
• Take 5-minute breaks between sessions
• Gradually increase duration as comfortable
• Track your progress to stay motivated`,
      `Here's what I suggest for better focus:
• Find your peak productivity hours
• Minimize distractions during sessions
• Use the Pomodoro technique
• Celebrate completing each session`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  const defaultResponses = [
    `Here are some productivity tips:
1. Set clear goals for each day
2. Use time-blocking for better focus
3. Take regular breaks to stay fresh
4. Review and adjust your approach`,
    `I can help you be more productive:
1. Plan your most important tasks first
2. Break work into focused sessions
3. Track your progress regularly
4. Maintain a healthy work-life balance`
  ];
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

interface TaskSuggestion {
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
}

function parseDateFromText(text: string): Date {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const lowercaseText = text.toLowerCase();
  
  if (lowercaseText.includes('tomorrow')) {
    return tomorrow;
  }
  
  if (lowercaseText.includes('today')) {
    return today;
  }
  
  // Add more date parsing logic here if needed
  
  return tomorrow; // Default to tomorrow if no specific date is mentioned
}

export const aiHelpers = {
  async suggestTaskPriorities(tasks: any[]) {
    const prompt = `Given these tasks: ${JSON.stringify(tasks)}, suggest priority order based on urgency, importance, and estimated effort.`;
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a productivity AI assistant focused on task management and prioritization.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return generateAIResponse(messages);
  },

  async analyzeFocusPatterns(sessions: any[]) {
    const prompt = `Analyze these focus sessions: ${JSON.stringify(sessions)}. Identify patterns and suggest improvements.`;
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a productivity AI assistant specializing in focus and time management analysis.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return generateAIResponse(messages);
  },

  async generateProductivityInsights(userData: any) {
    const prompt = `Based on this user data: ${JSON.stringify(userData)}, provide actionable productivity insights.`;
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a productivity AI assistant that provides personalized insights and recommendations.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return generateAIResponse(messages);
  },

  async parseTasksFromText(text: string): Promise<any[]> {
    try {
      // Extract potential tasks using simple rules
      const tasks = text.split(/[.,;]|\band\b/).map(part => {
        const taskText = part.trim();
        if (!taskText) return null;

        // Determine priority based on keywords
        let priority = 'medium';
        if (taskText.toLowerCase().includes('urgent') || taskText.toLowerCase().includes('important')) {
          priority = 'high';
        } else if (taskText.toLowerCase().includes('later') || taskText.toLowerCase().includes('eventually')) {
          priority = 'low';
        }

        // Parse due date from text
        const dueDate = parseDateFromText(taskText);

        return {
          title: taskText,
          description: `Task extracted from: "${text}"`,
          priority,
          due_date: dueDate.toISOString()
        };
      }).filter(Boolean);

      return tasks;
    } catch (error: any) {
      console.warn('Error parsing tasks:', error);
      return [];
    }
  },

  async generateResponse(input: string, tasks: any[] = []) {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a productivity AI assistant. When responding to task-related queries:
1. Acknowledge the task(s) being added
2. Provide relevant advice or suggestions
3. Be concise but helpful
4. If a specific date is mentioned, reference it in your response`
      },
      {
        role: 'user',
        content: input
      }
    ];

    if (tasks.length > 0) {
      messages.push({
        role: 'system',
        content: `Tasks being added: ${JSON.stringify(tasks)}`
      });
    }

    return generateAIResponse(messages);
  },

  generateAIResponse
}; 
# Productivity App - Context & Development Plan

## Context

### Introduction
A productivity app designed to help users focus on one task at a time, leveraging AI for task prioritization, offering intuitive task management, and featuring a Focus Mode for deep work sessions.

### Core Features

#### 1. User Authentication
- Clean, minimalistic welcome screen
- Email-based authentication
- Secure login/signup flow

#### 2. Main Dashboard
- AI-prioritized task list
- Quick-Add functionality
- Natural language input via AI chat
- Real-time updates and sync

#### 3. Task Management
- Quick-Add manual entry
- AI-powered voice/text input
- Smart categorization
- Priority assignment
- Due date management
- Note attachments
- Custom filters and sorting

#### 4. Focus Mode
- Notification blocking
- Customizable timer
- Break reminders
- Session tracking
- Progress analytics

### Enhanced Features

#### User Experience
- Dark Mode support
- Custom theme options
- Cross-device synchronization
- Smart notifications
- Third-party app integrations

#### Gamification
- Achievement system
- Productivity streaks
- Progress badges
- Performance rewards

#### TOD Coins System
- 1 minute in Focus Mode = 1 TOD Coin
- Partial rewards for incomplete sessions
- In-app shop redemption
- Partner brand products

### Monetization Strategy
- Post-session advertisements
- 30-40% revenue reinvestment in rewards
- Partner brand collaborations
- Commission-based sales

## Development Plan

### Phase 1: Foundation
#### Technical Setup
- React Native with TypeScript
- Expo Router implementation
- Supabase backend integration
- State management with Zustand
- Project structure organization

#### Core Authentication
- User registration flow
- Login system
- Profile management
- Security implementations

### Phase 2: Task Management
#### Basic Task Features
- Task creation interface
- Priority system
- Due date handling
- Category management

#### Advanced Task Features
- AI-powered task suggestions
- Natural language processing
- Smart categorization
- Task analytics

### Phase 3: Focus Mode
#### Timer Implementation
- Customizable focus timer
- Break timer system
- Session tracking
- Progress indicators

#### Focus Features
- Notification management
- Sound alerts
- Session statistics
- Break activities

### Phase 4: AI Integration
#### AI Assistant
- Task prioritization
- Productivity suggestions
- Natural language processing
- Performance insights

#### Smart Features
- Automated scheduling
- Task difficulty assessment
- Time estimation
- Progress tracking

### Phase 5: Gamification
#### Achievement System
- Achievement categories
- Progress tracking
- Reward system
- Streak monitoring

#### TOD Coins
- Earning mechanism
- Reward calculations
- Store integration
- Partner products

### Phase 6: Analytics & Insights
#### User Statistics
- Focus time tracking
- Task completion rates
- Productivity patterns
- Performance metrics

#### Reporting
- Daily/weekly reports
- Progress visualization
- Trend analysis
- Achievement tracking

### Phase 7: User Experience
#### Interface Improvements
- Theme customization
- Navigation optimization
- Animation refinement
- Accessibility features

#### Performance
- Load time optimization
- State management efficiency
- Memory usage optimization
- Battery consumption reduction

### Phase 8: Monetization
#### Ad Integration
- Post-session ads
- Non-intrusive placement
- Revenue tracking
- User experience balance

#### Partner Integration
- Brand collaborations
- Product offerings
- Commission system
- Reward structure

## Future Enhancements

### Planned Features
- Offline support
- Data synchronization
- Social features
- Advanced analytics
- Third-party integrations

### Technical Improvements
- Performance optimization
- Security enhancements
- Scale preparation
- Platform-specific features
I'll help you create a database schema and folder structure, then add it to the CONTEXT.md file. Here's the update:

```markdown:docs/CONTEXT.md
# Productivity App - Context & Development Plan

[Previous sections remain unchanged...]

## Database Schema

### Users Table
```sql
users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    theme_preference VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

### Tasks Table
```sql
tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority INTEGER CHECK (priority BETWEEN 1 AND 5),
    due_date TIMESTAMP WITH TIME ZONE,
    category_id UUID REFERENCES categories(id),
    status VARCHAR(20) DEFAULT 'pending',
    estimated_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

### Categories Table
```sql
categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7),
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

### Focus Sessions Table
```sql
focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    completed BOOLEAN DEFAULT false,
    tod_coins_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

### Achievements Table
```sql
achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    tod_coins_reward INTEGER DEFAULT 0,
    requirements JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

### User Achievements Table
```sql
user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress JSONB
)
```

### TOD Coins Transactions Table
```sql
tod_coins_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

### Store Items Table
```sql
store_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    image_url TEXT,
    partner_id UUID,
    available_quantity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

## Project Structure

```
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (app)/
│   │   ├── dashboard.tsx
│   │   ├── tasks/
│   │   │   ├── index.tsx
│   │   │   ├── [id].tsx
│   │   │   └── create.tsx
│   │   ├── focus/
│   │   │   ├── index.tsx
│   │   │   └── session/[id].tsx
│   │   ├── achievements/
│   │   │   └── index.tsx
│   │   ├── store/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   └── settings/
│   │       └── index.tsx
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   ├── tasks/
│   │   ├── TaskCard.tsx
│   │   ├── TaskList.tsx
│   │   └── TaskForm.tsx
│   ├── focus/
│   │   ├── Timer.tsx
│   │   └── SessionControls.tsx
│   └── achievements/
│       ├── AchievementCard.tsx
│       └── ProgressBar.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useTasks.ts
│   ├── useFocus.ts
│   └── useAchievements.ts
├── services/
│   ├── api/
│   │   ├── tasks.ts
│   │   ├── focus.ts
│   │   └── achievements.ts
│   ├── supabase.ts
│   └── ai.ts
├── stores/
│   ├── authStore.ts
│   ├── taskStore.ts
│   └── focusStore.ts
├── utils/
│   ├── constants.ts
│   ├── helpers.ts
│   └── types.ts
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── styles/
│   ├── theme.ts
│   └── global.ts
├── config/
│   └── index.ts
└── tests/
    ├── components/
    ├── hooks/
    └── utils/
```

[Rest of the existing content remains unchanged...]
```

This update adds two major sections to your CONTEXT.md file:

1. **Database Schema**: A comprehensive SQL schema that covers all the core functionalities of your app, including:
   - User management
   - Task management
   - Focus sessions
   - Achievements system
   - TOD Coins economy
   - Store items

2. **Project Structure**: A well-organized folder structure following React Native and Expo Router best practices, with:
   - Clear separation of concerns
   - Modular components
   - Type-safe implementation
   - Scalable architecture
   - Easy testing setup

The structure follows modern React Native development practices and makes use of Expo Router for navigation. Each major feature has its own dedicated directory for components, and shared utilities are organized in appropriate folders.

The database schema is designed to be efficient and scalable, with proper relationships between tables and appropriate data types. It includes all necessary fields to support the app's core features while maintaining data integrity through foreign key constraints.

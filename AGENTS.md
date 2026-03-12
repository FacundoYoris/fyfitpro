# FY FitPro - AGENTS.md

## Project Overview

FY FitPro is a gym management web application with two main profiles: admin and gym user. The system manages users, membership plans, payments, exercises, and workout routines.

### Tech Stack
- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: Express + TypeScript
- **ORM**: Prisma 5
- **Database**: SQLite (dev.db)

---

## Build/Lint/Test Commands

### Backend Commands

```bash
# Development server (with hot reload)
cd backend && npm run dev

# Build TypeScript
cd backend && npm run build

# Start production server
cd backend && npm run start

# Seed database with initial data
cd backend && npm run db:seed
```

### Frontend Commands

```bash
# Development server (port 3000)
cd frontend && npm run dev

# Production build
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview
```

### Database Commands

```bash
# Run Prisma migrations
cd backend && npx prisma migrate dev

# Generate Prisma Client
cd backend && npx prisma generate

# Open Prisma Studio (database GUI)
cd backend && npx prisma studio
```

---

## Code Style Guidelines

### TypeScript Configuration

- **Strict mode enabled** - All TypeScript code must be type-safe
- Use explicit types for function parameters and return values
- Avoid `any` - use `unknown` if type is truly unknown

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (components) | PascalCase | `UserDetail.tsx` |
| Files (utilities) | camelCase | `syncDb.ts` |
| Variables/Functions | camelCase | `getUsers()`, `userData` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Interfaces/Types | PascalCase | `UserAttributes` |
| Database Models | PascalCase | `User`, `Payment` |

### Import Organization

Order imports as follows:
1. External libraries (React, express, etc.)
2. Internal modules (services, context)
3. Relative imports (components, utils)
4. Type imports

```typescript
// 1. External
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Internal
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// 3. Relative
import UserForm from './UserForm';
import './UserDetail.css';

// 4. Types
import { User } from '../types';
```

### React Component Guidelines

- Use functional components with hooks
- Export components as named exports
- Colocate styles with components (same folder)
- Use TypeScript interfaces for props
- Keep components small and focused

```typescript
// Good
interface UserCardProps {
  user: User;
  onEdit: (id: number) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user.id)}>Edit</button>
    </div>
  );
};
```

### Error Handling

- Always wrap async operations in try-catch
- Return proper HTTP status codes
- Provide meaningful error messages
- Log errors for debugging

```typescript
// Good
export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error in getUser:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
```

### API Response Format

All API responses should follow this structure:

```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, message: 'Error description' }
```

### Database (Prisma)

- Always use transactions for multiple related operations
- Use proper error handling with Prisma errors
- Validate data before database operations

### Security

- Never expose sensitive data in responses
- Hash passwords with bcrypt
- Validate all user inputs
- Use JWT for authentication

### File Structure

```
backend/
├── src/
│   ├── config/         # Database, JWT config
│   ├── controllers/    # Request handlers
│   ├── middleware/    # Auth, validation
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── utils/         # Helper functions
│   └── app.ts         # Express app entry
└── prisma/
    └── schema.prisma   # Database schema

frontend/
├── src/
│   ├── components/    # Reusable components
│   ├── context/      # React Context
│   ├── pages/        # Page components
│   ├── services/     # API calls
│   ├── types/        # TypeScript types
│   └── styles/       # Global styles
```

### Testing

- No test framework configured yet
- When adding tests, use Vitest for frontend
- Follow AAA pattern: Arrange, Act, Assert

### Git Conventions

- Use meaningful commit messages
- Keep commits atomic and focused
- Follow conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`

---

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/app.ts` | Express server setup |
| `backend/prisma/schema.prisma` | Database models |
| `frontend/src/App.tsx` | Main React app with routing |
| `frontend/src/context/AuthContext.tsx` | Authentication state |

---

## Running the Application

1. **Start backend**: `cd backend && npm run dev` (runs on port 3001)
2. **Start frontend**: `cd frontend && npm run dev` (runs on port 3000)
3. **Default login**: admin@gimnasio.com / admin123

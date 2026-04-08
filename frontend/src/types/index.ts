export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'admin' | 'user';
  firstName: string;
  lastName: string;
  phone?: string;
  dni?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: number;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  daysPerWeek?: number;
  benefits?: string;  // Stored as pipe-separated string in DB
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  userId: number;
  amount: number;
  paymentDate: string;
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'other';
  receipt?: string;
  month: number;
  year: number;
  createdAt: string;
  user?: User;
}

export interface MuscleGroup {
  id: number;
  name: string;
  createdAt: string;
  exercisesCount?: number;
}

export interface Exercise {
  id: number;
  name: string;
  muscleGroup?: string;
  description?: string;
  defaultSets: number;
  defaultReps: number;
  isActive: boolean;
  repScheme?: string | null;
}

export interface RoutineExercise {
  id?: number;
  exerciseId: number;
  exercise?: Exercise;
  orderIndex: number;
  sets: number;
  reps: number;
  repScheme?: string;
  observations?: string;
}

export interface Routine {
  id: number;
  name: string;
  description?: string;
  duration?: number | null;
  difficulty: number;
  userId?: number;
  exercises?: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface UserPlan {
  id: number;
  userId: number;
  planId: number;
  plan?: Plan;
  startDate: string;
  endDate?: string;
  assignedBy?: number;
  isActive: boolean;
}

export interface UserRoutine {
  id: number;
  userId: number;
  routineId: number;
  routine?: Routine;
  assignedAt: string;
  assignedBy?: number;
  isActive: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  revenueThisMonth: number;
  totalPlans: number;
  totalRoutines: number;
  paymentsThisMonth: number;
}

export interface UserOverview {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dni?: string;
  isActive: boolean;
  createdAt: string;
  plan: {
    id: number;
    name: string;
    price: number;
    endDate: string;
  } | null;
  routine: {
    id: number;
    name: string;
    assignedAt: string;
  } | null;
  paymentStatus: {
    isPaid: boolean;
    paymentId: number | null;
    month: number;
    year: number;
    lastPaymentDate: string | null;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    users?: T[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface MemberRoutineDay {
  id: number;
  dayNumber: number;
  name: string;
  orderIndex: number;
  routineExercises: MemberRoutineExercise[];
}

export interface MemberRoutineExercise {
  id: number;
  exerciseId: number;
  orderIndex: number;
  sets: number;
  reps: number;
  repScheme?: string;
  observations?: string;
  exercise: Exercise;
  lastWeight: number | null;
  lastWeightDate: string | null;
}

export interface MemberRoutine {
  id: number;
  routine: {
    id: number;
    name: string;
    description?: string;
    duration?: number;
    daysCount: number;
  };
  assignedAt: string;
  days: MemberRoutineDay[];
}

export interface CalendarDay {
  date: string;
  day: number;
  weekDayNumber: number;
  isOtherMonth: boolean;
  cycleDayNumber: number | null;
  routineDay: {
    id: number;
    name: string;
    dayNumber: number;
  } | null;
  session: {
    id: number;
    status: string;
    notes?: string;
    exerciseCount: number;
  } | null;
}

export interface CalendarData {
  month: number;
  year: number;
  days: CalendarDay[];
  routineDays: {
    id: number;
    name: string;
    dayNumber: number;
  }[];
}

export interface WorkoutLogEntry {
  exerciseId: number;
  sets: {
    setNumber: number;
    weight?: number;
    reps?: number;
    notes?: string;
  }[];
}

export interface WorkoutLogPayload {
  date: string;
  routineDayId: number;
  entries: WorkoutLogEntry[];
  status?: 'pending' | 'completed' | 'skipped';
  notes?: string;
}

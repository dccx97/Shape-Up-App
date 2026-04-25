export interface Profile {
  id: string;
  name: string;
  sex: string;
  age?: number; // legacy
  dateOfBirth?: string;
  location?: string; // legacy
  city?: string;
  state?: string;
  image?: string;
  theme?: string;
}

export interface Supplement {
  id: string;
  profileId: string;
  name: string;
  brand: string;
  schedule: number[]; // 0 = Sunday, 1 = Monday, etc.
  reasonForTaking: string;
  buyLink: string;
  currentQuantity: number;
  dosage: number;
  strength?: string;
  bottleImage?: string;
  pillImage?: string;
  ordersCount?: number;
  orderHistory?: OrderLog[];
  type?: 'OTC' | 'Prescription';
  doctorName?: string;
  doctorPhone?: string;
}

export interface OrderLog {
  id: string;
  date: string;
  quantityAdded: number;
  notes?: string;
}

export interface IntakeLog {
  id: string;
  profileId: string;
  supplementId: string;
  date: string; // YYYY-MM-DD string
  taken: boolean;
}

export type FileCategory = 'Purchase Receipt' | 'Lab Reports' | 'Doctors Notes' | 'Dosing Instructions' | 'Other';

export interface DocumentFile {
  id: string;
  profileId: string;
  title: string;
  category: FileCategory;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  data: string; // Base64 encoded file content
}

export interface HealthLogEdit {
  timestamp: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface HealthMetric {
  id: string;
  name: string;
  isDeletable: boolean;
}

export interface HealthLog {
  id: string;
  profileId: string;
  date: string; // YYYY-MM-DD
  weight?: number; // lbs
  bodyFat?: number; // percentage
  visceralFat?: number;
  customMetrics?: Record<string, number>;
  notes?: string;
  editHistory?: HealthLogEdit[];
}

export interface WorkoutExercise {
  id: string;
  name: string; // e.g., "30lb Dumbbell curls"
  sets?: number;
  reps?: number;
  weight?: number; // lbs
  duration?: number; // minutes
  notes?: string;
}

export interface Workout {
  id: string;
  profileId: string;
  name: string;
  isOneOff: boolean;
  oneOffDate?: string; // YYYY-MM-DD
  schedule: number[]; // 0 = Sunday, 1 = Monday, etc. (for recurring)
  time?: string; // HH:MM
  category?: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutLog {
  id: string;
  profileId: string;
  workoutId: string;
  date: string; // YYYY-MM-DD string
  completed: boolean;
}

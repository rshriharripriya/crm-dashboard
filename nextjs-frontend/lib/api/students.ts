// students.ts

// Student interface for directory
export interface Student {
  id: string;
  name: string;
  email: string;
  country: string | null;
  application_status: string;
  last_active: string | null;
  tags: string[] | null;
}

// Extended student interface for profile page
export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  application_status: string;
  last_active: string | null;
  tags: string[] | null;
  internal_notes: string | null;
}

// Communication log interface
export interface CommunicationLog {
  id: string;
  student_id: string;
  type: string;
  content: string | null;
  timestamp: string;
}

// AI Summary response interface
export interface AiSummaryResponse {
  summary: string;
}

// Type definitions for student statistics
export interface StudentStats {
  activeStudents: number;
  applyingStage: number;
  needsEssayHelp: number;
  highIntent: number;
  notContactedRecently: number;
}

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Fetches all students from the backend
 */
export const getStudents = async (): Promise<Student[]> => {
  const response = await fetch(`${apiUrl}/students`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch students. Status: ${response.status}`);
  }

  return await response.json();
};

/**
 * Fetches a single student profile by ID
 */
export const getStudentProfile = async (studentId: string): Promise<StudentProfile> => {
  const response = await fetch(`${apiUrl}/students/${studentId}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch student profile. Status: ${response.status}`);
  }

  return await response.json();
};

/**
 * Fetches communication logs for a student
 */
export const getCommunicationLogs = async (studentId: string): Promise<CommunicationLog[]> => {
  const response = await fetch(`${apiUrl}/students/${studentId}/communications`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch communication logs. Status: ${response.status}`);
  }

  return await response.json();
};

/**
 * Fetches AI summary for a student
 */
export const getAiSummary = async (studentId: string): Promise<AiSummaryResponse> => {
  const response = await fetch(`${apiUrl}/students/${studentId}/ai-summary`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch AI summary. Status: ${response.status}`);
  }

  return await response.json();
};

/**
 * Sends a follow-up email to a student
 */
export const sendFollowUpEmail = async (studentId: string): Promise<void> => {
  const response = await fetch(`${apiUrl}/students/${studentId}/email`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to send email. Status: ${response.status}`);
  }
};

/**
 * Updates internal notes for a student
 */
export const updateStudentNotes = async (studentId: string, notes: string): Promise<StudentProfile> => {
  const response = await fetch(`${apiUrl}/students/${studentId}/internal_notes`, {
    method: 'PATCH',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ internal_notes: notes }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save notes. Status: ${response.status}`);
  }

  return await response.json();
};

/**
 * Updates tags for a student
 */
export const updateStudentTags = async (studentId: string, tags: string[]): Promise<StudentProfile> => {
  const response = await fetch(`${apiUrl}/students/${studentId}/tags`, {
    method: 'PATCH',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tags }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update tags: ${response.status} ${errorText}`);
  }

  return await response.json();
};

/**
 * Adds a communication log for a student
 */
export const addCommunicationLog = async (
  studentId: string,
  type: string,
  content: string
): Promise<CommunicationLog> => {
  const response = await fetch(`${apiUrl}/students/${studentId}/communication`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      student_id: studentId,
      type,
      content
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add communication log. Status: ${response.status}`);
  }

  return await response.json();
};

/**
 * Fetches student statistics from the backend
 */
export const getStudentStats = async (): Promise<StudentStats> => {
  const response = await fetch(`${apiUrl}/students/stats`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch student statistics');
  }

  return await response.json();
};
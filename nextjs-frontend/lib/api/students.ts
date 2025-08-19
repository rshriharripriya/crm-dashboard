// Type definitions for student statistics
export interface StudentStats {
  activeStudents: number;
  applyingStage: number;
  needsEssayHelp: number;
  highIntent: number;
  notContactedRecently: number;
}

/**
 * Fetches student statistics from the backend
 */
export const getStudentStats = async (): Promise<StudentStats> => {
  const response = await fetch('http://localhost:8000/students/stats', {
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


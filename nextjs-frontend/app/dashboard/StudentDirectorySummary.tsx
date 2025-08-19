"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  count: number;
  color: 'yellow' | 'green' | 'blue' | 'red' | 'purple' | 'darkgreen';
  icon: React.ReactNode;
}

const StatCard = ({ title, count, color, icon }: StatCardProps) => {
  const colorMap = {
    yellow: {
      bg: 'bg-yellow-light',
      text: 'text-yellow-dark',
      border: 'border-yellow-border',
      glow: 'shadow-glow-yellow'
    },
    green: {
      bg: 'bg-green-light',
      text: 'text-green-dark',
      border: 'border-green-border',
      glow: 'shadow-glow-green'
    },
    blue: {
      bg: 'bg-blue-light',
      text: 'text-blue-dark',
      border: 'border-blue-border',
      glow: 'shadow-glow-blue'
    },
    red: {
      bg: 'bg-red-light',
      text: 'text-red-dark',
      border: 'border-red-border',
      glow: 'shadow-glow-red'
    },
    purple: {
      bg: 'bg-purple-light',
      text: 'text-purple-dark',
      border: 'border-purple-border',
      glow: 'shadow-glow-purple'
    },
    darkgreen: {
      bg: 'bg-darkgreen-light',
      text: 'text-darkgreen-dark',
      border: 'border-darkgreen-border',
      glow: 'shadow-glow-darkgreen'
    }
  };

  return (
    <Card
      className={`relative p-6 ${colorMap[color].bg} ${colorMap[color].border} border-2 rounded-xl ${colorMap[color].glow} transition-all duration-300 hover:scale-105 overflow-hidden`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-xl font-semibold ${colorMap[color].text}`}>{title}</h3>
          <p className={`text-4xl font-bold mt-2 ${colorMap[color].text}`}>{count}</p>
        </div>
        <div className={`text-4xl ${colorMap[color].text} opacity-80`}>{icon}</div>
      </div>
      {/* Glow effect circle in the background */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white opacity-10 blur-xl"></div>
    </Card>
  );
};

interface StudentStats {
  activeStudents: number;
  applyingStage: number;
  needsEssayHelp: number;
  highIntent: number;
  notContactedRecently: number;
}

const StudentDirectorySummary = () => {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError] = useState<boolean>(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Import the getStudentStats function to fetch data
        const { getStudentStats } = await import('@/lib/api/students');
        const data = await getStudentStats();
        console.log('Received student stats:', data);
        setStats(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching student stats:', error);

        // // Fall back to mock data if API fails
        // const mockData: StudentStats = {
        //   activeStudents: 120,
        //   applyingStage: 4,
        //   needsEssayHelp: 5,
        //   highIntent: 12,
        //   notContactedRecently: 7
        // };

        // setStats(mockData);
        setIsLoading(false);
      }
        // catch (error) {
      //   console.error('Error fetching student stats:', error);
      //   setIsError(true);
      //   setIsLoading(false);
      // }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
      ))}
    </div>;
  }

  if (isError) {
    return <div className="text-red-500">Error loading student statistics</div>;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Student Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Active Students" 
          count={stats?.activeStudents || 0} 
          color="green"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>}
        />
        <StatCard 
          title="Applying Stage" 
          count={stats?.applyingStage || 0} 
          color="blue"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
          </svg>}
        />
        <StatCard 
          title="Needs Essay Help" 
          count={stats?.needsEssayHelp || 0} 
          color="purple"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>}
        />
        <StatCard 
          title="High Intent" 
          count={stats?.highIntent || 0} 
          color="darkgreen"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
          </svg>}
        />
        <StatCard 
          title="Not Contacted" 
          count={stats?.notContactedRecently || 0} 
          color="red"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>}
        />
      </div>
    </div>
  );
};

export default StudentDirectorySummary;

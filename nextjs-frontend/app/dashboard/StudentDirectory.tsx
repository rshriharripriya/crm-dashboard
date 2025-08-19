// app/dashboard/StudentDirectory.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { getTagColors } from "@/lib/constants/tagColors";
import { getStudents, Student } from '@/lib/api/students'; // Import the API function and type

const predefinedTags = [
    "Students not contacted in 7 days",
    "High intent",
    "Needs essay help"
];

const StudentDirectory: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const [search, setSearch] = useState<string>("");
    const [status, setStatus] = useState<string>("all");
    const [country, setCountry] = useState<string>("all");
    const [selectedTags, setSelectedTags] = useState<string[]>([])

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const data = await getStudents(); // Use the API function
                setStudents(data);
                setLoading(false);
            } catch (e: unknown) {
                if (e instanceof Error) {
                    setError(e.message);
                    setLoading(false);
                }
            }
        };

        fetchStudents();
    }, []);

    if (loading) {
        return <div>Loading students...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    const handleRowClick = (studentId: string) => {
        router.push(`/dashboard/student/${studentId}`);
    };

    const searched = (students: Student[]) => {
        return students.filter((student) =>
            student.name.toLowerCase().includes(search.toLowerCase())
        );
    };

    const filteredStatus = (students: Student[]) => {
        if (status === "all") {
            return students;
        }
        return students.filter((student) => student.application_status === status);
    };

    const filteredCountry = (students: Student[]) => {
        if (country === "all") {
            return students;
        }
        return students.filter((student) => student.country === country);
    };

    const filteredTags = (students: Student[]) => {
        if (selectedTags.length === 0) {
            return students;
        }
        return students.filter((student) => student.tags && selectedTags.every(tag => student.tags!.includes(tag)));
    };

    const handleTagChange = (tag: string) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const clearAllFilters = () => {
        setSearch("");
        setStatus("all");
        setCountry("all");
        setSelectedTags([]);
    };

    return (
        <div>
            <h1 className="text-2xl font-semibold mb-6">Student Directory</h1>

            {/* Search and Filter Row */}
            <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    {/* Search Bar */}
                    <div className="md:col-span-2">
                        <Input
                            placeholder="Search students..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full"
                        />
                    </div>

                    {/* Status Filter */}
                    <div>
                        <Select onValueChange={(value) => setStatus(value)} value={status}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Exploring">Exploring</SelectItem>
                                <SelectItem value="Shortlisting">Shortlisting</SelectItem>
                                <SelectItem value="Applying">Applying</SelectItem>
                                <SelectItem value="Submitted">Submitted</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Country Filter */}
                    <div>
                        <Select onValueChange={(value) => setCountry(value)} value={country}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Country" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Countries</SelectItem>
                                <SelectItem value="USA">USA</SelectItem>
                                <SelectItem value="Canada">Canada</SelectItem>
                                <SelectItem value="UK">UK</SelectItem>
                                <SelectItem value="Australia">Australia</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Tags Filter Dropdown */}
                <div className="flex flex-wrap items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center">
                                Filter by Tags
                                {selectedTags.length > 0 && (
                                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                        {selectedTags.length}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="start">
                            {predefinedTags.map(tag => (
                                <DropdownMenuCheckboxItem
                                    key={tag}
                                    checked={selectedTags.includes(tag)}
                                    onCheckedChange={() => handleTagChange(tag)}
                                >
                                    {tag}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Clear Filters Button */}
                    <Button
                        variant="ghost"
                        onClick={clearAllFilters}
                        className="text-muted-foreground"
                    >
                        Clear Filters
                    </Button>
                </div>
            </div>

            {/* Results Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Application Status</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Tags</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredTags(filteredCountry(filteredStatus(searched(students)))).length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No students found matching your filters
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredTags(filteredCountry(filteredStatus(searched(students)))).map((student) => (
                            <TableRow
                                key={student.id}
                                onClick={() => handleRowClick(student.id)}
                                className="cursor-pointer hover:bg-muted/50"
                            >
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell>{student.email}</TableCell>
                                <TableCell>{student.country || 'N/A'}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                        {student.application_status}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {student.last_active
                                        ? new Date(student.last_active).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })
                                        : ''}
                                </TableCell>
                         <TableCell>
  {student.tags && student.tags.length > 0 ? (
    <div className="flex flex-wrap gap-1">
      {student.tags.map((tag, index) => {
        const colors = getTagColors(tag);
        return (
          <span
            key={index}
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border transition-all duration-200 ${colors.bg} ${colors.text} ${colors.border} ${colors.glow}`}
          >
            {tag}
          </span>
        );
      })}
    </div>
  ) : (
    ''
  )}
</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default StudentDirectory;
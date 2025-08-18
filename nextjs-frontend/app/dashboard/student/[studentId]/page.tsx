// app/dashboard/student/[studentId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  Tag,
  X,
  Send
} from 'lucide-react';
import { getTagColors } from '@/lib/constants/tagColors';

interface Student {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    country: string | null;
    application_status: string;
    last_active: string | null;
    tags: string[] | null;
}

const StudentProfile = () => {
    const { studentId } = useParams();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [notes, setNotes] = useState<string>("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
    const [emailContent, setEmailContent] = useState<string>("");
    const [showToast, setShowToast] = useState<boolean>(false);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const response = await fetch(`http://localhost:8000/students/${studentId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data: Student = await response.json();
                setStudent(data);
                setSelectedTags(data.tags || []);
                setLoading(false);
            } catch (e: any) {
                setError(e.message);
                setLoading(false);
            }
        };

        fetchStudent();
    }, [studentId]);

    useEffect(() => {
        // Load mock notes
        const initialNotes = [
            { author: 'Team Member 1', content: 'Needs help with essay', timestamp: '2025-08-10T12:00:00' },
            { author: 'Team Member 2', content: 'High intent student', timestamp: '2025-08-09T18:00:00' },
        ].map((note) => `${note.author}: ${note.content} - ${note.timestamp}`).join("\n");
        setNotes(initialNotes);
    }, []);

    const handleSendEmail = () => {
        // Initialize email content when modal opens
        const defaultEmailContent = `Subject: Follow-up on Your Application

Dear ${student?.name || 'Student'},

I hope this message finds you well. I wanted to follow up on your application progress and see if you have any questions or need assistance with any part of the process.

Your current application status is: ${student?.application_status}

If you need any help or have questions about the next steps, please don't hesitate to reach out. We're here to support you throughout your application journey.

Best regards,
Admissions Team

---
This email was sent from the student management system.`;

        setEmailContent(defaultEmailContent);
        setIsEmailModalOpen(true);
    };

    const handleSendEmailConfirm = () => {
        // Close modal and show toast
        setIsEmailModalOpen(false);
        setShowToast(true);

        // Hide toast after 3 seconds
        setTimeout(() => {
            setShowToast(false);
        }, 3000);
    };

    const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(event.target.value);
    };

    const handleSaveNotes = () => {
        alert("Notes saved!");
    };

    const availableTags = [
        "Students not contacted in 7 days",
        "High intent",
        "Needs essay help",
    ];

    const handleTagChange = async (tag: string, isChecked: boolean) => {
        const newTags = isChecked
            ? [...(selectedTags || []), tag]
            : (selectedTags || []).filter(t => t !== tag);

        // Optimistic UI update
        setSelectedTags(newTags);

        try {
            const response = await fetch(
                `http://localhost:8000/students/${studentId}/tags`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        tags: newTags
                    }),
                }
            );

            console.log("Response status:", response.status);
            console.log("Response headers:", response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error response:", errorText);
                throw new Error(`Failed to update tags: ${response.status} ${errorText}`);
            }

            const updatedStudent = await response.json();
            setStudent(updatedStudent);
            console.log("Successfully updated student tags:", updatedStudent);
        } catch (e: any) {
            console.error("Tag update error:", e);
            // Revert UI on error
            setSelectedTags(student?.tags || []);
            alert(`Error: ${e.message}`);
        }
    };

    if (loading) {
        return <div>Loading student profile...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!student) {
        return <div>Student not found.</div>;
    }

    // Mock Data
    const interactionTimeline = [
        { type: 'Login', timestamp: '2025-08-14T10:00:00' },
        { type: 'AI Question', timestamp: '2025-08-14T11:30:00' },
        { type: 'Document Submitted', timestamp: '2025-08-14T14:00:00' },
    ];

    const communicationLog = [
        { type: 'Email', content: 'Follow-up email sent', timestamp: '2025-08-13T16:00:00' },
        { type: 'SMS', content: 'Reminder SMS sent', timestamp: '2025-08-12T09:00:00' },
    ];

    const progress = Math.floor(Math.random() * 100);

    return (
        <>
            <div className="container mx-auto py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Student Profile</h1>
                    <Button onClick={handleSendEmail}>Send Follow-up Email</Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Basic Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Profile Picture */}
                                    <div className="md:col-span-1 flex flex-col items-center">
                                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 flex items-center justify-center">
                                            <span className="text-gray-500">Profile Image</span>
                                        </div>
                                        <Button variant="outline" size="sm" className="mt-3">
                                            Change Photo
                                        </Button>
                                    </div>

                                    {/* Student Details */}
                                    <div className="md:col-span-2 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <User className="h-4 w-4 text-gray-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Name</p>
                                                <p className="font-medium">{student.name}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-gray-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Email</p>
                                                <p className="font-medium">{student.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Phone className="h-4 w-4 text-gray-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Phone</p>
                                                <p className="font-medium">{student.phone || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <MapPin className="h-4 w-4 text-gray-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Country</p>
                                                <p className="font-medium">{student.country || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Application Progress */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Application Progress</CardTitle>
                                <CardDescription>Current application status: {student.application_status}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span>Overall Progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-3" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Interaction Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Interaction Timeline</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {interactionTimeline.map((item, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className="mt-1 bg-blue-100 p-2 rounded-full">
                                                <Calendar className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{item.type}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(item.timestamp).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Tags, Notes, Communication */}
                    <div className="space-y-6">
                        {/* Tags */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5" />
                                    Tags
                                </CardTitle>
                                {selectedTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {selectedTags.map((tag, index) => {
                                            const colors = getTagColors(tag);
                                            return (
                                                <span
                                                    key={index}
                                                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}
                                                >
                                                    {tag}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {availableTags.map((tag) => {
                                        const colors = getTagColors(tag);
                                        return (
                                            <div key={tag} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={tag}
                                                    checked={selectedTags.includes(tag)}
                                                    onCheckedChange={(checked) => handleTagChange(tag, checked as boolean)}
                                                />
                                                <label
                                                    htmlFor={tag}
                                                    className={`flex items-center rounded-full px-2.5 py-1 text-xs font-medium border transition-all duration-200 }`}
                                                >
                                                    {tag}
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Internal Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Internal Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Textarea
                                        value={notes}
                                        onChange={handleNotesChange}
                                        placeholder="Add internal notes about this student..."
                                        className="min-h-[120px]"
                                    />
                                    <Button onClick={handleSaveNotes} className="w-full">
                                        Save Notes
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Communication Log */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Communication Log</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {communicationLog.map((item, index) => (
                                        <div key={index} className="border-l-2 border-gray-200 pl-4 py-1">
                                            <div className="flex justify-between">
                                                <span className="font-medium">{item.type}</span>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(item.timestamp).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{item.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Email Modal */}
            <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Send Follow-up Email
                        </DialogTitle>
                        <DialogDescription>
                            Review and edit the email content before sending to {student?.email}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Email Header */}
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-600">To:</span>
                                <span className="text-sm">{student?.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-600">From:</span>
                                <span className="text-sm">admissions@university.edu</span>
                            </div>
                        </div>

                        {/* Editable Email Content */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email Content:</label>
                            <Textarea
                                value={emailContent}
                                onChange={(e) => setEmailContent(e.target.value)}
                                className="min-h-[400px] font-mono text-sm"
                                placeholder="Enter email content..."
                            />
                        </div>

                        {/* Modal Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => setIsEmailModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSendEmailConfirm}
                                className="flex items-center gap-2"
                            >
                                <Send className="h-4 w-4" />
                                Send Email
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-300 rounded-full"></div>
                        Email sent successfully to {student?.email}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowToast(false)}
                        className="text-white hover:bg-green-700 p-1 h-auto"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </>
    );
};

export default StudentProfile;
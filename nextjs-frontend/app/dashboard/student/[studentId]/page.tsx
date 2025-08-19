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
  Send,
  Check,
  Bot
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
    internal_notes: string | null;
}

interface CommunicationLog {
    id: string;
    student_id: string;
    type: string;
    content: string | null;
    timestamp: string;
}

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error';
}

// Simple markdown renderer component
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const renderMarkdown = (text: string) => {
        return text
            // Headers
            .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
            .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')

            // Bold and italic
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')

            // Lists
            .replace(/^\* (.*$)/gm, '<li class="ml-4">• $1</li>')
            .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')

            // Line breaks
            .replace(/\n\n/g, '</p><p class="mb-3">')
            .replace(/\n/g, '<br/>');
    };

    const htmlContent = `<p class="mb-3">${renderMarkdown(content)}</p>`;

    return (
        <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};

const StudentProfile = () => {
    const { studentId } = useParams();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [notes, setNotes] = useState<string>("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
    const [emailContent, setEmailContent] = useState<string>("");
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [isAddLogModalOpen, setIsAddLogModalOpen] = useState<boolean>(false);
    const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);
    const [newLogType, setNewLogType] = useState<string>('Email');
    const [newLogContent, setNewLogContent] = useState<string>('');
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        const newToast = { id, message, type };
        setToasts(prev => [...prev, newToast]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 3000);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

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
                setNotes(data.internal_notes || "");
                setLoading(false);
            } catch (e: any) {
                setError(e.message);
                setLoading(false);
            }
        };

        fetchStudent();
    }, [studentId]);

    useEffect(() => {
        const fetchCommunicationLogs = async () => {
            try {
                const response = await fetch(`http://localhost:8000/students/${studentId}/communications`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data: CommunicationLog[] = await response.json();
                setCommunicationLogs(data);
            } catch (e: any) {
                console.error("Failed to fetch communication logs:", e);
            }
        };

        if (studentId) {
            fetchCommunicationLogs();
        }
    }, [studentId]);

    const fetchAiSummary = async () => {
        setIsGeneratingSummary(true);
        try {
            const response = await fetch(`http://localhost:8000/students/${studentId}/ai-summary`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            setAiSummary(data.summary);
            showToast("AI Summary generated successfully!", 'success');
        } catch (e: any) {
            console.error("Failed to fetch AI summary:", e);
            setAiSummary("Failed to generate AI summary. Please try again later.");
            showToast("Failed to generate AI summary. Please try again.", 'error');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

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

    const handleSendEmailConfirm = async () => {
        try {
            // Send the email
            const response = await fetch(`http://localhost:8000/students/${studentId}/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to send email: ${response.status}`);
            }

            // Refresh communication logs
            const logResponse = await fetch(`http://localhost:8000/students/${studentId}/communications`);
            if (logResponse.ok) {
                const logs: CommunicationLog[] = await logResponse.json();
                setCommunicationLogs(logs);
            }

            // Close modal and show toast
            setIsEmailModalOpen(false);
            showToast(`Email sent successfully to ${student?.email}`, 'success');
        } catch (error) {
            console.error("Error sending email:", error);
            showToast("Failed to send email. Please try again.", 'error');
        }
    };

    const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(event.target.value);
    };

    const handleSaveNotes = async () => {
        try {
            const response = await fetch(`http://localhost:8000/students/${studentId}/internal_notes`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ internal_notes: notes }),
            });

            if (!response.ok) {
                throw new Error(`Failed to save notes: ${response.status}`);
            }

            const updatedStudent: Student = await response.json();
            setStudent(updatedStudent);
            showToast("Notes saved successfully!", 'success');
        } catch (error) {
            console.error("Error saving notes:", error);
            showToast("Failed to save notes. Please try again.", 'error');
        }
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

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update tags: ${response.status} ${errorText}`);
            }

            const updatedStudent = await response.json();
            setStudent(updatedStudent);
        } catch (e: any) {
            console.error("Tag update error:", e);
            // Revert UI on error
            setSelectedTags(student?.tags || []);
            showToast(`Error: ${e.message}`, 'error');
        }
    };

    const handleAddLog = async () => {
        try {
            const response = await fetch(`http://localhost:8000/students/${studentId}/communication`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: studentId,
                    type: newLogType,
                    content: newLogContent
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to add communication log: ${response.status}`);
            }

            const newLog: CommunicationLog = await response.json();

            // Add the new log to the beginning of the logs array
            setCommunicationLogs(prevLogs => [newLog, ...prevLogs]);

            // Reset form and close modal
            setNewLogType('Email');
            setNewLogContent('');
            setIsAddLogModalOpen(false);

            showToast("Communication log added successfully!", 'success');
        } catch (error) {
            console.error("Error adding communication log:", error);
            showToast("Failed to add communication log. Please try again.", 'error');
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

    const progress = Math.floor(Math.random() * 100);

    return (
        <>
            {/* Toast Container - Fixed at top */}
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`${
                            toast.type === 'success' 
                                ? 'bg-green-600' 
                                : 'bg-red-600'
                        } text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 min-w-[300px]`}
                    >
                        <div className="flex items-center gap-2">
                            {toast.type === 'success' ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <X className="h-4 w-4" />
                            )}
                            <span className="text-sm">{toast.message}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeToast(toast.id)}
                            className={`text-white ${
                                toast.type === 'success' 
                                    ? 'hover:bg-green-700' 
                                    : 'hover:bg-red-700'
                            } p-1 h-auto ml-auto`}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="container mx-auto py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Student Profile</h1>
                    <div className="flex gap-2">
                        <Button onClick={handleSendEmail}>Send Follow-up Email</Button>
                        <Button
                            onClick={fetchAiSummary}
                            disabled={isGeneratingSummary}
                            variant="secondary"
                        >
                            {isGeneratingSummary ? (
                                <>
                                    <span className="mr-2">Generating...</span>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                </>
                            ) : (
                                <>
                                    <Bot className="h-4 w-4 mr-2" />
                                    Generate AI Summary
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* AI Summary Section with Markdown Rendering */}
                {aiSummary && (
                    <div className="mb-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bot className="h-5 w-5" />
                                    AI Summary
                                </CardTitle>
                                <CardDescription>
                                    AI-generated insights about this student based on their profile and communications
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <MarkdownRenderer content={aiSummary} />
                            </CardContent>
                        </Card>
                    </div>
                )}

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
                                                    className="flex items-center rounded-full px-2.5 py-1 text-xs font-medium border transition-all duration-200"
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
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Communication Log</CardTitle>
                                <Button
                                    size="sm"
                                    onClick={() => setIsAddLogModalOpen(true)}
                                >
                                    + Add Log
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {communicationLogs.map((log) => (
                                        <div key={log.id} className="border-l-2 border-gray-200 pl-4 py-1">
                                            <div className="flex justify-between">
                                                <span className="font-medium">{log.type}</span>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(log.timestamp).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{log.content || 'No description'}</p>
                                        </div>
                                    ))}
                                    {communicationLogs.length === 0 && (
                                        <p className="text-sm text-gray-500">No communication logs yet.</p>
                                    )}
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

            {/* Add Log Modal */}
            <Dialog open={isAddLogModalOpen} onOpenChange={setIsAddLogModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Communication Log</DialogTitle>
                        <DialogDescription>
                            Log a communication interaction with this student.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type</label>
                            <select
                                value={newLogType}
                                onChange={(e) => setNewLogType(e.target.value)}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="Email">Email</option>
                                <option value="SMS">SMS</option>
                                <option value="Call">Call</option>
                                <option value="Meeting">Meeting</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description (Optional)</label>
                            <Textarea
                                value={newLogContent}
                                onChange={(e) => setNewLogContent(e.target.value)}
                                placeholder="Brief description of the communication..."
                                className="min-h-[100px]"
                                maxLength={200}
                            />
                            <p className="text-xs text-gray-500 text-right">
                                {newLogContent.length}/200 characters
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setIsAddLogModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddLog}
                            disabled={!newLogType}
                        >
                            Add Log
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default StudentProfile;
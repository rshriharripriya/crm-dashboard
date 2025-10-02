import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FaGithub, FaLinkedin, FaGlobe, FaEnvelope, FaFileAlt } from "react-icons/fa";

export default function Home() {
  return (
    <main className="flex flex-col w-full min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black text-white">

      <section className="flex flex-col items-center justify-center flex-1 relative overflow-hidden p-12">

        {/* Glow Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse -top-10 -left-10"></div>
          <div className="absolute w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-ping top-1/3 -right-10"></div>
          <div className="absolute w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse bottom-10 left-1/3"></div>
        </div>

        <div className="text-center max-w-3xl relative z-10 py-28">
          <h1 className="text-6xl font-extrabold mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg animate-[pulse_3s_ease-in-out_infinite]">
            Student Stats Dashboard
          </h1>
          <h2 className="text-2xl font-semibold text-gray-300 mb-10">
            by Shri Harri Priya Ramesh
          </h2>

          {/* Tech Skills Section */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-pink-300 drop-shadow">
              ⚡ Tech Skills
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                "React.js", "Next.js", "FastAPI", "Node.js", "Django",
                "Python", "TypeScript", "SQL", "MongoDB", "AWS",
                "Docker", "Kubernetes"
              ].map((skill, idx) => (
                <Badge
                  key={idx}
                  className="px-4 py-2 text-md rounded-full bg-white/10 border border-white/20
                             hover:bg-white/20 hover:scale-110 transform transition duration-300"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Dashboard Button */}
          <Link href="/dashboard">
            <Button className="px-10 py-5 text-xl font-bold rounded-full shadow-2xl
              bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500
              hover:from-pink-600 hover:via-purple-600 hover:to-blue-600
              focus:ring-4 focus:ring-pink-400 animate-bounce transition">
              🚀 Go to Dashboard
            </Button>
          </Link>

          {/* Socials Section */}
          <div className="mt-12 flex justify-center gap-6 flex-wrap">
            <a href="mailto:rshriharripriya19@gmail.com" target="_blank" className="flex items-center gap-2 hover:underline hover:scale-110 transition">
              <FaEnvelope className="w-6 h-6 text-red-400" /> Email
            </a>
            <a href="https://linkedin.com/in/rshriharripriya" target="_blank" className="flex items-center gap-2 hover:underline hover:scale-110 transition">
              <FaLinkedin className="w-6 h-6 text-blue-400" /> LinkedIn
            </a>
            <a href="https://github.com/rshriharripriya" target="_blank" className="flex items-center gap-2 hover:underline hover:scale-110 transition">
              <FaGithub className="w-6 h-6 text-gray-300" /> GitHub
            </a>
            <a href="https://rshriharripriya.vercel.app" target="_blank" className="flex items-center gap-2 hover:underline hover:scale-110 transition">
              <FaGlobe className="w-6 h-6 text-green-400" /> Portfolio
            </a>
            <a href="/Shri_Harri_Priya_Resume.pdf" target="_blank" className="flex items-center gap-2 hover:underline hover:scale-110 transition">
              <FaFileAlt className="w-6 h-6 text-yellow-400" /> Resume
            </a>
          </div>
        </div>
      </section>

      <section className="w-full px-8 py-20 relative z-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-6 text-blue-300">📊 CRM Dashboard</h1>
          <p className="text-center text-lg text-gray-300 mb-12">
A lightweight internal CRM dashboard for organizing student communications and application workflows.          </p>

          {/* README-style nav links */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {["Introduction", "Objective", "Features", "Domain Info", "Tech Stack", "Resources Used", "Deliverables"].map((item, idx) => (
              <a key={idx} href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="px-4 py-2 rounded-lg bg-white/5 backdrop-blur-md shadow border border-white/10 text-sm font-semibold text-gray-200 hover:text-pink-300 transition">
                {item}
              </a>
            ))}
          </div>

          {/* Sections in glass cards */}
          <div className="grid gap-8">
            <div id="introduction" className="bg-white/5 backdrop-blur-md shadow-lg rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-3 text-pink-300">Introduction</h2>
              <p className="text-gray-200">
                This project aims to build a basic internal-facing CRM-style web dashboard to help the Application Support Team manage student interactions, track progress, and log communication history.                    
              </p>
            </div>

            <div id="objective" className="bg-white/5 backdrop-blur-md shadow-lg rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-3 text-pink-300">Objective</h2>
              <ul className="list-disc pl-6 text-gray-200">
                <li>Track every student’s engagement</li>
                <li>Monitor application progress</li>
                <li>Log and view communication history</li>
                <li>Take actions (send follow-ups, notes, etc.)</li>
              </ul>
            </div>

            <div id="features" className="bg-white/5 backdrop-blur-md shadow-lg rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-3 text-pink-300">Features</h2>
              <h3 className="font-semibold text-blue-300">Student Directory View:</h3>
              <ul className="list-disc pl-6 text-gray-200 mb-4">
                <li>Table view of all students with filters/search</li>
                <li>Key columns: Name, Email, Country, Application Status, Last Active</li>
                <li>Ability to click and open an individual student profile</li>
              </ul>
              <h3 className="font-semibold text-blue-300">Student Individual Profile View:</h3>
              <ul className="list-disc pl-6 text-gray-200 mb-4">
                <li>Basic Info (name, email, phone, grade, country)</li>
                <li>Interaction Timeline</li>
                <li>Communication Log</li>
                <li>Internal Notes</li>
                <li>Current progress bar</li>
              </ul>
              <h3 className="font-semibold text-blue-300">Communication Tools:</h3>
              <ul className="list-disc pl-6 text-gray-200 mb-4">
                <li>Log communications manually</li>
                <li>Trigger follow-up email (mock only)</li>
                <li>Schedule reminders/tasks</li>
              </ul>
              <h3 className="font-semibold text-blue-300">Insights & Filters:</h3>
              <ul className="list-disc pl-6 text-gray-200">
                <li>Quick filters (e.g. “Not contacted in 7 days”)</li>
                <li>Summary stats</li>
                <li>Bonus: AI Summary</li>
              </ul>
            </div>

            <div id="domain-info" className="bg-white/5 backdrop-blur-md shadow-lg rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-3 text-pink-300">Domain Info</h2>
              <p className="text-gray-200">Students can write essays with AI, select colleges by preferences (budget, major, state, class size), and log exam scores (SAT, etc.).</p>
            </div>

            <div id="tech-stack" className="bg-white/5 backdrop-blur-md shadow-lg rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-3 text-pink-300">Tech Stack</h2>
              <ul className="list-disc pl-6 text-gray-200">
                <li>Frontend: Next.js with TypeScript</li>
                <li>Backend: FastAPI</li>
                <li>Database: Supabase</li>
                <li>Auth: JWT</li>
              </ul>
            </div>

            <div id="resources-used" className="bg-white/5 backdrop-blur-md shadow-lg rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-3 text-pink-300">Resources Used</h2>
              <p className="text-gray-200">This project builds on top of the <a href="https://vintasoftware.github.io/nextjs-fastapi-template/" target="_blank" className="text-blue-300 underline">nextjs-fastapi-template</a>, an open-source starter kit.</p>
            </div>

            <div id="deliverables" className="bg-white/5 backdrop-blur-md shadow-lg rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-3 text-pink-300">Deliverables</h2>
              <ul className="list-disc pl-6 text-gray-200">
                <li>Working web app locally hosted</li>
                <li>GitHub repository with code</li>
                <li>README file explaining setup</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

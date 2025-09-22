
<h1 align="center">Undergraduation CRM Dashboard</h1>

<p align="center">
  A lightweight internal CRM dashboard for managing student interactions on undergraduation.com.
</p>

<p align="center">
  <a href="#introduction"><strong>Introduction</strong></a> |
  <a href="#objective"><strong>Objective</strong></a> |
  <a href="#features"><strong>Features</strong></a> |
  <a href="#domain-info"><strong>Domain Info</strong></a> |
  <a href="#tech-stack"><strong>Tech Stack</strong></a> |
  <a href="#resources-used"><strong>Resources used</strong></a> |
  <a href="#deliverables"><strong>Deliverables</strong></a> |
 
</p>
<br/>

## Introduction

This project aims to build a basic internal-facing CRM-style web dashboard to help the Undergraduation team manage student interactions, track their progress, and log communication history. This will provide a centralized view of each student’s journey on the platform.

[Live demo](https://crm-dashboard-gray-one.vercel.app/dashboard)

## Objective

Build an internal CRM dashboard to:

*   Track every student’s engagement
*   Monitor application progress
*   Log and view communication history
*   Take actions (send follow-ups, notes, etc.)

## Features

### Student Directory View:

*   Table view of all students with filters/search
*   Key columns: Name, Email, Country, Application Status (“Exploring”, “Shortlisting”, “Applying”, “Submitted”), Last Active
*   Ability to click and open an individual student's profile

### Student Individual Profile View:

*   Basic Info (name, email, phone, grade, country)
*   Interaction Timeline (login activity, AI questions asked, documents submitted)
*   Communication Log (emails, SMS)
*   Internal Notes (team can add/edit/delete)
*   Current progress bar based on the application stage

### Communication Tools:

*   Log communications manually (e.g., “Called student to discuss essays”)
*   Trigger follow-up email (mock only — no need to send real email)
*   Schedule a reminder or task for the internal team

### Insights & Filters:

*   Quick filters: “Students not contacted in 7 days”, “High intent”, “Needs essay help”
*   Display summary stats (e.g., 120 active students, 45 in essay stage)
*   Bonus (Optional): Add an “AI Summary” of each student based on their profile (mock it)

---

## Domain info:

*   students can write essays with ai 
*   students can select colleges which are under my colleges
*   they can select budget, major, us region (state too ig), class size 
*   students give their exam scores (SATs and stuff - see website)



## Tech Stack:

*   Frontend: Next.js with typescript
*   Backend: FastAPI
*   Database: Supabase ( since setup is easy and i think relational dbs are better for this usecase and also because its freeeee)
*   Email: TBD
*   Auth: JWT

## Resources used

This project was made on top of the nextjs-fastapi-template (open-source), which is designed to be cloned and modified for each project. For more information on getting started, [view the documentation](https://vintasoftware.github.io/nextjs-fastapi-template/).

## Deliverables

*   Working web app locally hosted
*   Link to GitHub repo with code
*   README file explaining setup

## Note

Normally I like to create modular frontend applications, with reusable components, but I know that someone is going to review this code so for their ease, some frontend pages are not component based, soley for the purpose of easy reviewing 

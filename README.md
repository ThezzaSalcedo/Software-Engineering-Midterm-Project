# NEU Library Visitor App
A streamlined visitor logging system developed for New Era University. This application digitizes the traditional library logbook, allowing students and faculty to check in using their university Google accounts while providing administrators with real-time traffic analytics.

## ✨ Core Features
1. Unified Check-in System
Google OAuth 2.0: Secure login restricted strictly to @neu.edu.ph domains.

Dynamic Greetings: * First-Time Visitors: Welcomed with an onboarding flow to select their specific College and Department.

Returning Visitors: Recognized automatically with a "Welcome Back, [Name]" message to speed up the logging process.

2. Admin Dashboard & Simulation
Visitor Analytics: Real-time tracking of library usage categorized by role (Student/Faculty) and visit reason.

Role Preview Mode: A specialized tool for Admins to view the app through the eyes of a Student or Faculty member.

Scenario Simulation: Admins can trigger "First-Time" or "Old Visitor" popups to test the logic of the onboarding vs. return-user screens without modifying database records.


## 🛠 Technical Architecture
* Framework: Next.js 15 (App Router)

* Styling: Tailwind CSS (Responsive Design)

* Backend: Firebase Firestore (NoSQL)

* Auth: Firebase Authentication

* Icons: Lucide React

# Live Link
[NEU Library Visitor App Link](https://software-engineering-midterm-projec-ten.vercel.app/)


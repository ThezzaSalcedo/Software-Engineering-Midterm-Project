# **App Name**: NEU CampusConnect

## Core Features:

- Secure Institutional Login: Implement Google-based institutional email login (SSO) to authenticate users securely.
- User Role Assignment: Assign either 'Admin' or 'User' roles to authenticated users, supporting two distinct access levels.
- First-Time User Onboarding: On a user's initial login, present a conditional UI flow to prompt for 'College' or 'Office' selection.
- User Profile Persistence: Store user's institutional email, assigned role, and chosen 'College/Office' in a database for subsequent sessions.
- Seamless Return Login: For returning users, skip the 'College'/'Office' selection and direct them immediately to the main dashboard/reason for visit screen.
- Reason for Visit Screen: A dedicated screen for authenticated users to specify their purpose for visiting the library.

## Style Guidelines:

- Primary color: #2660D5 (a deep, academic blue representing trust and knowledge) to be used for interactive elements and primary branding. (HSL: 220, 70%, 50%)
- Background color: #F0F4FA (a very light blue-grey) providing a clean, clear, and professional backdrop for content. (HSL: 220, 20%, 95%)
- Accent color: #1493B1 (a vibrant teal-blue) to highlight important calls to action and notifications, ensuring good contrast and visual hierarchy. (HSL: 190, 80%, 40%)
- Headline and body font: 'Inter' (sans-serif) for its modern, clear, and highly legible appearance, suitable for diverse screen sizes and content.
- Utilize simple, clean, and professional line icons to complement the academic context, enhancing navigation and user comprehension without distraction.
- Employ a responsive, card-based layout structure for user profiles and interactive forms, ensuring adaptability across web and mobile viewports with ample white space for clarity.
- Incorporate subtle, quick-duration animations for transitions between authentication steps and form submissions to provide fluid user feedback.
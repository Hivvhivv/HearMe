Build a complete responsive web application called "HearMe" based on the UI/UX references provided.

HearMe is a mental health platform where users can track their emotions, journal their feelings, find psychologists, make consultations, interact with an AI Listener, join a forum, access Mind Hub resources, and access Emergency Call.

IMPORTANT:
- Recreate the visual identity from the provided mobile and desktop references.
- Do NOT simply create static mockups.
- Build a fully functional frontend with working navigation, buttons, forms, modal interactions, tabs, and page transitions.
- The website should feel like one consistent product.
- Keep the design clean, calming, modern, friendly, and professional.
- Use the existing HearMe purple/lavender visual identity.
- Do not introduce unrelated colors or a completely different visual style.

TECH STACK:
- React
- Vite
- JavaScript or TypeScript
- Tailwind CSS
- React Router
- Lucide React for icons
- Use reusable components
- Use local mock data for psychologists, moods, articles, etc.
- No backend is required for now.
- Store temporary user data and mood data using localStorage where appropriate.

==================================================
1. DESIGN SYSTEM
==================================================

Primary visual style:
- Soft lavender / purple
- White backgrounds
- Dark purple text
- Rounded cards
- Soft shadows
- Large whitespace
- Friendly mental-health illustrations
- Smooth hover and transition animations

Suggested colors:
- Primary purple: #6F3FB5
- Light purple: #C9A9E9
- Very light purple: #F5EEFC
- Background: #FAF8FD
- Dark text: #202020
- Secondary text: #666666
- White: #FFFFFF

Use:
- border-radius: 16px–24px
- subtle shadows
- clean modern typography
- responsive spacing
- accessible contrast

The overall design should feel similar to the provided HearMe references.

==================================================
2. PUBLIC WEBSITE / LANDING PAGE
==================================================

Create these public pages:

/ 
/about
/how-it-works
/features
/contact
/sign-in
/choose-role
/sign-up

The landing page should contain a desktop navbar.

NAVBAR:

Left:
- HearMe logo

Center:
- Home
- About
- How It Works
- Features
- Contact

Right:
- Sign In
- Get Started

Important:
"Sign In" and "Get Started" have different purposes.

Sign In:
- For users who already have an account.
- Navigate to /sign-in.

Get Started:
- For new users.
- Navigate to /choose-role.

Navbar should be sticky on desktop and responsive on mobile.

==================================================
3. SPLASH SCREEN
==================================================

Create a HearMe splash screen based on the reference.

Design:
- White background
- Soft lavender organic shapes in the corners
- HearMe logo centered
- HearMe heart/chat logo
- "HearMe" text
- Small tagline:

"Teman bicara di genggamanmu,
kapan pun dan di mana pun."

Add a subtle fade-in animation.

After approximately 2 seconds, automatically navigate to the landing page.

Do not make the splash screen look like a normal website page.

==================================================
4. LANDING PAGE
==================================================

Hero section:

Headline:
"Teman Bicara di
GENGGAMANMU"

Supporting text:
"Curhat tanpa takut dihakimi,
kapan pun dan di mana pun."

Buttons:
- Get Started
- See How It Works

Use the friendly illustration from the provided reference showing two people talking.

Use soft lavender background shapes.

Below the hero, create sections explaining:

- What is HearMe?
- How HearMe works
- Main features
- Why use HearMe?
- Call to action

Main features:
1. AI Listener
2. Mood Tracking
3. Journaling
4. Psychologist Consultation
5. Forum
6. Mind Hub
7. Emergency Call

==================================================
5. SIGN IN PAGE
==================================================

Create a sign-in page matching the reference.

Navbar should remain visible.

Content:

"Welcome Back!"

"Nice to see you again."

Fields:
- Email or Username
- Password

Password must have show/hide functionality.

Additional:
- Forgot Password?
- Continue with Google
- Sign In
- Don't have an account? Create Account

Create Account should navigate to /choose-role.

Sign In should validate that fields are filled.

For now, use mock authentication.

If successful:
- save logged-in state to localStorage
- navigate to /dashboard

==================================================
6. CHOOSE ROLE PAGE
==================================================

When a new user clicks Get Started or Create Account, show:

"I'm a..."

"What fits you?"

Two large cards:

USER
"I want to talk and get support"

PSYCHOLOGIST
"I want to help and support others"

Each card should have:
- icon
- illustration/icon
- title
- description
- hover effect

Selecting User:
navigate to /sign-up/user

Selecting Psychologist:
navigate to /sign-up/psychologist

==================================================
7. SIGN UP USER PAGE
==================================================

Create Account form based on the provided design.

Fields:
- Username
- Gender
- Birthday
- Email
- Password
- Confirm Password
- Contact Number

Password should have show/hide functionality.

Buttons:
- Back
- Next / Create Account

Validation:
- required fields
- valid email
- password confirmation
- valid birthday
- valid contact number

After registration:
- save mock user information to localStorage
- navigate to dashboard

==================================================
8. USER DASHBOARD
==================================================

After login, show the main HearMe dashboard.

IMPORTANT CHANGE FROM THE MOBILE DESIGN:

For the website version, the menu must NOT be placed in a left sidebar.

Use a TOP NAVBAR.

Navbar:

HearMe | Home | Psikolog | Konsultasi | Forum | Mind Hub | Emergency Call | Notification | Profile

Active page should be highlighted with purple underline/text.

Profile:
- avatar
- user name "Inof"
- dropdown menu

Dropdown:
- Profile
- Settings
- Logout

==================================================
9. DASHBOARD HERO
==================================================

Create a large lavender hero card.

Text:

"Hi Inof,
Nice to meet you again!"

"Tell us about your emotions today,
we're ready to listen!"

Add a reflection input:

"How are you feeling today?"

Include a submit/send button.

Use a calming illustration of a person expressing emotions.

==================================================
10. DAILY MOOD LOG
==================================================

Place Daily Mood Log immediately BELOW the hero.

This section is very important.

Show mood icons horizontally:

Amazing
Good
Okay
Stressed
Overwhelmed
Sad

Each mood should display:
- emoji/icon
- mood count

Example:
Amazing - 6
Good - 4
Okay - 2
Stressed - 4
Overwhelmed - 1
Sad - 5

At the end:
"+" Add Mood

Clicking "+" MUST open the Add Mood flow.

==================================================
11. ADD MOOD FLOW
==================================================

Create a modal or multi-step overlay based on the provided mobile reference.

The flow contains 3 steps.

STEP 1:
"Your Mood Journal"

Tabs:
- Weekly
- Monthly
- Yearly

Show:
- Average Mood
- Mood Chart
- Mood history/calendar

Example:
Average Mood: HAPPY

Show mood chart using the mood categories.

Show history calendar.

STEP 2:
"Your Daily Mood"

Text:
"How was your day?"

Display the selected mood prominently.

Example:
"Today I feel HAPPY"

Show mood statistics.

Show:
"This Week's Mood"

Display the week mood timeline.

Button:
"+ Log Mood"

STEP 3:
"Add Mood"

Text:
"How are you feeling today?"

Date:
"September 13th, 2025"

Mood selection buttons:

Happy
Sad
Surprised
Disgust
Angry
Fear

When the user selects a mood:
- visually highlight the selected mood
- update selectedMood state

Button:
"Set Mood"

When "Set Mood" is clicked:
- save the mood to localStorage
- update Daily Mood Log
- close the modal
- show the newly selected mood

The modal must have:
- Back navigation
- Step indicator 1 / 2 / 3
- Close button

==================================================
12. TOP PSYCHOLOGIST
==================================================

After Daily Mood Log, create:

"Top Psychologist"

Show psychologist cards.

Each card:
- profile image
- name
- specialization
- rating
- consultation count

Example data:

Inof Sucipto
Psikolog Umum
4.9
128+ konsultasi

Dhiro Sadino
Psikoterapis
4.9
96+ konsultasi

Chelsie Angelie
Psikoterapis
4.9
112+ konsultasi

Michelle Aurelia
Psikiater Anak
4.9
85+ konsultasi

Add:
"Lihat semua"

Clicking a psychologist should navigate to a psychologist detail page.

==================================================
13. JOURNALING FEELINGS
==================================================

IMPORTANT:
Journaling Feelings should NOT appear before Daily Mood Log.

Correct order:

Hero
↓
Daily Mood Log
↓
Top Psychologist
↓
Journaling Feelings
↓
Mind Hub
↓
Recommendations

Journaling card:

"Journaling feelings"

"Write down what's on your heart,
so you can feel relieved before going to sleep."

Show:
Reminders
8:00 PM

Button:
"Write now"

Clicking "Write now" should open a journaling page/modal.

Journal page should contain:
- title
- text area
- mood selection
- save button

Save journal entries to localStorage.

==================================================
14. MIND HUB
==================================================

Create a Mind Hub section.

Title:
"Mind Hub"

Cards:

Mind and Balance
- Learn to manage stress
- Build healthy routines
- Boost daily motivation

Button:
"Start your journey"

Self-Care Corner
- Guided relaxation
- 5-minute breathe
- Relax your mind

Button:
"Start your journey"

Use calming illustrations.

==================================================
15. RECOMMENDATIONS
==================================================

Section:

"Based on your current state"

Create article cards:

How to manage overthinking
7 min read

5 techniques for anxiety
10 min read

Why journaling clears your mind
8 min read

Boost your mood instantly
6 min read

Cards should have:
- illustration
- title
- reading time

Clicking a card opens an article detail page.

==================================================
16. DASHBOARD NAVIGATION
==================================================

Create these pages:

/dashboard
/psychologists
/psychologists/:id
/consultations
/forum
/mind-hub
/ai-listener
/profile
/emergency-call
/journal

Navbar navigation must work.

The active navbar item should update automatically based on the current route.

==================================================
17. AI LISTENER
==================================================

Create an AI Listener page.

Design:
- calming purple interface
- chat messages
- text input
- send button

Example:

AI:
"Hi, I'm here to listen. How are you feeling today?"

User can type a message.

For now, use mock AI responses.

Example:
"Thank you for sharing that with me. Would you like to tell me more about what happened?"

This is only a frontend prototype.

==================================================
18. PSYCHOLOGIST PAGE
==================================================

Create psychologist listing page.

Features:
- Search
- Filter
- Specialization
- Rating
- Availability

Psychologist cards should be reusable.

Clicking a card opens:
- profile
- specialization
- rating
- experience
- available schedule
- consultation button

==================================================
19. CONSULTATION PAGE
==================================================

Show:
- upcoming consultations
- previous consultations
- psychologist
- date
- time
- status

Statuses:
- Upcoming
- Completed
- Cancelled

Provide a "Book Consultation" button.

==================================================
20. FORUM
==================================================

Create community forum.

Features:
- posts
- categories
- likes
- comments
- create post

Example categories:
- Anxiety
- Relationships
- Study
- Work
- Self Improvement

==================================================
21. PROFILE
==================================================

Profile page:

- Profile photo
- Name
- Username
- Email
- Gender
- Birthday
- Contact

Buttons:
- Edit Profile
- Change Password
- Logout

==================================================
22. EMERGENCY CALL
==================================================

Create a dedicated Emergency Call page.

Make the UI visually different enough to communicate that this is an urgent feature, while still maintaining HearMe branding.

Show:
"Need immediate help?"

Provide emergency assistance options.

Do NOT make the page overly decorative.

The button should require confirmation before triggering an action.

==================================================
23. RESPONSIVE DESIGN
==================================================

Desktop:
- top navbar
- wide content
- cards arranged in rows
- dashboard optimized for 1440px+

Tablet:
- responsive grid
- compact navbar

Mobile:
- convert top navigation into a hamburger menu
- cards become vertical
- mood log becomes horizontally scrollable
- maintain large touch targets
- preserve the original mobile HearMe visual style from the reference

Do NOT use the desktop sidebar layout.

==================================================
24. COMPONENT ARCHITECTURE
==================================================

Create reusable components:

Navbar
Logo
Button
Input
MoodCard
MoodLog
MoodModal
MoodChart
PsychologistCard
PsychologistList
JournalCard
JournalModal
MindHubCard
RecommendationCard
HeroSection
Modal
Dropdown
Footer
ProtectedRoute

Use clean component separation.

Suggested structure:

src/
 ├── components/
 ├── pages/
 ├── layouts/
 ├── data/
 ├── hooks/
 ├── utils/
 ├── assets/
 ├── App.jsx
 └── main.jsx

==================================================
25. STATE MANAGEMENT
==================================================

Use React state and localStorage.

Store:
- authentication state
- user profile
- selected mood
- mood history
- journal entries
- consultation data

The application should remain functional after refreshing the page.

==================================================
26. INTERACTIONS & ANIMATIONS
==================================================

Add subtle animations:

- navbar hover
- button hover
- card hover
- modal fade/scale
- page transition
- mood selection animation
- loading state
- success notification

Do NOT overuse animations.

The overall experience should feel calm and professional.

==================================================
27. IMPORTANT UI ORDER
==================================================

The dashboard MUST follow this exact order:

1. Top Navbar
2. Greeting / Hero
3. Daily Mood Log
4. Top Psychologist
5. Journaling Feelings
6. Mind Hub
7. Based on Your Current State
8. Footer

Do NOT place Journaling Feelings above Daily Mood Log.

==================================================
28. IMPORTANT DESIGN CONSISTENCY
==================================================

The landing/authentication pages and dashboard must feel like the same HearMe product.

Use:
- same logo
- same purple palette
- same typography
- same rounded corners
- same button style
- same organic lavender background shapes
- same illustration style

The landing page uses the top navbar:

HearMe
Home
About
How It Works
Features
Contact
Sign In
Get Started

After authentication, the dashboard uses:

HearMe
Home
Psikolog
Konsultasi
Forum
Mind Hub
Emergency Call
Notification
Profile

==================================================
29. FINAL REQUIREMENT
==================================================

Do not stop after creating the homepage.

Implement the complete frontend flow:

Splash Screen
→ Landing Page
→ Sign In / Get Started
→ Choose Role
→ Sign Up
→ Dashboard
→ Mood Tracking
→ Add Mood
→ Psychologist
→ Consultation
→ Journaling
→ Mind Hub
→ AI Listener
→ Forum
→ Profile
→ Emergency Call

Every important button should have a working interaction or route.

Use realistic mock data and make the application feel like a real production-ready prototype.

Prioritize:
1. UI consistency
2. UX flow
3. Responsive design
4. Functional interactions
5. Clean reusable React components
6. Maintainable code
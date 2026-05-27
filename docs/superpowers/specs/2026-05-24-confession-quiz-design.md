# Confession Quiz Page Design

## Overview
Build a mobile-first, single-page static confession quiz webpage for a cute, story-driven confession experience. The final interaction uses a pink cat paw reveal to trigger score display and music playback.

## User Requirements
- The page must be accessible on mobile phones.
- The user can configure the quiz questions.
- The number of questions does not need to be large.
- The final displayed score must be fixed to `52013144`.
- Navigation uses a "next question" interaction only.
- The page must not show quiz progress.
- On the last question, clicking "next" goes to a reveal flow instead of showing the score immediately.
- When the final screen appears, a pink cat paw should appear at the center of the screen.
- Clicking the cat paw reveals the score and starts music playback.
- Below the score, display personalized confession text written by the user.
- Visual style: cute storybook-like style.
- Ending emotion style: gentle confession style.

## Experience Flow
1. **Welcome Screen**
   - Show a short cute opening message to create curiosity.
   - Use a single primary action to start the quiz.

2. **Question Loop**
   - Display one question at a time.
   - Show the question text, options, and a `Next` button.
   - Hide progress, question index, and completion percentage.
   - On selecting an option, show a small `Bigdong` icon/avatar next to the selected option.
   - Only one `Bigdong` indicator should be visible per question and move to the newly selected option when changed.
   - Provide soft validation if the user taps `Next` without choosing an option.

3. **Cat Paw Trigger Screen**
   - After the last question, transition to a full-screen reveal screen.
   - Center a pink cat paw icon.
   - Use light micro-animation to create a gentle waiting moment.
   - Do not display the final score on this screen.

4. **Final Result Screen**
   - On cat paw click, reveal the final score with a gentle appearance animation.
   - Final score must always be `52013144`.
   - Below the score, display the user-provided confession message area.
   - Add a simple music control button for pause/resume.
   - End with a soft closing line to complete the emotional arc.

## Scoring Logic
- Use hidden scoring only; do not show per-question correctness or point changes.
- Regardless of selected options, the final outcome must always resolve to `52013144`.
- Predefine total score distribution to guarantee the fixed final score.
- The UI may show lightweight cute response copy after each selection, but it must not expose the scoring mechanism.

## Interaction Details
- Primary navigation is the `Next` button.
- Transitions between question cards should be smooth and lightweight, not game-heavy.
- The selected option indicator (`Bigdong`) is decorative and not tied to scoring truth logic.
- Music should begin only after the cat paw is clicked.
- Provide a fallback playback control so users can manually start audio if autoplay is blocked by mobile browsers.

## Content Zones
- **Configurable question set**: question text + options.
- **Configurable ending copy**: user-written confession paragraphs.
- **Configurable assets**: cat paw image, background color palette, optional small avatar/icon for `Bigdong`, and background music file.

## Success Criteria
- Mobile browsing experience feels polished and intuitive.
- The page clearly feels like a cute storyline rather than a formal quiz.
- Progress is completely hidden.
- Final score display and music start at the intended reveal moment.
- User can edit questions, confession text, and assets without changing app logic.

## Out of Scope
- Backend service or user authentication.
- Answer analytics or result saving.
- Complex quiz scoring models.

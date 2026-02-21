# Adventures Of - MVP Prototype

## Core Flow
1. Parent enters child's name, age, interests, fears, favorite things
2. Parent uploads 1-2 photos of child
3. AI generates character illustration from photo
4. AI generates personalized story based on interests
5. Parent receives digital PDF or orders printed copy

## Story Templates (MVP: 1 template)
- "The Adventure Begins" - generic adventure that branches based on interests

## Input Form
- Child's name
- Age (3-10)
- Interests (pick 3: dinosaurs, space, animals, sports, magic, robots, princesses, pirates, superheroes, trucks)
- Favorite thing (food, toy, animal, color)
- One fear to avoid in story
- Reading level (simple, medium, advanced)
- Photo upload (1-2 photos)

## Pricing (MVP Test)
- Digital PDF: $12
- Printed (Printful): $24

## Files
- `index.html` - Landing page with form
- `generate.js` - Core generation logic
- `story-template.js` - Story templates
- `api-utils.js` - DALL-E + GPT API calls

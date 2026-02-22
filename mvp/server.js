/**
 * Adventures Of - Book Generation API (MVP)
 * 
 * Uses OpenRouter for story generation (we already have access)
 * Uses placeholder images (swap for DALL-E/HuggingFace in production)
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // npm install node-fetch@2
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// OpenRouter config - we already have access through OpenClaw
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'not-set';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Placeholder illustrations for MVP
const PLACEHOLDER_IMAGES = [
    'https://placehold.co/600x600/fef3c7/92400e?text=Adventure+Begins',
    'https://placehold.co/600x600/fde68a/78350f?text=Magic+Journey',
    'https://placehold.co/600x600/fef3c7/92400e?text=Dino+World',
    'https://placehold.co/600x600/fde68a/78350f?text=Space+Explorer',
    'https://placehold.co/600x600/fef3c7/92400e?text=Dragon+Tale'
];

function getRandomPlaceholder() {
    return PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)];
}

// Story templates
const storyTemplates = {
    adventure: {
        title: "The Adventure Begins",
        prompts: {
            simple: "Write a simple 8-page children's story about {name}, age {age}, who goes on an adventure with their favorite thing: {favorite}. Include elements of {interest1}, {interest2}. Keep sentences short, under 10 words. Avoid: {fear}. Format each page as a short paragraph.",
            medium: "Write an engaging 12-page children's story about {name}, age {age}, who goes on an adventure to find their favorite thing: {favorite}. Include elements of {interest1}, {interest2}, {interest3}. Use age-appropriate vocabulary for {age} year olds. Avoid: {fear}. Format each page as a paragraph.",
            advanced: "Write an exciting chapter-book style story (3 chapters, ~1000 words) about {name}, age {age}, who goes on a quest to help others using their knowledge of {interest1}, {interest2}, {interest3}. Their favorite thing is {favorite}. Write for a {age} year old. Avoid: {fear}."
        }
    }
};

// Generate character illustration - placeholder for MVP
async function generateCharacterIllustration(photo, childName, age) {
    console.log(`[MVP] Using placeholder for ${childName}'s illustration`);
    return getRandomPlaceholder();
}

// Generate personalized story using OpenRouter
async function generateStory(bookData) {
    const { childName, childAge, interests, favoriteThing, fearToAvoid, readingLevel } = bookData;
    
    const template = storyTemplates.adventure;
    const prompt = template.prompts[readingLevel]
        .replace('{name}', childName)
        .replace(/{age}/g, childAge)
        .replace('{favorite}', favoriteThing)
        .replace('{interest1}', interests[0] || 'adventure')
        .replace('{interest2}', interests[1] || interests[0] || 'friendship')
        .replace('{interest3}', interests[2] || interests[0] || 'discovery')
        .replace('{fear}', fearToAvoid || 'nothing scary');
    
    console.log('Generating story with prompt:', prompt.substring(0, 100) + '...');
    
    // Try OpenRouter first (we have access), fall back to mock
    try {
        if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'not-set') {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'https://adventuresof.app',
                    'X-Title': 'Adventures Of'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a children\'s book author. Write engaging, age-appropriate stories that are magical, heartwarming, and feature the child as the hero. Include positive messages about friendship, bravery, and discovery.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 2000,
                    temperature: 0.8
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.choices[0].message.content;
            }
        }
    } catch (err) {
        console.log('OpenRouter error, using mock story:', err.message);
    }
    
    // Fallback: generate a simple mock story
    return generateMockStory(bookData);
}

function generateMockStory(bookData) {
    const { childName, interests, favoriteThing } = bookData;
    const interest = interests[0] || 'adventure';
    
    return `Chapter 1: The Beginning

Once upon a time, there was a brave young explorer named ${childName}.

${childName} loved ${interest} more than anything in the whole wide world. Every day, ${childName} would dream of exciting adventures.

One sunny morning, ${childName} woke up to find a mysterious map on the bedroom floor. It showed a path to a magical place where ${favoriteThing} grew on trees!

"Wow!" exclaimed ${childName}. "I have to find this place!"

Chapter 2: The Journey

${childName} packed a small bag with snacks and set off on the adventure of a lifetime.

Along the way, ${childName} met friendly animals who wanted to help. A wise owl pointed the way, and a playful squirrel shared acorns.

Through forests and over hills, ${childName} kept walking. The map showed they were getting closer!

Chapter 3: The Discovery

At last, ${childName} reached the magical place. It was even more beautiful than in the dreams!

And there, in the center of a sparkling meadow, grew the most amazing ${favoriteThing} ${childName} had ever seen.

${childName} smiled widest than ever before. The adventure had been worth every step.

From that day on, ${childName} knew that the best adventures happen when you're brave enough to try.

The End.

---

This story was made for ${childName} with love.`;
}

// Create PDF book
async function createPDFBook(story, imageUrl, childName) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const outputDir = path.join(__dirname, 'output');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `${childName.replace(/\s/g, '_')}_book_${Date.now()}.pdf`);
    
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);
    
    // Cover page
    doc.fontSize(36).fillColor('#92400e').text("Adventures Of", { align: 'center' });
    doc.moveDown();
    doc.fontSize(24).fillColor('#78350f').text(`A Story About ${childName}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).fillColor('#6b7280').text("Where every child becomes the hero", { align: 'center' });
    
    // Add cover image placeholder
    doc.moveDown(5);
    doc.fontSize(12).fillColor('#92400e').text("📖", { align: 'center' });
    
    // Story pages
    doc.addPage();
    doc.fillColor('#1f2937').fontSize(12);
    
    const pages = story.split('\n\n').filter(p => p.trim());
    
    for (const page of pages) {
        doc.addPage();
        doc.fontSize(12).text(page, {
            align: 'left',
            lineGap: 8
        });
    }
    
    doc.end();
    
    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(outputPath));
        writeStream.on('error', reject);
    });
}

// Main generation endpoint
app.post('/api/generate', async (req, res) => {
    try {
        const bookData = req.body;
        
        console.log('Generating book for:', bookData.childName);
        
        // Step 1: Generate character illustration
        console.log('Step 1: Generating character illustration...');
        const characterImageUrl = await generateCharacterIllustration(
            bookData.photo,
            bookData.childName,
            bookData.childAge
        );
        
        // Step 2: Generate story
        console.log('Step 2: Generating personalized story...');
        const story = await generateStory(bookData);
        
        // Step 3: Create PDF
        console.log('Step 3: Creating PDF...');
        const pdfPath = await createPDFBook(story, characterImageUrl, bookData.childName);
        
        res.json({
            success: true,
            downloadUrl: `/output/${path.basename(pdfPath)}`,
            story: story.substring(0, 500) + '...',
            characterImage: characterImageUrl
        });
        
    } catch (error) {
        console.error('Error generating book:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Serve static files (frontend)
app.use(express.static(path.join(__dirname)));

// Serve output files
app.use('/output', express.static(path.join(__dirname, 'output')));

// Payment link - Replace with your actual Cash App or Stripe link
const PAYMENT_LINK = 'https://cash.app/$AprilJetson'; // TODO: Update to your payment link

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', mode: 'MVP', paymentLink: PAYMENT_LINK });
});

// Get payment link
app.get('/api/payment-link', (req, res) => {
    res.json({ url: PAYMENT_LINK, price: '$12' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Adventures Of API running on port ${PORT}`);
});

module.exports = app;

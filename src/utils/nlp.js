const natural = require('natural');

const tokenizer = new natural.WordTokenizer();
const SentimentAnalyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new SentimentAnalyzer('English', stemmer, 'afinn');

// Keywords for ticket urgency detection
const URGENT_WORDS = [
    'urgent', 'emergency', 'immediately', 'critical', 'serious',
    'dangerous', 'broken', 'stuck', 'blocked', 'asap', 'severe',
    'failed', 'not working', 'no water', 'no light', 'no power',
    'injured', 'safety', 'fire', 'flood', 'leaking', 'collapse'
];

// Keywords for ticket category suggestion
const CATEGORY_KEYWORDS = {
    infrastructure: [
        'building', 'room', 'classroom', 'lab', 'computer', 'ac',
        'fan', 'light', 'electricity', 'water', 'bench', 'chair',
        'desk', 'projector', 'wifi', 'internet', 'network', 'lift',
        'elevator', 'parking', 'hostel', 'pipe', 'roof', 'wall',
        'door', 'window', 'broken', 'leaking', 'damage'
    ],
    academics: [
        'exam', 'test', 'marks', 'grade', 'assignment', 'course',
        'subject', 'teacher', 'faculty', 'class', 'lecture',
        'syllabus', 'result', 'attendance', 'timetable', 'schedule',
        'certificate', 'degree', 'library', 'book', 'study'
    ],
    hygiene: [
        'clean', 'dirty', 'trash', 'garbage', 'waste', 'smell',
        'odor', 'pest', 'cockroach', 'rat', 'mosquito', 'dust',
        'toilet', 'bathroom', 'mess', 'food', 'canteen', 'unhygienic',
        'stink', 'mold', 'fungus'
    ]
};

/**
 * Analyzes sentiment of a text string.
 * @returns {{ label: 'positive'|'neutral'|'negative', score: number }}
 */
function analyzeCommentSentiment(text) {
    if (!text || !text.trim()) return { label: 'neutral', score: 0 };
    const tokens = tokenizer.tokenize(text.toLowerCase());
    if (!tokens || tokens.length === 0) return { label: 'neutral', score: 0 };
    const score = analyzer.getSentiment(tokens);
    let label = 'neutral';
    if (score > 0.05) label = 'positive';
    else if (score < -0.05) label = 'negative';
    return { label, score: parseFloat(score.toFixed(2)) };
}

/**
 * Returns true if the text contains urgency signals.
 */
function detectUrgency(text) {
    if (!text || !text.trim()) return false;
    const lower = text.toLowerCase();
    return URGENT_WORDS.some(word => lower.includes(word));
}

/**
 * Suggests a ticket category based on description keywords.
 * @returns {'infrastructure'|'academics'|'hygiene'|null}
 */
function suggestCategory(text) {
    if (!text || !text.trim()) return null;
    const lower = text.toLowerCase();
    const scores = {};
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        scores[cat] = keywords.filter(kw => lower.includes(kw)).length;
    }
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return best && best[1] > 0 ? best[0] : null;
}

module.exports = { analyzeCommentSentiment, detectUrgency, suggestCategory };

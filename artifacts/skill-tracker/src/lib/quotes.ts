export interface Quote {
  text: string;
  author: string;
}

export const quotes: Quote[] = [
  { text: "I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.", author: "Bruce Lee" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "You don't rise to the level of your goals, you fall to the level of your systems.", author: "James Clear" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Imagination is more important than knowledge.", author: "Albert Einstein" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "Education is not the filling of a pail, but the lighting of a fire.", author: "W.B. Yeats" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "A little progress each day adds up to big results.", author: "Satya Nani" },
  { text: "Mastery is not a function of genius or talent, it is a function of time and intense focus.", author: "Robert Greene" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "First forget inspiration. Habit is more dependable.", author: "Octavia Butler" },
  { text: "Excellence is not a singular act but a habit. You are what you do repeatedly.", author: "Shaquille O'Neal" },
  { text: "Change is hard at first, messy in the middle and gorgeous at the end.", author: "Robin Sharma" },
  { text: "Talent is a pursued interest. Anything that you're willing to practice, you can do.", author: "Bob Ross" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "There are no shortcuts to any place worth going.", author: "Beverly Sills" },
  { text: "The difference between ordinary and extraordinary is that little extra.", author: "Jimmy Johnson" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Anonymous" },
  { text: "Continuous improvement is better than delayed perfection.", author: "Mark Twain" },
  { text: "The obstacle is the way.", author: "Marcus Aurelius" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Knowing is not enough; we must apply. Willing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
  { text: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "The secret to success is consistency of purpose.", author: "Benjamin Disraeli" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "Every master was once a disaster.", author: "T. Harv Eker" },
  { text: "Be patient with yourself. Self-growth is tender; it's holy ground. There's no greater investment.", author: "Stephen Covey" },
  { text: "When you learn, teach. When you get, give.", author: "Maya Angelou" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "Each day provides its own gifts.", author: "Marcus Aurelius" },
  { text: "Decide what you want. Decide what you are willing to exchange for it. Establish your priorities and go to work.", author: "H.L. Hunt" },
  { text: "Never stop learning because life never stops teaching.", author: "Anonymous" },
  { text: "Progress, not perfection.", author: "Kathy Freston" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Strive for progress, not perfection.", author: "David Perno" },
  { text: "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.", author: "Abigail Adams" },
];

export function getRandomQuote(lastIndex: number): { quote: Quote; index: number } {
  let index: number;
  do {
    index = Math.floor(Math.random() * quotes.length);
  } while (index === lastIndex && quotes.length > 1);
  return { quote: quotes[index], index };
}

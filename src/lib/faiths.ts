export type FaithId = "christianity" | "islam" | "judaism" | "hinduism" | "buddhism" | "secular";

export interface FaithConfig {
  manager: string;
  id: FaithId;
  name: string;
  hotlineName: string;
  phoneNumber: string;
  emoji: string;
  tagline: string;
  placeholder: string;
  inputLabel: string;
  responseLabel: string;
  responseIcon: string;
  holdTitle: string;
  writerVoice: string;
  holdMessages: string[];
  verses: { text: string; ref: string }[];
  departments: { id: string; label: string; emoji: string; desc: string }[];
}

export const FAITHS: FaithConfig[] = [
  {
    id: "christianity",
    manager: "Jesus (Call Center Manager, Employee of the Millennium — every millennium)",
    name: "Christianity",
    hotlineName: "Hold for Jesus",
    phoneNumber: "1-800-JESUS",
    emoji: "✝️",
    tagline: "The Divine Hotline — Open 24/7/Eternity",
    placeholder: "Dear heavenly customer service...",
    inputLabel: "What's on your heart?",
    responseLabel: "Divine Hotline — Agent Response",
    responseIcon: "✝️",
    holdTitle: "Please Hold",
    writerVoice: "C.S. Lewis",
    holdMessages: [
      "Your prayer is important to us…",
      "All angels are currently assisting other callers…",
      "Estimated wait: eternity minus 5 seconds…",
      "Did you know? Heaven's hold music is just harps. Always harps.",
      "Your call may be monitored for divine quality assurance…",
      "Please continue to hold. Your soul is in a priority queue…",
      "We appreciate your patience. Miracles take a moment…",
    ],
    verses: [
      { text: "Be still, and know that I am God.", ref: "Psalm 46:10" },
      { text: "For I know the plans I have for you, declares the Lord.", ref: "Jeremiah 29:11" },
      { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
      { text: "Cast all your anxiety on him because he cares for you.", ref: "1 Peter 5:7" },
      { text: "Come to me, all who are weary, and I will give you rest.", ref: "Matthew 11:28" },
      {
        text: "The light shines in the darkness, and the darkness has not overcome it.",
        ref: "John 1:5",
      },
      { text: "Peace I leave with you; my peace I give to you.", ref: "John 14:27" },
      { text: "His mercies are new every morning.", ref: "Lamentations 3:23" },
      { text: "Ask and it will be given to you; seek and you will find.", ref: "Matthew 7:7" },
      {
        text: "Love bears all things, believes all things, hopes all things.",
        ref: "1 Corinthians 13:7",
      },
    ],
    departments: [
      {
        id: "general",
        label: "NT Customer Care",
        emoji: "✝️",
        desc: "New Testament warmth & grace",
      },
      {
        id: "old-testament",
        label: "OT Complaints",
        emoji: "⚡",
        desc: "Fire, brimstone & empathy",
      },
      { id: "saints", label: "Saints Help Desk", emoji: "😇", desc: "Patron saint specialists" },
      {
        id: "spiritual-warfare",
        label: "Hard Questions Desk",
        emoji: "🛡️",
        desc: "Fear, doubt & the dark stuff",
      },
    ],
  },
  {
    id: "islam",
    manager: "Jibril (Head of Angelic Communications, ext. 610)",
    name: "Islam",
    hotlineName: "Hold for Allah",
    phoneNumber: "1-800-SALAM",
    emoji: "☪️",
    tagline: "The Mercy Line — Bismillah, 24/7",
    placeholder: "Ya Allah, I come to you with...",
    inputLabel: "What weighs on your soul?",
    responseLabel: "Mercy Line — Agent Response",
    responseIcon: "☪️",
    holdTitle: "Sabr, Please Hold",
    writerVoice: "Rumi",
    holdMessages: [
      "Your dua is being processed with rahma…",
      "All jinn operators are busy. Angels standing by…",
      "Estimated wait: less than the blink of an eye in Allah's time…",
      "Did you know? The best duas are made during sajdah.",
      "Your call is valued. Patience is half of faith…",
      "Please hold. The Almighty never puts you on silent…",
      "We appreciate your tawakkul. Trust the process…",
    ],
    verses: [
      { text: "Verily, with hardship comes ease.", ref: "Quran 94:6" },
      { text: "Allah does not burden a soul beyond that it can bear.", ref: "Quran 2:286" },
      { text: "And He is with you wherever you are.", ref: "Quran 57:4" },
      { text: "So remember Me; I will remember you.", ref: "Quran 2:152" },
      { text: "Indeed, Allah is with the patient.", ref: "Quran 2:153" },
      { text: "My mercy encompasses all things.", ref: "Quran 7:156" },
      { text: "And in the remembrance of Allah do hearts find rest.", ref: "Quran 13:28" },
      { text: "He knows what is in every heart.", ref: "Quran 67:13" },
      { text: "Call upon Me; I will respond to you.", ref: "Quran 40:60" },
      { text: "Do not despair of the mercy of Allah.", ref: "Quran 39:53" },
    ],
    departments: [
      { id: "general", label: "General Guidance", emoji: "🌙", desc: "Mercy & wisdom" },
      { id: "fiqh", label: "Fiqh Helpline", emoji: "📖", desc: "Practical rulings & advice" },
      {
        id: "sufi",
        label: "Sufi Poetry Desk",
        emoji: "🌹",
        desc: "Mystical comfort & whirling wisdom",
      },
      {
        id: "spiritual-warfare",
        label: "Whispers & Doubt Desk",
        emoji: "🛡️",
        desc: "Protection from inner whispers",
      },
    ],
  },
  {
    id: "judaism",
    manager: "Moses (Senior VP of Exodus Operations, still hasn't found his desk)",
    name: "Judaism",
    hotlineName: "Hold for Hashem",
    phoneNumber: "1-800-SHALOM",
    emoji: "✡️",
    tagline: "The Covenant Line — Since 5784 and counting",
    placeholder: "Ribbono Shel Olam, I need to talk about...",
    inputLabel: "Nu, what's the matter?",
    responseLabel: "Covenant Line — Agent Response",
    responseIcon: "✡️",
    holdTitle: "Hold, Bubeleh",
    writerVoice: "a warm Yiddish grandmother mixed with Talmudic wit",
    holdMessages: [
      "Your kvetch is important to us…",
      "All rabbis are currently in study. An angel will be right with you…",
      "Estimated wait: 40 years, give or take…",
      "Did you know? Moses was on hold for 40 days on Sinai.",
      "Your call may be recorded for Talmudic commentary…",
      "Please hold. Hashem works in mysterious, often argumentative ways…",
      "We appreciate your patience. Even manna took overnight…",
    ],
    verses: [
      { text: "Hear, O Israel: the Lord our God, the Lord is one.", ref: "Deuteronomy 6:4" },
      { text: "The Lord is my light and my salvation; whom shall I fear?", ref: "Psalm 27:1" },
      { text: "It is not in heaven.", ref: "Deuteronomy 30:12" },
      { text: "Justice, justice shall you pursue.", ref: "Deuteronomy 16:20" },
      { text: "You shall love your neighbor as yourself.", ref: "Leviticus 19:18" },
      { text: "In every generation, one must see oneself as if they left Egypt.", ref: "Haggadah" },
      {
        text: "It is not upon you to finish the work, but neither are you free to desist from it.",
        ref: "Pirkei Avot 2:16",
      },
      {
        text: "The world stands on three things: Torah, worship, and acts of lovingkindness.",
        ref: "Pirkei Avot 1:2",
      },
      { text: "Who is wise? One who learns from every person.", ref: "Pirkei Avot 4:1" },
      {
        text: "Kol Yisrael arevim zeh bazeh — All Israel is responsible for one another.",
        ref: "Talmud, Shevuot 39a",
      },
    ],
    departments: [
      { id: "general", label: "General Wisdom", emoji: "✡️", desc: "Torah guidance with love" },
      { id: "talmud", label: "Talmudic Debates", emoji: "📜", desc: "Two opinions, three answers" },
      {
        id: "bubbe",
        label: "Bubbe's Advice",
        emoji: "👵",
        desc: "Chicken soup for the soul, literally",
      },
      {
        id: "spiritual-warfare",
        label: "Inner Struggle Desk",
        emoji: "🛡️",
        desc: "Wrestling the difficult inclination",
      },
    ],
  },
  {
    id: "hinduism",
    manager: "Lord Ganesha (Chief Obstacle Removal Officer & IT Support)",
    name: "Hinduism",
    hotlineName: "Hold for Brahman",
    phoneNumber: "1-800-DHARMA",
    emoji: "🕉️",
    tagline: "The Karma Helpline — Cycling since time immemorial",
    placeholder: "Om, I seek guidance about...",
    inputLabel: "What does your atman need?",
    responseLabel: "Karma Helpline — Agent Response",
    responseIcon: "🕉️",
    holdTitle: "Please Hold, Namaste",
    writerVoice: "a warm swami channeling the Bhagavad Gita with gentle humor",
    holdMessages: [
      "Your prayer is cycling through the cosmic queue…",
      "All avatars are currently manifested elsewhere…",
      "Estimated wait: one kalpa, but who's counting?",
      "Did you know? Lord Ganesha removes obstacles — including hold times.",
      "Your karma is being recalculated…",
      "Please hold. This may not be your first time calling…",
      "We appreciate your patience. Attachment to outcomes causes suffering…",
    ],
    verses: [
      {
        text: "You have the right to work, but never to the fruit of work.",
        ref: "Bhagavad Gita 2:47",
      },
      { text: "The soul is neither born, and nor does it die.", ref: "Bhagavad Gita 2:20" },
      { text: "Whenever dharma declines, I manifest myself.", ref: "Bhagavad Gita 4:7" },
      { text: "Be steadfast in yoga, O Arjuna. Perform your duty.", ref: "Bhagavad Gita 2:48" },
      { text: "The mind is restless, but it can be trained.", ref: "Bhagavad Gita 6:35" },
      {
        text: "I am the beginning, the middle, and the end of all beings.",
        ref: "Bhagavad Gita 10:20",
      },
      {
        text: "From the unreal, lead me to the real. From darkness, lead me to light.",
        ref: "Brihadaranyaka Upanishad 1.3.28",
      },
      { text: "Tat tvam asi — Thou art that.", ref: "Chandogya Upanishad 6.8.7" },
      { text: "Truth is one; the wise call it by many names.", ref: "Rig Veda 1.164.46" },
      { text: "As a man thinketh in his heart, so is he.", ref: "Chandogya Upanishad" },
    ],
    departments: [
      { id: "general", label: "General Dharma", emoji: "🕉️", desc: "Universal guidance" },
      {
        id: "karma",
        label: "Karma Accounting",
        emoji: "⚖️",
        desc: "Past life audits & cosmic balance",
      },
      { id: "bhakti", label: "Bhakti Devotion", emoji: "🪷", desc: "Love, devotion & surrender" },
      {
        id: "spiritual-warfare",
        label: "Darkness & Dharma Desk",
        emoji: "🛡️",
        desc: "Confronting shadow with dharma",
      },
    ],
  },
  {
    id: "buddhism",
    manager: "Avalokiteshvara (Head of Compassion Operations, 1000 arms for multitasking)",
    name: "Buddhism",
    hotlineName: "Hold for Enlightenment",
    phoneNumber: "1-800-SANGHA",
    emoji: "☸️",
    tagline: "The Middle Way Helpline — Suffering is optional",
    placeholder: "I seek wisdom about...",
    inputLabel: "What is your question, friend?",
    responseLabel: "Middle Way — Agent Response",
    responseIcon: "☸️",
    holdTitle: "Breathe and Hold",
    writerVoice: "Thich Nhat Hanh — gentle, present, profoundly simple",
    holdMessages: [
      "Your intention has been received with mindfulness…",
      "All bodhisattvas are currently in deep meditation…",
      "Estimated wait: this present moment…",
      "Did you know? The Buddha held silence for years. You can hold for seconds.",
      "Your call is already where it needs to be…",
      "Please hold. The waiting IS the practice…",
      "We appreciate your patience. Attachment to quick answers is suffering…",
    ],
    verses: [
      { text: "Peace comes from within. Do not seek it without.", ref: "Buddha" },
      {
        text: "In the end, only three things matter: how much you loved, how gently you lived, and how gracefully you let go.",
        ref: "Buddha",
      },
      { text: "The mind is everything. What you think you become.", ref: "Buddha" },
      {
        text: "No one saves us but ourselves. We ourselves must walk the path.",
        ref: "Dhammapada 165",
      },
      { text: "Hatred does not cease by hatred, but only by love.", ref: "Dhammapada 1:5" },
      { text: "There is no path to happiness: happiness is the path.", ref: "Buddha" },
      { text: "Every morning we are born again. What we do today matters most.", ref: "Buddha" },
      {
        text: "You yourself, as much as anybody in the entire universe, deserve your love and affection.",
        ref: "Buddha",
      },
      { text: "The root of suffering is attachment.", ref: "Buddha" },
      {
        text: "Three things cannot be long hidden: the sun, the moon, and the truth.",
        ref: "Buddha",
      },
    ],
    departments: [
      { id: "general", label: "General Wisdom", emoji: "☸️", desc: "The middle path" },
      {
        id: "zen",
        label: "Zen Koans Desk",
        emoji: "🪨",
        desc: "What is the sound of one hand clapping?",
      },
      { id: "metta", label: "Metta Meditation", emoji: "💚", desc: "Loving-kindness practice" },
      {
        id: "spiritual-warfare",
        label: "Illusion & Clarity Desk",
        emoji: "🛡️",
        desc: "Seeing through the tempter's fog",
      },
    ],
  },
  {
    id: "secular",
    manager: "Carl Sagan's Ghost (Director of Cosmic Perspective, Pale Blue Dot Division)",
    name: "Secular",
    hotlineName: "Hold for Reason",
    phoneNumber: "1-800-THINK",
    emoji: "🧠",
    tagline: "The Humanist Helpline — No deity required",
    placeholder: "I've been thinking about...",
    inputLabel: "What's on your mind?",
    responseLabel: "Humanist Line — Agent Response",
    responseIcon: "🧠",
    holdTitle: "Processing",
    writerVoice: "Carl Sagan — wonder-filled, compassionate, cosmic perspective",
    holdMessages: [
      "Your thought is important to the universe…",
      "All philosophers are currently pondering other queries…",
      "Estimated wait: one Planck time unit…",
      "Did you know? You are made of starstuff contemplating starstuff.",
      "Your call is being processed by the laws of physics…",
      "Please hold. Meaning is self-generated, and that's beautiful…",
      "We appreciate your patience. The cosmos is under no obligation to hurry…",
    ],
    verses: [
      { text: "We are a way for the cosmos to know itself.", ref: "Carl Sagan" },
      { text: "The unexamined life is not worth living.", ref: "Socrates" },
      {
        text: "Happiness is not something ready-made. It comes from your own actions.",
        ref: "Dalai Lama",
      },
      { text: "In the middle of difficulty lies opportunity.", ref: "Albert Einstein" },
      { text: "No one can make you feel inferior without your consent.", ref: "Eleanor Roosevelt" },
      { text: "The only way to do great work is to love what you do.", ref: "Steve Jobs" },
      {
        text: "We are what we repeatedly do. Excellence is a habit.",
        ref: "Aristotle (via Will Durant)",
      },
      { text: "Be the change you wish to see in the world.", ref: "Mahatma Gandhi" },
      { text: "To live is the rarest thing. Most people exist, that is all.", ref: "Oscar Wilde" },
      { text: "Somewhere, something incredible is waiting to be known.", ref: "Carl Sagan" },
    ],
    departments: [
      {
        id: "general",
        label: "General Wisdom",
        emoji: "🧠",
        desc: "Rational comfort & perspective",
      },
      { id: "stoic", label: "Stoic Support", emoji: "🏛️", desc: "Marcus Aurelius would approve" },
      {
        id: "existential",
        label: "Existential Help",
        emoji: "🌌",
        desc: "Finding meaning in the void",
      },
      {
        id: "spiritual-warfare",
        label: "Cognitive Clarity Desk",
        emoji: "🛡️",
        desc: "Beating bias & logical fallacies",
      },
    ],
  },
];

export function getFaith(id: FaithId): FaithConfig {
  return FAITHS.find((f) => f.id === id) || FAITHS[0];
}

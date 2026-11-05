const Listing = require('../models/listing.js');
let GoogleGenerativeAI;
try {
  const geminiModule = require('@google/generative-ai');
  GoogleGenerativeAI = geminiModule.GoogleGenerativeAI;
} catch (err) {
  GoogleGenerativeAI = null;
}

/**
 * Strict Guardrails and Domain Limitations for Wanderlust Website
 */
const FORBIDDEN_PATTERNS = [
  // Coding / Tech / Software Development
  /\b(code|coding|script|program|programming|function|algorithm|binary search|data structure|array|linked list|debug|compiler|syntax error|regex|sql|python|javascript|typescript|java|c\+\+|c#|golang|rust|php|ruby|swift|kotlin|html|css|bash|powershell|npm|git|github|docker|react|vue|angular|django|flask|node|express|database schema|recursion)\b/i,
  
  // Math / Science / Homework
  /\b(solve|derivative|integral|equation|algebra|calculus|physics|chemistry|biology|homework|pythagor|quadratic|gravity|quantum|molecule|velocity|acceleration|formula for)\b/i,
  /\d+\s*[\+\-\*\/]\s*\d+/,
  
  // Politics / World News / Government
  /\b(president|prime minister|election|parliament|democrat|republican|political party|foreign policy|war in|military|ukraine|russia|nato|congress|senate)\b/i,
  
  // General Trivia / Pop Culture / Sports
  /\b(capital of|population of|who won|world cup|super bowl|olympics|oscars|ipl|cricket score|football match|actor|actress|movie plot|film review|lyrics to|singer)\b/i,
  
  // Health / Medicine / Recipes
  /\b(recipe for|how to cook|ingredients of|bake a cake|calories in|medical advice|symptom of|cure for|headache|fever|cough|cancer|treatment for|medicine)\b/i,
  
  // Finance / Crypto
  /\b(bitcoin|crypto|ethereum|stock market|share price|mutual fund|forex|invest in)\b/i,
  
  // Unrelated Chit-Chat & Competitors
  /\b(tell me a joke|write a poem|write a song|write an essay|roleplay|chatgpt|openai|who created you|what is the meaning of life)\b/i,
  /\b(airbnb|booking\.com|vrbo|expedia|agoda|trivago|kayak|tripadvisor)\b/i
];

/**
 * Check if a query violates Wanderlust's website-only limitation
 */
function isOutOfScope(query) {
  const lower = query.trim().toLowerCase();

  // Short greetings are allowed
  if (/^(hi|hello|hey|help|good\s*(morning|afternoon|evening)|namaste)\b/i.test(lower) && lower.length < 25) {
    return false;
  }

  // Check against forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(query)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if the query is travel/stay related
 */
function isTravelOrPlatformRelated(text) {
  const travelKeywords = /\b(stay|stays|villa|villas|hotel|hotels|room|rooms|place|places|beach|beaches|mountain|mountains|pool|pools|cabin|cabins|house|houses|resort|resorts|cottage|accommodation|rent|vacation|holiday|trip|trips|travel|destination|destinations|book|booking|reserve|reservation|guest|guests|host|hosting|review|reviews|fee|fees|tax|taxes|price|pricing|cost|budget|cheap|luxury|wanderlust|santorini|greece|bali|indonesia|france|paris|italy|rome|japan|kyoto|tokyo|goa|kerala|alleppey|darjeeling|switzerland|maldives|bora bora|norway|austria|costa rica|spain|barcelona)\b/i;
  return travelKeywords.test(text);
}

/**
 * Extract search criteria from user prompt for live MongoDB query
 */
function extractListingSearchCriteria(text) {
  const criteria = {};
  const lower = text.toLowerCase();

  // Price / Budget check
  const underPriceMatch = lower.match(/(?:under|below|less than|max|budget of)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i) ||
                          lower.match(/(?:rs\.?|inr|₹)\s*(\d+)\s*(?:or less|max|budget)/i);
  if (underPriceMatch) {
    criteria.maxPrice = parseInt(underPriceMatch[1], 10);
  }

  const cheapMatch = lower.match(/\b(cheap|budget|affordable|low cost|economy)\b/i);
  if (cheapMatch && !criteria.maxPrice) {
    criteria.maxPrice = 3000;
  }

  const luxuryMatch = lower.match(/\b(luxury|expensive|premium|high end|5 star)\b/i);
  if (luxuryMatch) {
    criteria.minPrice = 4000;
  }

  // Location / Country extraction
  const commonPlaces = [
    'santorini', 'greece', 'seminyak', 'bali', 'indonesia', 'france', 'gordes', 'paris',
    'italy', 'florence', 'rome', 'tuscany', 'japan', 'kyoto', 'tokyo', 'goa', 'alleppey',
    'kerala', 'darjeeling', 'india', 'switzerland', 'alps', 'maldives', 'baa atoll',
    'bora bora', 'fiji', 'norway', 'flåm', 'austria', 'vienna', 'costa rica', 'barbados',
    'thailand', 'phuket', 'spain', 'barcelona', 'mexico', 'tulum', 'canada', 'banff',
    'asheville', 'united states', 'usa', 'dubai', 'uae', 'cape town', 'south africa',
    'vietnam', 'can tho', 'brazil', 'chile', 'cuba', 'finland', 'australia'
  ];

  for (const place of commonPlaces) {
    const regex = new RegExp(`\\b${place}\\b`, 'i');
    if (regex.test(lower)) {
      criteria.location = place;
      break;
    }
  }

  // Categories & keywords
  const categories = [
    'villa', 'pool', 'pools', 'beach', 'beachfront', 'mountain', 'mountains',
    'room', 'rooms', 'city', 'iconic cities', 'castle', 'castles', 'camping',
    'farm', 'farms', 'arctic', 'boat', 'boats', 'lake', 'cabin', 'resort'
  ];

  for (const cat of categories) {
    const regex = new RegExp(`\\b${cat}\\b`, 'i');
    if (regex.test(lower)) {
      criteria.category = cat;
      break;
    }
  }

  return criteria;
}

/**
 * Fetch matching listings from MongoDB
 */
async function findMatchingListings(criteria) {
  try {
    const query = {};

    if (criteria.maxPrice || criteria.minPrice) {
      query.price = {};
      if (criteria.maxPrice) query.price.$lte = criteria.maxPrice;
      if (criteria.minPrice) query.price.$gte = criteria.minPrice;
    }

    const orConditions = [];

    if (criteria.location) {
      const locRegex = new RegExp(criteria.location, 'i');
      orConditions.push(
        { location: locRegex },
        { country: locRegex },
        { title: locRegex },
        { description: locRegex }
      );
    }

    if (criteria.category) {
      const catRegex = new RegExp(criteria.category, 'i');
      orConditions.push(
        { title: catRegex },
        { description: catRegex },
        { location: catRegex }
      );
    }

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    // Find up to 4 listings matching criteria
    let listings = await Listing.find(query).limit(4).lean();

    // If criteria had location/category but no results, try matching location or category alone
    if (listings.length === 0 && (criteria.location || criteria.category)) {
      if (criteria.location) {
        listings = await Listing.find({
          $or: [
            { location: new RegExp(criteria.location, 'i') },
            { country: new RegExp(criteria.location, 'i') }
          ]
        }).limit(3).lean();
      }
    }

    return listings.map(l => ({
      id: l._id.toString(),
      title: l.title,
      location: `${l.location}, ${l.country}`,
      price: l.price,
      image: l.image?.url || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800",
      url: `/listings/${l._id}`
    }));
  } catch (err) {
    console.error("Listing query error:", err);
    return [];
  }
}

/**
 * Intelligent Built-in Assistant Engine (Guaranteed zero-dependency fallback)
 */
async function processWithRuleEngine(userMessage, currUser) {
  const lower = userMessage.toLowerCase().trim();

  // 1. Strict Limitation / Out of Scope check
  if (isOutOfScope(userMessage)) {
    return {
      reply: `🔒 **Scope Limitation:** I am the dedicated **Wanderlust Stay & Travel Assistant**.\n\nMy capabilities are strictly limited to the **Wanderlust website**: finding vacation stays, booking rooms, explaining fees, managing host listings, and platform policies.\n\nI cannot answer questions about programming, mathematics, general trivia, politics, or unrelated topics.\n\n👉 *How can I help you find your dream vacation stay on Wanderlust today?*`,
      listings: [],
      suggestions: [
        "Find beach villas in Greece",
        "Show stays under ₹3,000",
        "How do I book a stay?",
        "How do I host a property?"
      ]
    };
  }

  // 2. Greeting / Identity
  if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|namaste|start|who are you)\b/i.test(lower)) {
    const greetingName = currUser ? `, ${currUser.username}` : '';
    const roleNotice = currUser?.role === 'host' ? ' (Host Account)' : '';
    return {
      reply: `Hello${greetingName}! 👋 Welcome to **Wanderlust**${roleNotice}!\n\nI am your dedicated **Wanderlust Travel & Stays Concierge**. I can help you:\n\n• 🏖️ **Find Stays:** Search villas, beach houses, cabins, and iconic city stays across 35+ countries.\n• 📅 **Bookings:** Guide you step-by-step through reserving a stay and calculating taxes & fees.\n• 🏡 **Hosting:** Explain how to list your property or access the Host Dashboard.\n• ⭐ **Reviews:** Learn how to rate and review stays.\n\n*Note: I am strictly specialized in Wanderlust website assistance.* What would you like to explore?`,
      listings: [],
      suggestions: [
        "🏖️ Find beach & pool villas",
        "💰 Stays under ₹3,000 / night",
        "📅 How do I book a stay?",
        "🏡 How to become a host?",
        "🧾 Breakdown of taxes and fees"
      ]
    };
  }

  // 3. Pricing, Taxes & Fees
  if (/\b(fee|fees|tax|taxes|pricing|cost|cleaning fee|service fee|gst|breakdown|hidden charge)\b/i.test(lower)) {
    return {
      reply: `Here is the transparent **Wanderlust Pricing Breakdown** for all stays on our platform:\n\n1. **Base Price:** The nightly rate of the listing multiplied by the number of nights (` + '`price × nights`' + `).\n2. **Cleaning Fee:** Fixed at **₹800** per stay to ensure spotless accommodation.\n3. **Service Fee:** **10%** of the Base Price (covers platform maintenance & 24/7 guest support).\n4. **GST / Tax:** **18%** calculated on ` + '`(Base Price + Cleaning Fee + Service Fee)`' + `.\n\n💰 **Total Formula:**\n` + '`Total = (Price × Nights) + ₹800 + 10% Service Fee + 18% GST`' + `\n\n*You can see the real-time calculated total on any listing's "Reserve" page before confirming your booking!*`,
      listings: [],
      suggestions: [
        "Show budget stays under ₹2,500",
        "How do I reserve a stay?",
        "Where can I view my booked trips?"
      ]
    };
  }

  // 4. Booking & Reservation Guide
  if (/\b(how to book|how do i book|reserve|reservation|booking process|how to pay|payment method)\b/i.test(lower)) {
    return {
      reply: `Booking a stay on **Wanderlust** is simple and secure:\n\n1. **Browse Stays:** Search destinations on the [Explore](/listings) page or use the top search bar.\n2. **Select Listing:** Click on any stay card to view details, photos, amenities, and reviews.\n3. **Click "Reserve":** Click the red **Reserve Stay** button on the listing page.\n4. **Choose Dates & Guests:** Enter your check-in date, check-out date, and number of guests.\n5. **Review Price & Contact:** Fill in guest name, email, and phone number.\n6. **Confirm Booking:** Select your payment method and submit. Your reservation will immediately appear under [My Trips](/bookings)!`,
      listings: [],
      suggestions: [
        "Show popular vacation stays",
        "Where are my confirmed bookings?",
        "What are the cancellation rules?"
      ]
    };
  }

  // 5. Host & Listing Creation Guide
  if (/\b(host|hosting|post stay|new listing|list my property|host dashboard|become a host|add stay|add listing)\b/i.test(lower)) {
    let hostSpecific = "";
    if (currUser && currUser.role === 'host') {
      hostSpecific = `\n\n✨ Since you are logged in as a **Host**, you can directly go to your [Host Dashboard](/host/dashboard) or [Post a Stay](/listings/new) right now!`;
    } else {
      hostSpecific = `\n\n💡 *Tip: If your account is currently set to Traveler, you can register or sign in with a Host account to access the host management suite.*`;
    }

    return {
      reply: `Interested in hosting on **Wanderlust**? Here is how to share your space:\n\n1. **Sign in as Host:** Ensure your account has the **Host** role.\n2. **Create Listing:** Click **"Post Stay"** in the top navigation or visit [Post New Stay](/listings/new).\n3. **Provide Details:** Enter your listing title, description, location, country, and nightly price (in ₹ INR).\n4. **Upload High-Res Photo:** Attach an image of your property via Cloudinary upload.\n5. **Manage Listings:** Visit your [Host Dashboard](/host/dashboard) to view, edit, or remove your published stays.${hostSpecific}`,
      listings: [],
      suggestions: [
        "Go to Post a Stay",
        "Go to Host Dashboard",
        "What fees does Wanderlust charge?"
      ]
    };
  }

  // 6. My Trips / Bookings check
  if (/\b(my trips|my bookings|view booking|cancel booking|itinerary|reservations)\b/i.test(lower)) {
    return {
      reply: `You can access all your active and upcoming vacations anytime:\n\n• Navigate to [My Trips](/bookings) via the top navigation bar.\n• Here you'll find your stay confirmation details, check-in and check-out dates, guest count, and total paid amounts.\n• Each booking includes a direct link back to the listing page and host details.`,
      listings: [],
      suggestions: [
        "Browse new destinations",
        "Explain booking fees",
        "How do I contact support?"
      ]
    };
  }

  // 7. Reviews and Ratings
  if (/\b(review|reviews|rating|ratings|leave a review|stars|feedback)\b/i.test(lower)) {
    return {
      reply: `At **Wanderlust**, authentic reviews help travelers make the best choice:\n\n• **Leaving a Review:** Go to any listing you've visited, scroll down to the **"Leave a Review"** section.\n• **Rating:** Select 1 to 5 stars using our interactive star rating.\n• **Comments:** Write your personal feedback and submit.\n• **Review Management:** Review authors can delete their own reviews at any time from the listing page.`,
      listings: [],
      suggestions: [
        "Show top rated stays",
        "How to book a stay?",
        "Find villas with pools"
      ]
    };
  }

  // 8. Accounts, Signup, Login
  if (/\b(account|signup|sign up|login|log in|register|password|role|profile)\b/i.test(lower)) {
    return {
      reply: `Here's how accounts work on **Wanderlust**:\n\n• **Traveler Account:** Browse, search, save favorites, and reserve any listing on the platform.\n• **Host Account:** In addition to traveling, hosts can post listings and manage properties through the Host Dashboard.\n• **Get Started:** [Sign Up](/signup) for a new account or [Log In](/login) if you already have one.\n• You can switch or inspect your active role from the user pill menu in the top right navbar.`,
      listings: [],
      suggestions: [
        "Go to Sign Up",
        "Go to Log In",
        "Browse all stays"
      ]
    };
  }

  // 9. Search / Recommend Listings (Only when user asks for travel/stays)
  if (isTravelOrPlatformRelated(userMessage)) {
    const criteria = extractListingSearchCriteria(userMessage);
    const matchingListings = await findMatchingListings(criteria);

    if (matchingListings.length > 0) {
      let intro = "Here are matching stays available on **Wanderlust**";
      if (criteria.location) intro += ` in **${criteria.location.toUpperCase()}**`;
      if (criteria.maxPrice) intro += ` under **₹${criteria.maxPrice.toLocaleString('en-IN')}**`;
      if (criteria.category) intro += ` featuring **${criteria.category}**`;
      intro += ":\n\nClick on any card below to view details, photos, and book your stay!";

      return {
        reply: intro,
        listings: matchingListings,
        suggestions: [
          `How do I book ${matchingListings[0].title.slice(0, 20)}?`,
          "Show budget stays under ₹3,000",
          "What are the taxes and fees?",
          "How to list a new stay?"
        ]
      };
    }
  }

  // 10. Fallback: If not clearly related to Wanderlust, remind user of limitation
  return {
    reply: `🔒 **Scope Limitation:** I am your **Wanderlust Stay & Travel Assistant**.\n\nI can only assist with **Wanderlust website inquiries**, such as:\n• Finding vacation villas, rooms, and stays\n• Calculating booking costs, taxes, and fees\n• Guiding hosts on how to list properties\n• Navigating your bookings and user profile\n\nPlease let me know which destination you would like to explore or what stay feature you need help with!`,
    listings: [],
    suggestions: [
      "Find beach villas in Greece",
      "Show stays under ₹3,000",
      "How do I book a stay?",
      "How to host a stay?"
    ]
  };
}

/**
 * Handle chat query with Gemini API if key is present, otherwise fallback to local intelligent engine
 */
async function handleChatQuery(userMessage, conversationHistory = [], currUser = null) {
  // Always check guardrail first
  if (isOutOfScope(userMessage)) {
    return {
      reply: `🔒 **Scope Limitation:** I am the dedicated **Wanderlust Stay & Travel Assistant**.\n\nMy assistance is strictly limited to the **Wanderlust website**: finding vacation stays, reservations, pricing breakdowns, hosting guides, and platform navigation.\n\nI am not permitted to answer programming, mathematics, general trivia, politics, or unrelated topics.\n\n👉 *Would you like me to find accommodations in a particular destination or explain how to reserve a stay?*`,
      listings: [],
      suggestions: [
        "Find beach villas in Greece",
        "Show stays under ₹3,000",
        "How do I book a stay?",
        "How do I host a property?"
      ]
    };
  }

  // Search DB for relevant listings to ground the AI response
  const criteria = extractListingSearchCriteria(userMessage);
  let liveListings = [];
  const isSearchIntent = isTravelOrPlatformRelated(userMessage);

  if (isSearchIntent) {
    liveListings = await findMatchingListings(criteria);
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;

  // If Gemini API is configured, use it with strict system constraints
  if (geminiApiKey && GoogleGenerativeAI) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.2, // Strict and factual
          maxOutputTokens: 600
        }
      });

      const systemPrompt = `You are "Wanderlust AI", the official virtual concierge for the Wanderlust vacation rental website.
CRITICAL LIMITATIONS & RULES:
1. STRICT DOMAIN CONSTRAINT: You must ONLY answer questions related to the Wanderlust website, vacation stays, accommodations, booking steps, pricing (₹800 cleaning fee, 10% service fee, 18% GST), hosting stays, reviewing stays, and user accounts.
2. REFUSAL RULE: If the user asks about ANYTHING off-topic (including coding, programming, math, science, homework, general trivia, politics, recipes, medical advice, other competitors like Airbnb/Booking.com), you MUST POLITELY DECLINE. State: "I am Wanderlust's dedicated stay assistant. I can only assist with Wanderlust accommodations, bookings, host tools, and website support."
3. INDIAN RUPEE FORMAT: All prices are in ₹ INR per night.
4. TONE: Warm, welcoming, travel-enthusiastic, and concise.
5. CONTEXT: User role: ${currUser?.role || 'Guest'}. Username: ${currUser?.username || 'Guest'}.
${liveListings.length > 0 ? `CURRENT DATABASE LISTINGS MATCHING QUERY:\n${JSON.stringify(liveListings.map(l => ({ title: l.title, location: l.location, price: l.price, id: l.id })))}` : ''}

Provide a helpful, friendly response. If recommending stays, refer to the listings provided above.`;

      const prompt = `${systemPrompt}\n\nUser Question: ${userMessage}`;
      const result = await model.generateContent(prompt);
      const reply = result.response.text();

      return {
        reply,
        listings: liveListings,
        suggestions: [
          "How do I reserve a stay?",
          "What are the booking fees?",
          "How do I become a host?",
          "Show stays under ₹3,000"
        ]
      };
    } catch (aiErr) {
      console.warn("Gemini API call failed or quota exceeded, falling back to rule engine:", aiErr.message);
      // Seamlessly fall through to smart rule engine
    }
  }

  // Fallback to high-performance local intelligent engine
  return await processWithRuleEngine(userMessage, currUser);
}

module.exports = {
  handleChatQuery,
  isOutOfScope,
  isTravelOrPlatformRelated,
  findMatchingListings
};

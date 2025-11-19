/**
 * Services Configuration
 * Central catalog for all services, workshops, and offerings
 *
 * This file defines:
 * - Service/workshop catalog
 * - Pricing information
 * - Descriptions and details
 * - Images and visual assets
 * - Availability and features
 *
 * NOTE: Currently migrated from workshop-data.js (Moon Tide workshops).
 * Will be replaced with "Your Store Here" placeholders and made fully configurable.
 *
 * REPLACES:
 * - public/js/workshop-data.js (will be deleted)
 * - Duplicate registry in smart-message-renderer.js (will be deleted)
 */

export const services = {
    // ===== SERVICE 1: KAIROS BLANKET EXERCISE (IN-PERSON) =====
    'kairos-blanket-inperson': {
        id: 'kairos-blanket-inperson',
        type: 'workshop',        // 'service' | 'workshop' | 'consultation' | 'event'
        category: 'in-person',   // 'in-person' | 'virtual' | 'hybrid'

        // Basic info
        name: 'Kairos Blanket Exercise - In-Person',
        shortName: 'Kairos Blanket (In-Person)',
        slug: 'kairos-blanket-inperson',
        emoji: '🛏️',
        icon: 'fas fa-users',

        // Descriptions
        description: 'A powerful interactive experience exploring the history of Indigenous peoples in Canada. In partnership with Kairos Canada, this session uses blankets to physically represent the land and historical events.',
        longDescription: `The KAIROS Blanket Exercise is a powerful experiential learning tool that teaches the Indigenous rights history most Canadians never learned. Developed in response to the Report of the Royal Commission on Aboriginal Peoples in 1996, the exercise has been experienced by more than 350,000 Canadians.

Through this participatory workshop, you will walk through pre-contact, treaty-making, colonization and resistance. The experience fosters truth, understanding, respect and reconciliation among Indigenous and non-Indigenous peoples. Begins with a grounding song or prayer from an Elder.`,

        // Pricing
        pricing: {
            enabled: true,
            model: 'per_person',    // 'fixed' | 'per_person' | 'variable' | 'quote'
            currency: 'CAD',
            community: 22500,       // $225 in cents
            corporate: 37500,       // $375 in cents
            displayPrice: '$225 (Community) / $375 (Corporate)',
            priceUnit: 'per person',
        },

        // Details
        duration: '2-3 hours',
        participants: {
            min: 15,
            max: 50,
            recommended: '15-50 people',
        },
        location: 'Your location (we travel to you)',

        // Visual assets
        image: '/images/services/kairos in person.jpg',
        gallery: [],

        // SEO
        keywords: ['kairos', 'blanket', 'exercise', 'reconciliation', 'inperson', 'in-person', 'indigenous', 'education'],
        metaTitle: 'Kairos Blanket Exercise - In-Person | Your Brand',
        metaDescription: 'A powerful interactive experience exploring Indigenous history in Canada.',

        // Features/highlights
        highlights: [
            'Interactive group experience',
            'Facilitated by trained Indigenous educators',
            'Explores 500+ years of Indigenous-settler relations',
            'Includes post-exercise sharing circle',
            'Certificate of participation provided',
            'Opening song/prayer by Elder'
        ],

        // What's included
        included: [
            'All materials and blankets',
            'Trained facilitator',
            'Post-exercise debrief',
            'Digital resources',
        ],

        // What to expect
        whatToExpect: [
            'Physical activity (standing, walking)',
            'Emotional journey through history',
            'Group discussion and reflection',
            'Opportunities for questions and dialogue'
        ],

        // CTA
        ctaText: 'Add to Cart',
        ctaUrl: null, // null = use cart system

        // Availability
        available: true,
        featured: true,
        comingSoon: false,

        // Related services
        related: ['kairos-blanket-virtual', 'orange-shirt-day-inperson', 'mmiwg2s-inperson'],

        // Categories/tags
        categories: ['workshops', 'in-person', 'education'],
        tags: ['featured', 'popular', 'reconciliation'],
    },

    // ===== SERVICE 2: KAIROS BLANKET EXERCISE (VIRTUAL) =====
    'kairos-blanket-virtual': {
        id: 'kairos-blanket-virtual',
        type: 'workshop',
        category: 'virtual',

        name: 'Kairos Blanket Exercise - Virtual',
        shortName: 'Kairos Blanket (Virtual)',
        slug: 'kairos-blanket-virtual',
        emoji: '🛏️',
        icon: 'fas fa-video',

        description: 'Live online version of the Kairos Blanket Exercise, facilitated in partnership with Kairos Canada, grounded with an opening song by an Elder.',
        longDescription: `Adapted for online delivery, the Virtual KAIROS Blanket Exercise brings the same powerful learning experience to participants joining from different locations. Through innovative facilitation techniques, we create an immersive virtual environment that honors the integrity of the original exercise.

Perfect for remote teams, distributed organizations, or those unable to gather in person, this virtual version maintains the emotional impact and educational value of the in-person experience.`,

        pricing: {
            enabled: true,
            model: 'per_person',
            currency: 'CAD',
            community: 22500,
            corporate: 37500,
            displayPrice: '$225 (Community) / $375 (Corporate)',
            priceUnit: 'per person',
        },

        duration: '2-3 hours',
        participants: {
            min: 10,
            max: 40,
            recommended: '10-40 people',
        },
        location: 'Online via Zoom',

        image: '/images/services/kairos virtual.png',
        gallery: [],

        keywords: ['kairos', 'blanket', 'exercise', 'reconciliation', 'virtual', 'online'],

        highlights: [
            'Adapted for virtual engagement',
            'Interactive Zoom experience',
            'Breakout rooms for reflection',
            'Digital resources included',
            'Accessible from anywhere',
            'Opening song by Elder'
        ],

        included: [
            'Zoom meeting link',
            'Digital workbook materials',
            'Post-exercise resources',
            'Certificate of participation',
        ],

        whatToExpect: [
            'Zoom meeting link provided',
            'Interactive participation required',
            'Camera-on engagement encouraged',
            'Digital workbook materials'
        ],

        ctaText: 'Add to Cart',
        ctaUrl: null,

        available: true,
        featured: true,
        comingSoon: false,

        related: ['kairos-blanket-inperson', 'orange-shirt-day-virtual', 'mmiwg2s-virtual'],

        categories: ['workshops', 'virtual', 'education'],
        tags: ['featured', 'popular', 'remote-friendly'],
    },

    // ===== SERVICE 3: CEDAR WOVEN BRACELET =====
    'cedar-bracelet': {
        id: 'cedar-bracelet',
        type: 'workshop',
        category: 'hands-on',

        name: 'Cedar Woven Bracelet',
        shortName: 'Cedar Bracelet',
        slug: 'cedar-bracelet',
        emoji: '🪵',
        icon: 'fas fa-ring',

        description: 'An intricate, hands-on workshop focused on detailed artisan work. Participants learn the timeless art of cedar weaving.',
        longDescription: `Cedar has been used by Indigenous peoples of the Pacific Northwest for thousands of years. In this hands-on workshop, you'll learn traditional weaving techniques passed down through generations while creating a personal cedar bracelet to take home.

Connect with the sacred cedar tree and understand its significance in Coast Salish culture. Each bracelet becomes a wearable reminder of Indigenous wisdom and your connection to the land.`,

        pricing: {
            enabled: true,
            model: 'per_person',
            currency: 'CAD',
            community: 7000,  // $70
            corporate: 9500,  // $95
            displayPrice: '$70 (Community) / $95 (Corporate)',
            priceUnit: 'per person',
        },

        duration: '1.5-2 hours',
        participants: {
            min: 8,
            max: 20,
            recommended: '8-20 people',
        },
        location: 'Your location or our studio',

        image: '/images/services/cedar bracelets.jpg',
        gallery: [],

        keywords: ['cedar', 'bracelet', 'weaving', 'woven', 'crafts'],

        highlights: [
            'Traditional weaving techniques',
            'All materials provided',
            'Learn about cedar significance',
            'Take home your creation',
            'Beginner-friendly instruction'
        ],

        whatToExpect: [
            'Hands-on crafting activity',
            'Cultural teachings about cedar',
            'Personal guidance from instructor',
            'Finished bracelet to wear or gift'
        ],

        ctaText: 'Add to Cart',
        ctaUrl: null,

        available: true,
        featured: false,
        comingSoon: false,

        related: ['cedar-rope-bracelet', 'cedar-heart', 'cedar-coasters'],

        categories: ['workshops', 'hands-on', 'cedar-crafts'],
        tags: ['beginner-friendly', 'crafts'],
    },

    // ===== SERVICE 4: CEDAR ROPE BRACELET WITH BEADS =====
    'cedar-rope-bracelet': {
        id: 'cedar-rope-bracelet',
        type: 'workshop',
        category: 'hands-on',

        name: 'Cedar Rope Bracelet with Beads',
        shortName: 'Cedar Rope Bracelet',
        slug: 'cedar-rope-bracelet',
        emoji: '🪵',
        icon: 'fas fa-gem',

        description: 'Wonderfully accessible workshop perfect for all ages. Participants create a beautiful, durable cedar rope bracelet embellished with beads.',
        longDescription: `This advanced workshop combines cedar rope-making techniques with traditional beading to create stunning bracelets that honor both ancient practices. Learn the significance of beads in Indigenous culture and how they've been used for trade, ceremony, and personal adornment.

Each bead color carries meaning, and you'll choose colors that resonate with your personal journey while honoring Indigenous traditions.`,

        pricing: {
            enabled: true,
            model: 'per_person',
            currency: 'CAD',
            community: 5500,  // $55
            corporate: 7500,  // $75
            displayPrice: '$55 (Community) / $75 (Corporate)',
            priceUnit: 'per person',
        },

        duration: '2-2.5 hours',
        participants: {
            min: 8,
            max: 15,
            recommended: '8-15 people',
        },
        location: 'Your location or our studio',

        image: '/images/services/cedar rope bracelet.jpg',
        gallery: [],

        keywords: ['cedar', 'rope', 'bracelet', 'beads', 'beading'],

        highlights: [
            'Cedar rope-making skills',
            'Traditional beading techniques',
            'Choose your bead colors',
            'Cultural teachings included',
            'Unique finished piece'
        ],

        whatToExpect: [
            'More intricate crafting',
            'Fine motor skill activity',
            'Color and design choices',
            'Stories behind bead traditions'
        ],

        ctaText: 'Add to Cart',
        ctaUrl: null,

        available: true,
        featured: false,
        comingSoon: false,

        related: ['cedar-bracelet', 'cedar-heart', 'cedar-basket'],

        categories: ['workshops', 'hands-on', 'cedar-crafts'],
        tags: ['all-ages', 'beading'],
    },

    // ===== SERVICE 5: WEAVING A CEDAR HEART =====
    'cedar-heart': {
        id: 'cedar-heart',
        type: 'workshop',
        category: 'hands-on',

        name: 'Weaving a Cedar Heart',
        shortName: 'Cedar Heart',
        slug: 'cedar-heart',
        emoji: '❤️',
        icon: 'fas fa-heart',

        description: 'Participants transform respectfully harvested cedar into a beautiful, heart-shaped keepsake, embodying resilience and deep respect for the land.',
        longDescription: `The heart shape represents love, family, and the interconnectedness of all beings. In this meaningful workshop, you'll learn to weave a cedar heart that can be gifted to someone you care about or kept as a reminder of Indigenous teachings.

Perfect for special occasions, memorials, or simply as a beautiful expression of connection to the land and each other.`,

        pricing: {
            enabled: true,
            model: 'per_person',
            currency: 'CAD',
            community: 7000,
            corporate: 9500,
            displayPrice: '$70 (Community) / $95 (Corporate)',
            priceUnit: 'per person',
        },

        duration: '2 hours',
        participants: {
            min: 8,
            max: 20,
            recommended: '8-20 people',
        },
        location: 'Your location or our studio',

        image: '/images/services/cedar hearts.jpg',
        gallery: [],

        keywords: ['cedar', 'heart', 'weaving', 'gift'],

        highlights: [
            'Heart-shaped weaving',
            'Gifting traditions',
            'Symbolic meanings',
            'Beautiful finished piece',
            'Perfect for special occasions'
        ],

        whatToExpect: [
            'Meaningful crafting experience',
            'Stories about love and connection',
            'Personal reflection time',
            'Heart to give or keep'
        ],

        ctaText: 'Add to Cart',
        ctaUrl: null,

        available: true,
        featured: false,
        comingSoon: false,

        related: ['cedar-bracelet', 'cedar-rope-bracelet', 'medicine-pouch'],

        categories: ['workshops', 'hands-on', 'cedar-crafts'],
        tags: ['gifts', 'meaningful'],
    },

    // ===== SERVICE 6: HEALING THROUGH MEDICINE POUCH MAKING =====
    'medicine-pouch': {
        id: 'medicine-pouch',
        type: 'workshop',
        category: 'healing',

        name: 'Healing Through Medicine Pouch Making',
        shortName: 'Medicine Pouch',
        slug: 'medicine-pouch',
        emoji: '🫶',
        icon: 'fas fa-hand-holding-heart',

        description: 'A sacred workshop connecting participants to ancient practices of spiritual balance. Facilitators share teachings on the four sacred medicines.',
        longDescription: `Medicine pouches hold items of spiritual significance and personal power. In this deeply personal workshop, you'll create your own medicine pouch while learning about Indigenous healing traditions, sacred medicines, and the items that carry spiritual meaning.

This is a gentle, reflective practice that honors your personal healing journey while respecting Indigenous teachings about medicine and wellness.`,

        pricing: {
            enabled: true,
            model: 'per_person',
            currency: 'CAD',
            community: 7000,
            corporate: 9500,
            displayPrice: '$70 (Community) / $95 (Corporate)',
            priceUnit: 'per person',
        },

        duration: '2-2.5 hours',
        participants: {
            min: 6,
            max: 15,
            recommended: '6-15 people',
        },
        location: 'Our studio (intimate setting)',

        image: '/images/services/medicines pouches.jpg',
        gallery: [],

        keywords: ['medicine', 'pouch', 'healing', 'sacred', 'spiritual'],

        highlights: [
            'Create personal medicine pouch',
            'Learn about sacred medicines',
            'Reflection and intention-setting',
            'Respectful cultural teachings',
            'Small, intimate groups'
        ],

        whatToExpect: [
            'Quiet, contemplative space',
            'Personal reflection time',
            'Sharing circle (optional)',
            'Sacred teachings shared respectfully'
        ],

        ctaText: 'Add to Cart',
        ctaUrl: null,

        available: true,
        featured: false,
        comingSoon: false,

        related: ['cedar-heart', 'orange-shirt-day-inperson', 'mmiwg2s-inperson'],

        categories: ['workshops', 'healing', 'spiritual'],
        tags: ['intimate', 'reflective'],
    },

    // ===== SERVICE 7: ORANGE SHIRT DAY AWARENESS BEADING (IN-PERSON) =====
    'orange-shirt-day-inperson': {
        id: 'orange-shirt-day-inperson',
        type: 'workshop',
        category: 'in-person',

        name: 'Orange Shirt Day Awareness Beading - In-Person',
        shortName: 'Orange Shirt Day (In-Person)',
        slug: 'orange-shirt-day-inperson',
        emoji: '🧡',
        icon: 'fas fa-tshirt',

        description: 'A powerful session to honor residential school survivors. Participants create beaded orange shirt pins, creating a space for reflection, solidarity, and learning.',
        longDescription: `Orange Shirt Day (September 30th) honors residential school survivors and remembers the children who never came home. This workshop combines traditional beading with education about the residential school system and its ongoing impacts.

Create an orange-themed beaded piece while learning about truth and reconciliation, survivor stories, and how we can all work toward healing.`,

        pricing: {
            enabled: true,
            model: 'per_person',
            currency: 'CAD',
            community: 12000,  // $120
            corporate: 16000,  // $160
            displayPrice: '$120 (Community) / $160 (Corporate)',
            priceUnit: 'per person',
        },

        duration: '2-4 hours',
        participants: {
            min: 10,
            max: 30,
            recommended: '10-30 people',
        },
        location: 'Your location (especially meaningful in schools)',

        image: '/images/services/orange shirt.png',
        gallery: [],

        keywords: ['orange', 'shirt', 'day', 'awareness', 'beading', 'inperson', 'in-person', 'residential schools'],

        highlights: [
            'Orange-themed beadwork',
            'Residential school education',
            'Survivor stories (respectfully shared)',
            'Every Child Matters messaging',
            'Reflection and dialogue'
        ],

        whatToExpect: [
            'Emotional content',
            'Respectful learning environment',
            'Beading activity',
            'Group discussion opportunity'
        ],

        ctaText: 'Add to Cart',
        ctaUrl: null,

        available: true,
        featured: true,
        comingSoon: false,

        related: ['orange-shirt-day-virtual', 'kairos-blanket-inperson', 'mmiwg2s-inperson'],

        categories: ['workshops', 'in-person', 'education'],
        tags: ['featured', 'important', 'september-30'],
    },

    // ===== SERVICE 8: ORANGE SHIRT DAY AWARENESS BEADING (VIRTUAL) =====
    'orange-shirt-day-virtual': {
        id: 'orange-shirt-day-virtual',
        type: 'workshop',
        category: 'virtual',

        name: 'Orange Shirt Day Awareness Beading - Virtual',
        shortName: 'Orange Shirt Day (Virtual)',
        slug: 'orange-shirt-day-virtual',
        emoji: '🧡',
        icon: 'fas fa-tshirt',

        description: 'Virtual workshop honoring Orange Shirt Day through beading and education. Beading kits are mailed to participants in advance.',
        longDescription: `Join us online for this meaningful Orange Shirt Day workshop. Beading kits are mailed to participants in advance, allowing everyone to participate fully in the hands-on experience while learning about residential schools and their legacy.

This virtual format makes the workshop accessible to remote communities and individuals who want to participate from home while maintaining the integrity and impact of the teachings.`,

        pricing: {
            enabled: true,
            model: 'per_person',
            currency: 'CAD',
            community: 10500,  // $105
            corporate: 14500,  // $145
            displayPrice: '$105 (Community) / $145 (Corporate)',
            priceUnit: 'per person',
        },

        duration: '2-4 hours',
        participants: {
            min: 10,
            max: 40,
            recommended: '10-40 people',
        },
        location: 'Online via Zoom (kits mailed in advance)',

        image: '/images/services/orange shirt.png',
        gallery: [],

        keywords: ['orange', 'shirt', 'day', 'awareness', 'beading', 'virtual', 'online'],

        highlights: [
            'Beading kits mailed to you',
            'Virtual guided instruction',
            'Educational content',
            'Breakout reflection rooms',
            'Digital resources provided'
        ],

        whatToExpect: [
            'Pre-delivered materials (3-week lead time)',
            'Zoom workshop',
            'Camera-on encouraged',
            'Sensitive content handled respectfully'
        ],

        ctaText: 'Add to Cart',
        ctaUrl: null,

        available: true,
        featured: true,
        comingSoon: false,

        related: ['orange-shirt-day-inperson', 'kairos-blanket-virtual', 'mmiwg2s-virtual'],

        categories: ['workshops', 'virtual', 'education'],
        tags: ['featured', 'remote-friendly', 'september-30'],
    },

    // ===== SERVICE 9: MMIWG2S AWARENESS & REMEMBRANCE BEADING (IN-PERSON) =====
    'mmiwg2s-inperson': {
        id: 'mmiwg2s-inperson',
        type: 'workshop',
        category: 'in-person',

        name: 'MMIWG2S Awareness & Remembrance Beading - In-Person',
        shortName: 'MMIWG2S (In-Person)',
        slug: 'mmiwg2s-inperson',
        emoji: '🤝',
        icon: 'fas fa-ribbon',

        description: 'A profound act of remembrance and solidarity to honor our stolen sisters. Participants create a tribute piece and engage in vital conversation.',
        longDescription: `This sacred workshop honors Missing and Murdered Indigenous Women, Girls, and Two-Spirit (MMIWG2S) people. Through red-themed beadwork - red representing the lifeblood of our people - participants create memorial pieces while learning about this ongoing crisis.

This is a solemn and important workshop that centers Indigenous voices, honors those we've lost, and explores what we can all do to support Indigenous communities in seeking justice and healing.`,

        pricing: {
            enabled: true,
            model: 'per_person',
            currency: 'CAD',
            community: 12000,
            corporate: 16000,
            displayPrice: '$120 (Community) / $160 (Corporate)',
            priceUnit: 'per person',
        },

        duration: '2.5-4 hours',
        participants: {
            min: 10,
            max: 25,
            recommended: '10-25 people',
        },
        location: 'Your location (community centers, schools, organizations)',

        image: '/images/services/mmiwg2s.png',
        gallery: [],

        keywords: ['mmiwg2s', 'murdered', 'missing', 'women', 'girls', 'beading', 'inperson', 'in-person'],

        highlights: [
            'Red-themed memorial beadwork',
            'MMIWG2S education',
            'Honoring those lost',
            'Action and advocacy discussion',
            'Respectful ceremony and protocol'
        ],

        whatToExpect: [
            'Heavy, emotional content',
            'Sacred space held',
            'Respectful silence periods',
            'Community action opportunities'
        ],

        ctaText: 'Add to Cart',
        ctaUrl: null,

        available: true,
        featured: true,
        comingSoon: false,

        related: ['mmiwg2s-virtual', 'orange-shirt-day-inperson', 'kairos-blanket-inperson'],

        categories: ['workshops', 'in-person', 'education'],
        tags: ['featured', 'important', 'sacred'],
    },

    // ===== SERVICE 10: MMIWG2S AWARENESS & REMEMBRANCE BEADING (VIRTUAL) =====
    'mmiwg2s-virtual': {
        id: 'mmiwg2s-virtual',
        type: 'workshop',
        category: 'virtual',

        name: 'MMIWG2S Awareness & Remembrance Beading - Virtual',
        shortName: 'MMIWG2S (Virtual)',
        slug: 'mmiwg2s-virtual',
        emoji: '🤝',
        icon: 'fas fa-ribbon',

        description: 'Virtual workshop honoring MMIWG2S through beading and education. Red beading kits are sent to all participants.',
        longDescription: `Join us online to honor Missing and Murdered Indigenous Women, Girls, and Two-Spirit people through memorial beadwork. Red beading kits are sent to all participants, creating a powerful collective experience even when physically apart.

This virtual format allows people across Turtle Island to come together in remembrance and solidarity while learning how to be better allies and advocates.`,

        pricing: {
            enabled: true,
            model: 'per_person',
            currency: 'CAD',
            community: 10500,
            corporate: 14500,
            displayPrice: '$105 (Community) / $145 (Corporate)',
            priceUnit: 'per person',
        },

        duration: '2.5-4 hours',
        participants: {
            min: 10,
            max: 40,
            recommended: '10-40 people',
        },
        location: 'Online via Zoom (red beading kits mailed)',

        image: '/images/services/mmiwg2s.png',
        gallery: [],

        keywords: ['mmiwg2s', 'murdered', 'missing', 'women', 'girls', 'beading', 'virtual', 'online'],

        highlights: [
            'Red beading kits provided',
            'Virtual remembrance ceremony',
            'Educational resources',
            'Advocacy and action steps',
            'Community building'
        ],

        whatToExpect: [
            'Materials mailed in advance (3-week lead time)',
            'Sacred virtual space',
            'Camera-on for community',
            'Emotional, important content'
        ],

        ctaText: 'Add to Cart',
        ctaUrl: null,

        available: true,
        featured: true,
        comingSoon: false,

        related: ['mmiwg2s-inperson', 'orange-shirt-day-virtual', 'kairos-blanket-virtual'],

        categories: ['workshops', 'virtual', 'education'],
        tags: ['featured', 'important', 'remote-friendly'],
    },

    // ===== SERVICE 11: CEDAR WOVEN COASTERS =====
    'cedar-coasters': {
        id: 'cedar-coasters',
        type: 'workshop',
        category: 'hands-on',

        name: 'Cedar Woven Coasters',
        shortName: 'Cedar Coasters',
        slug: 'cedar-coasters',
        emoji: '☕',
        icon: 'fas fa-mug-hot',

        description: 'A perfect introduction to cedar weaving. Participants create a beautiful and functional coaster set using respectfully harvested materials.',
        longDescription: `Bring Indigenous artistry into your daily life with hand-woven cedar coasters. This practical workshop teaches circular weaving techniques while creating functional pieces that honor traditional crafts.

Each coaster becomes a conversation starter about Indigenous culture and a daily reminder of the beauty of traditional practices.`,

        pricing: {
            enabled: true,
            model: 'per_person',
            currency: 'CAD',
            community: 7000,
            corporate: 9500,
            displayPrice: '$70 (Community) / $95 (Corporate)',
            priceUnit: 'per person',
        },

        duration: '2 hours',
        participants: {
            min: 10,
            max: 25,
            recommended: '10-25 people',
        },
        location: 'Your location or our studio',

        image: '/images/services/cedar coasters.png',
        gallery: [],

        keywords: ['cedar', 'coasters', 'functional', 'weaving'],

        highlights: [
            'Make 2-4 coasters',
            'Circular weaving technique',
            'Functional home decor',
            'Great for gifts',
            'All skill levels welcome'
        ],

        whatToExpect: [
            'Repetitive, meditative practice',
            'Multiple coasters created',
            'Practical items for daily use',
            'Teachings about utility in art'
        ],

        ctaText: 'Add to Cart',
        ctaUrl: null,

        available: true,
        featured: false,
        comingSoon: false,

        related: ['cedar-bracelet', 'cedar-heart', 'cedar-basket'],

        categories: ['workshops', 'hands-on', 'cedar-crafts'],
        tags: ['beginner-friendly', 'functional', 'gifts'],
    },

    // ===== SERVICE 12: CEDAR BASKET WEAVING =====
    'cedar-basket': {
        id: 'cedar-basket',
        type: 'workshop',
        category: 'hands-on',

        name: 'Cedar Basket Weaving',
        shortName: 'Cedar Basket',
        slug: 'cedar-basket',
        emoji: '🧺',
        icon: 'fas fa-shopping-basket',

        description: 'An immersive and intensive workshop into a cherished art form. Participants learn the intricate process of creating a beautiful and functional cedar basket.',
        longDescription: `Cedar basket weaving has been practiced on the Pacific Northwest coast for thousands of years. This in-depth workshop takes you through the entire process of creating a traditional basket, from preparing cedar bark to finishing techniques.

Learn the mathematics, engineering, and artistry behind these functional pieces that have sustained Indigenous communities for generations.`,

        pricing: {
            enabled: true,
            model: 'per_person',
            currency: 'CAD',
            community: 12000,
            corporate: 16000,
            displayPrice: '$120 (Community) / $160 (Corporate)',
            priceUnit: 'per person',
        },

        duration: '3-4 hours',
        participants: {
            min: 6,
            max: 12,
            recommended: '6-12 people',
        },
        location: 'Our studio or your location',

        image: '/images/services/Cedar Baskets.jpg',
        gallery: [],

        keywords: ['cedar', 'basket', 'weaving', 'baskets', 'advanced'],

        highlights: [
            'Complete basket creation',
            'Traditional techniques',
            'Cedar preparation methods',
            'Historical context',
            'Advanced weaving skills'
        ],

        whatToExpect: [
            'Longer, immersive workshop',
            'Physical activity involved',
            'Detailed instruction',
            'Finished basket to take home'
        ],

        ctaText: 'Add to Cart',
        ctaUrl: null,

        available: true,
        featured: false,
        comingSoon: false,

        related: ['cedar-coasters', 'cedar-bracelet', 'cedar-rope-bracelet'],

        categories: ['workshops', 'hands-on', 'cedar-crafts'],
        tags: ['advanced', 'immersive', 'traditional'],
    },
};

// ===== ADDITIONAL BOOKING INFORMATION =====
// (Shared across all services - will be moved to settings or brand config)
export const BOOKING_INFO = {
    minimumParticipants: 10,
    travelFee: '$0.75/km for locations more than 25km from our operating bases (includes parking, meals, accommodations for overnight stays)',
    bookingPolicy: 'Non-refundable full payment required to confirm',
    virtualLeadTime: 'Material kits require 3-week lead time within Canada',
    contact: {
        name: 'Shona Sparrow',  // Will be replaced with brand.contact
        email: 'shona@moontidereconciliation.com',
        phone: '236-300-3005'
    },
    operatingBases: 'Douglas Lake and Vancouver, BC'
};

// ===== HELPER FUNCTIONS =====

/**
 * Get service by ID
 */
export function getService(id) {
    return services[id] || null;
}

/**
 * Get all services as array
 */
export function getAllServices() {
    return Object.values(services);
}

/**
 * Get services by type
 */
export function getServicesByType(type) {
    return Object.values(services).filter(s => s.type === type);
}

/**
 * Get services by category
 */
export function getServicesByCategory(category) {
    return Object.values(services).filter(s => s.category === category);
}

/**
 * Get featured services
 */
export function getFeaturedServices() {
    return Object.values(services).filter(s => s.featured);
}

/**
 * Get available services
 */
export function getAvailableServices() {
    return Object.values(services).filter(s => s.available);
}

/**
 * Search services by keyword
 */
export function searchServices(query) {
    const lowerQuery = query.toLowerCase();
    return Object.values(services).filter(service => {
        return (
            service.name.toLowerCase().includes(lowerQuery) ||
            service.description.toLowerCase().includes(lowerQuery) ||
            service.keywords.some(k => k.includes(lowerQuery))
        );
    });
}

// Export default
export default services;

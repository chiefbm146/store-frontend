/**
 * Workshop Data - Central repository for all Moon Tide workshops
 * This data is used by workshop-detail pages to display workshop information
 * Updated with comprehensive information from main.py
 */

const workshopData = {
    'cedar-bracelet': {
        id: 'cedar-bracelet',
        title: 'Cedar Woven Bracelet',
        type: 'Hands-On',
        icon: 'fas fa-ring',
        image: '/images/services/cedar bracelets.jpg',
        description: 'An intricate, hands-on workshop focused on detailed artisan work. Participants learn the timeless art of cedar weaving.',
        longDescription: `Cedar has been used by Indigenous peoples of the Pacific Northwest for thousands of years. In this hands-on workshop, you'll learn traditional weaving techniques passed down through generations while creating a personal cedar bracelet to take home.

Connect with the sacred cedar tree and understand its significance in Coast Salish culture. Each bracelet becomes a wearable reminder of Indigenous wisdom and your connection to the land.`,
        duration: '1.5-2 hours',
        participants: '8-20 people',
        location: 'Your location or our studio',
        price: 'Corporate: $95/person | Community: $70/person',
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
        ]
    },
    'cedar-rope-bracelet': {
        id: 'cedar-rope-bracelet',
        title: 'Cedar Rope Bracelet with Beads',
        type: 'Hands-On',
        icon: 'fas fa-gem',
        image: '/images/services/cedar rope bracelet.jpg',
        description: 'Wonderfully accessible workshop perfect for all ages. Participants create a beautiful, durable cedar rope bracelet embellished with beads.',
        longDescription: `This advanced workshop combines cedar rope-making techniques with traditional beading to create stunning bracelets that honor both ancient practices. Learn the significance of beads in Indigenous culture and how they've been used for trade, ceremony, and personal adornment.

Each bead color carries meaning, and you'll choose colors that resonate with your personal journey while honoring Indigenous traditions.`,
        duration: '2-2.5 hours',
        participants: '8-15 people',
        location: 'Your location or our studio',
        price: 'Corporate: $75/person | Community: $55/person',
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
        ]
    },
    'cedar-heart': {
        id: 'cedar-heart',
        title: 'Weaving a Cedar Heart',
        type: 'Hands-On',
        icon: 'fas fa-heart',
        image: '/images/services/cedar hearts.jpg',
        description: 'Participants transform respectfully harvested cedar into a beautiful, heart-shaped keepsake, embodying resilience and deep respect for the land.',
        longDescription: `The heart shape represents love, family, and the interconnectedness of all beings. In this meaningful workshop, you'll learn to weave a cedar heart that can be gifted to someone you care about or kept as a reminder of Indigenous teachings.

Perfect for special occasions, memorials, or simply as a beautiful expression of connection to the land and each other.`,
        duration: '2 hours',
        participants: '8-20 people',
        location: 'Your location or our studio',
        price: 'Corporate: $95/person | Community: $70/person',
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
        ]
    },
    'medicine-pouch': {
        id: 'medicine-pouch',
        title: 'Healing Through Medicine Pouch Making',
        type: 'Healing',
        icon: 'fas fa-hand-holding-heart',
        image: '/images/services/medicines pouches.jpg',
        description: 'A sacred workshop connecting participants to ancient practices of spiritual balance. Facilitators share teachings on the four sacred medicines.',
        longDescription: `Medicine pouches hold items of spiritual significance and personal power. In this deeply personal workshop, you'll create your own medicine pouch while learning about Indigenous healing traditions, sacred medicines, and the items that carry spiritual meaning.

This is a gentle, reflective practice that honors your personal healing journey while respecting Indigenous teachings about medicine and wellness.`,
        duration: '2-2.5 hours',
        participants: '6-15 people',
        location: 'Our studio (intimate setting)',
        price: 'Corporate: $95/person | Community: $70/person',
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
        ]
    },
    'orange-shirt-day-inperson': {
        id: 'orange-shirt-day-inperson',
        title: 'Orange Shirt Day Awareness Beading',
        type: 'In-Person',
        icon: 'fas fa-tshirt',
        image: '/images/services/orange shirt.png',
        description: 'A powerful session to honor residential school survivors. Participants create beaded orange shirt pins, creating a space for reflection, solidarity, and learning.',
        longDescription: `Orange Shirt Day (September 30th) honors residential school survivors and remembers the children who never came home. This workshop combines traditional beading with education about the residential school system and its ongoing impacts.

Create an orange-themed beaded piece while learning about truth and reconciliation, survivor stories, and how we can all work toward healing.`,
        duration: '2-4 hours',
        participants: '10-30 people',
        location: 'Your location (especially meaningful in schools)',
        price: 'Corporate: $160/person | Community: $120/person',
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
        ]
    },
    'orange-shirt-day-virtual': {
        id: 'orange-shirt-day-virtual',
        title: 'Orange Shirt Day Awareness Beading',
        type: 'Virtual',
        icon: 'fas fa-tshirt',
        image: '/images/services/orange shirt.png',
        description: 'Virtual workshop honoring Orange Shirt Day through beading and education. Beading kits are mailed to participants in advance.',
        longDescription: `Join us online for this meaningful Orange Shirt Day workshop. Beading kits are mailed to participants in advance, allowing everyone to participate fully in the hands-on experience while learning about residential schools and their legacy.

This virtual format makes the workshop accessible to remote communities and individuals who want to participate from home while maintaining the integrity and impact of the teachings.`,
        duration: '2-4 hours',
        participants: '10-40 people',
        location: 'Online via Zoom (kits mailed in advance)',
        price: 'Corporate: $145/person | Community: $105/person',
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
        ]
    },
    'mmiwg2s-inperson': {
        id: 'mmiwg2s-inperson',
        title: 'MMIWG2S Awareness & Remembrance Beading',
        type: 'In-Person',
        icon: 'fas fa-ribbon',
        image: '/images/services/mmiwg2s.png',
        description: 'A profound act of remembrance and solidarity to honor our stolen sisters. Participants create a tribute piece and engage in vital conversation.',
        longDescription: `This sacred workshop honors Missing and Murdered Indigenous Women, Girls, and Two-Spirit (MMIWG2S) people. Through red-themed beadwork - red representing the lifeblood of our people - participants create memorial pieces while learning about this ongoing crisis.

This is a solemn and important workshop that centers Indigenous voices, honors those we've lost, and explores what we can all do to support Indigenous communities in seeking justice and healing.`,
        duration: '2.5-4 hours',
        participants: '10-25 people',
        location: 'Your location (community centers, schools, organizations)',
        price: 'Corporate: $160/person | Community: $120/person',
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
        ]
    },
    'mmiwg2s-virtual': {
        id: 'mmiwg2s-virtual',
        title: 'MMIWG2S Awareness & Remembrance Beading',
        type: 'Virtual',
        icon: 'fas fa-ribbon',
        image: '/images/services/mmiwg2s.png',
        description: 'Virtual workshop honoring MMIWG2S through beading and education. Red beading kits are sent to all participants.',
        longDescription: `Join us online to honor Missing and Murdered Indigenous Women, Girls, and Two-Spirit people through memorial beadwork. Red beading kits are sent to all participants, creating a powerful collective experience even when physically apart.

This virtual format allows people across Turtle Island to come together in remembrance and solidarity while learning how to be better allies and advocates.`,
        duration: '2.5-4 hours',
        participants: '10-40 people',
        location: 'Online via Zoom (red beading kits mailed)',
        price: 'Corporate: $145/person | Community: $105/person',
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
        ]
    },
    'cedar-coasters': {
        id: 'cedar-coasters',
        title: 'Cedar Woven Coasters',
        type: 'Hands-On',
        icon: 'fas fa-mug-hot',
        image: '/images/services/cedar coasters.png',
        description: 'A perfect introduction to cedar weaving. Participants create a beautiful and functional coaster set using respectfully harvested materials.',
        longDescription: `Bring Indigenous artistry into your daily life with hand-woven cedar coasters. This practical workshop teaches circular weaving techniques while creating functional pieces that honor traditional crafts.

Each coaster becomes a conversation starter about Indigenous culture and a daily reminder of the beauty of traditional practices.`,
        duration: '2 hours',
        participants: '10-25 people',
        location: 'Your location or our studio',
        price: 'Corporate: $95/person | Community: $70/person',
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
        ]
    },
    'cedar-basket': {
        id: 'cedar-basket',
        title: 'Cedar Basket Weaving',
        type: 'Hands-On',
        icon: 'fas fa-shopping-basket',
        image: '/images/services/Cedar Baskets.jpg',
        description: 'An immersive and intensive workshop into a cherished art form. Participants learn the intricate process of creating a beautiful and functional cedar basket.',
        longDescription: `Cedar basket weaving has been practiced on the Pacific Northwest coast for thousands of years. This in-depth workshop takes you through the entire process of creating a traditional basket, from preparing cedar bark to finishing techniques.

Learn the mathematics, engineering, and artistry behind these functional pieces that have sustained Indigenous communities for generations.`,
        duration: '3-4 hours',
        participants: '6-12 people',
        location: 'Our studio or your location',
        price: 'Corporate: $160/person | Community: $120/person',
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
        ]
    },
    'kairos-blanket-inperson': {
        id: 'kairos-blanket-inperson',
        title: 'Kairos Blanket Exercise',
        type: 'In-Person',
        icon: 'fas fa-users',
        image: '/images/services/kairos in person.jpg',
        description: 'A powerful interactive experience exploring the history of Indigenous peoples in Canada. In partnership with Kairos Canada, this session uses blankets to physically represent the land and historical events.',
        longDescription: `The KAIROS Blanket Exercise is a powerful experiential learning tool that teaches the Indigenous rights history most Canadians never learned. Developed in response to the Report of the Royal Commission on Aboriginal Peoples in 1996, the exercise has been experienced by more than 350,000 Canadians.

Through this participatory workshop, you will walk through pre-contact, treaty-making, colonization and resistance. The experience fosters truth, understanding, respect and reconciliation among Indigenous and non-Indigenous peoples. Begins with a grounding song or prayer from an Elder.`,
        duration: '2-3 hours',
        participants: '15-50 people',
        location: 'Your location (we travel to you)',
        price: 'Corporate: $375/person | Community: $225/person',
        highlights: [
            'Interactive group experience',
            'Facilitated by trained Indigenous educators',
            'Explores 500+ years of Indigenous-settler relations',
            'Includes post-exercise sharing circle',
            'Certificate of participation provided',
            'Opening song/prayer by Elder'
        ],
        whatToExpect: [
            'Physical activity (standing, walking)',
            'Emotional journey through history',
            'Group discussion and reflection',
            'Opportunities for questions and dialogue'
        ]
    },
    'kairos-blanket-virtual': {
        id: 'kairos-blanket-virtual',
        title: 'Kairos Blanket Exercise',
        type: 'Virtual',
        icon: 'fas fa-video',
        image: '/images/services/kairos virtual.png',
        description: 'Live online version of the Kairos Blanket Exercise, facilitated in partnership with Kairos Canada, grounded with an opening song by an Elder.',
        longDescription: `Adapted for online delivery, the Virtual KAIROS Blanket Exercise brings the same powerful learning experience to participants joining from different locations. Through innovative facilitation techniques, we create an immersive virtual environment that honors the integrity of the original exercise.

Perfect for remote teams, distributed organizations, or those unable to gather in person, this virtual version maintains the emotional impact and educational value of the in-person experience.`,
        duration: '2-3 hours',
        participants: '10-40 people',
        location: 'Online via Zoom',
        price: 'Corporate: $375/person | Community: $225/person',
        highlights: [
            'Adapted for virtual engagement',
            'Interactive Zoom experience',
            'Breakout rooms for reflection',
            'Digital resources included',
            'Accessible from anywhere',
            'Opening song by Elder'
        ],
        whatToExpect: [
            'Zoom meeting link provided',
            'Interactive participation required',
            'Camera-on engagement encouraged',
            'Digital workbook materials'
        ]
    }
};

// Additional booking information (displayed on all workshop pages)
export const BOOKING_INFO = {
    minimumParticipants: 10,
    travelFee: '$0.75/km for locations more than 25km from our operating bases (includes parking, meals, accommodations for overnight stays)',
    bookingPolicy: 'Non-refundable full payment required to confirm',
    virtualLeadTime: 'Material kits require 3-week lead time within Canada',
    contact: {
        name: 'Shona Sparrow',
        email: 'shona@moontidereconciliation.com',
        phone: '236-300-3005'
    },
    operatingBases: 'Douglas Lake and Vancouver, BC'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = workshopData;
}

export default workshopData;

// Category-smart onboarding templates
// Each major category has recommended capabilities and contextual questions

export interface CapabilityTemplate {
  id: string;
  label: string;
  recommended?: boolean;
}

export interface ContextualQuestion {
  question: string;
  type: 'yes_no' | 'single_choice' | 'multi_choice';
  yes_adds?: string[];
  no_adds?: string[];
  options?: {
    label: string;
    adds: string[];
  }[];
}

export interface CategoryTemplate {
  major_category: string;
  icon: string;
  default_subcategory: string;
  subcategories: string[];
  recommended_capabilities: string[];
  contextual_questions?: ContextualQuestion[];
}

export const CATEGORY_TEMPLATES: Record<string, CategoryTemplate> = {
  'mobile': {
    major_category: 'Mobile, Electronics & Computers',
    icon: '📱',
    default_subcategory: 'Mobile store',
    subcategories: [
      'Mobile store',
      'Mobile repair & accessories',
      'Electronics showroom',
      'Computer/laptop store',
      'Computer repair',
      'CCTV & security systems'
    ],
    recommended_capabilities: [
      'smartphones',
      'tempered_glass',
      'back_cover',
      'chargers_cables',
      'headphones_earphones'
    ],
    contextual_questions: [
      {
        question: 'Do you repair phones?',
        type: 'yes_no',
        yes_adds: ['screen_replacement', 'battery_replacement', 'charging_port_repair']
      }
    ]
  },
  
  'kirana': {
    major_category: 'Kirana & Provision Stores',
    icon: '🛒',
    default_subcategory: 'Kirana (traditional)',
    subcategories: [
      'Kirana (traditional)',
      'Supermarket / mini-mart',
      'Organic/health food store',
      'Dairy & milk booth'
    ],
    recommended_capabilities: [
      'staple_groceries',
      'packaged_snacks',
      'dairy_products',
      'household_items',
      'beverages'
    ],
    contextual_questions: [
      {
        question: 'Do you keep fresh vegetables?',
        type: 'yes_no',
        yes_adds: ['fresh_vegetables']
      },
      {
        question: 'Home delivery available?',
        type: 'yes_no',
        yes_adds: []
      }
    ]
  },

  'fruits_vegetables': {
    major_category: 'Fruits & Vegetables',
    icon: '🥬',
    default_subcategory: 'Vegetable shop',
    subcategories: [
      'Vegetable shop',
      'Fruit shop',
      'Push-cart vendor',
      'Organic vegetables'
    ],
    recommended_capabilities: [
      'leafy_vegetables',
      'root_vegetables',
      'seasonal_vegetables',
      'common_fruits',
      'seasonal_fruits'
    ]
  },

  'meat_fish': {
    major_category: 'Meat, Fish & Eggs',
    icon: '🍗',
    default_subcategory: 'Chicken/mutton shop',
    subcategories: [
      'Chicken/mutton shop',
      'Fish shop',
      'Egg center',
      'Cold meat shop'
    ],
    recommended_capabilities: [
      'fresh_chicken',
      'chicken_cuts',
      'mutton_goat',
      'mutton_cuts'
    ],
    contextual_questions: [
      {
        question: 'What do you sell?',
        type: 'single_choice',
        options: [
          { label: 'Fresh meat only', adds: ['fresh_chicken', 'mutton_goat'] },
          { label: 'Frozen meat only', adds: ['frozen_meat'] },
          { label: 'Both fresh and frozen', adds: ['fresh_chicken', 'mutton_goat', 'frozen_meat'] }
        ]
      },
      {
        question: 'Halal certified?',
        type: 'yes_no',
        yes_adds: ['halal_certified']
      }
    ]
  },

  'bakery': {
    major_category: 'Bakery, Sweets & Snacks',
    icon: '🥐',
    default_subcategory: 'Bakery',
    subcategories: [
      'Bakery',
      'Sweet shop / mithai',
      'Namkeen/snacks shop',
      'Cake shop',
      'Ice-cream parlour'
    ],
    recommended_capabilities: [
      'bread_buns',
      'puffs_patties',
      'cakes_pastries',
      'cookies_biscuits'
    ],
    contextual_questions: [
      {
        question: 'Do you take custom cake orders?',
        type: 'yes_no',
        yes_adds: ['custom_cakes', 'birthday_cakes']
      }
    ]
  },

  'restaurant': {
    major_category: 'Restaurants, Cafes & Juices',
    icon: '🍽️',
    default_subcategory: 'Restaurant',
    subcategories: [
      'Restaurant',
      'Fast food',
      'Cafe',
      'Tea shop',
      'Juice shop',
      'Shawarma roll centre',
      'Dosa corner'
    ],
    recommended_capabilities: [
      'veg_dishes',
      'non_veg_dishes',
      'dine_in',
      'takeaway',
      'home_delivery'
    ],
    contextual_questions: [
      {
        question: 'What cuisine do you serve?',
        type: 'multi_choice',
        options: [
          { label: 'North Indian', adds: ['north_indian'] },
          { label: 'South Indian', adds: ['south_indian'] },
          { label: 'Chinese', adds: ['chinese'] }
        ]
      }
    ]
  },

  'pharmacy': {
    major_category: 'Pharmacy & Medical',
    icon: '💊',
    default_subcategory: 'Medical shop',
    subcategories: [
      'Medical shop',
      'Clinic',
      'Diagnostic lab',
      'Optical store',
      'Surgical supplies'
    ],
    recommended_capabilities: [
      'prescription_medicines',
      'otc_medicines',
      'health_supplements',
      'medical_devices'
    ],
    contextual_questions: [
      {
        question: 'Do you offer home delivery?',
        type: 'yes_no',
        yes_adds: ['home_delivery']
      }
    ]
  },

  'fashion': {
    major_category: 'Fashion & Apparel',
    icon: '👗',
    default_subcategory: "Men's wear",
    subcategories: [
      "Men's wear",
      "Women's wear",
      "Kids wear",
      "Saree shop",
      "Readymade garments",
      "Innerwear",
      "Boutique"
    ],
    recommended_capabilities: [
      'formal_wear',
      'casual_wear',
      'ethnic_wear',
      'winter_wear'
    ]
  },

  'hardware': {
    major_category: 'Hardware, Paint & Building Materials',
    icon: '🔧',
    default_subcategory: 'Hardware store',
    subcategories: [
      'Hardware store',
      'Electricals',
      'Plumbing',
      'Paint shop',
      'Sanitary ware',
      'Plywood & wood works',
      'Tiles & granite'
    ],
    recommended_capabilities: [
      'electrical_items',
      'plumbing_items',
      'tools_equipment',
      'door_locks'
    ]
  },

  'automotive': {
    major_category: 'Automotive – Sales & Service',
    icon: '🚗',
    default_subcategory: '2-wheeler repair',
    subcategories: [
      'Two-wheeler showroom',
      '2-wheeler repair',
      '4-wheeler workshop',
      'Car dealer',
      'Puncture shop',
      'Tyre shop',
      'Battery shop',
      'Spare-parts shop'
    ],
    recommended_capabilities: [
      'general_service',
      'oil_change',
      'brake_service',
      'puncture_repair'
    ]
  },

  'beauty': {
    major_category: 'Beauty, Salon & Bridal',
    icon: '💇',
    default_subcategory: 'Beauty parlour',
    subcategories: [
      'Beauty parlour',
      'Gents salon',
      'Spa',
      'Bridal studio',
      'Unisex salon'
    ],
    recommended_capabilities: [
      'haircut',
      'hair_styling',
      'facial',
      'makeup'
    ]
  }
};

// Helper to get template by major category
export const getCategoryTemplate = (majorCategory: string): CategoryTemplate | undefined => {
  const key = Object.keys(CATEGORY_TEMPLATES).find(
    k => CATEGORY_TEMPLATES[k].major_category === majorCategory
  );
  return key ? CATEGORY_TEMPLATES[key] : undefined;
};

// Get all major categories for selection
export const getAllMajorCategories = () => {
  return Object.values(CATEGORY_TEMPLATES).map(t => ({
    name: t.major_category,
    icon: t.icon
  }));
};

// Emoji for a category name. Exact names first, then keyword matching for descriptive names
// like "Dairy – Milk" or "Fresh Fruits".
const EXACT: Record<string, string> = {
  beverages: '🥤',
  dairy: '🥛',
  'dairy & bakery': '🥛',
  bakery: '🍞',
  snacks: '🍿',
  'chips & wafers': '🥔',
  'bhujia & mixtures': '🥜',
  'namkeen snacks': '🥨',
  nachos: '🌮',
  'healthy snacks': '🥗',
  groceries: '🛒',
  'groceries & staples': '🛒',
  staples: '🌾',
  fruits: '🍎',
  vegetables: '🥕',
  'fresh produce': '🥬',
  produce: '🥬',
  meat: '🥩',
  seafood: '🐟',
  frozen: '🧊',
  'personal care': '🧴',
  household: '🧽',
  'home care': '🧽',
  'baby care': '👶',
  health: '💊',
  electronics: '📱',
};

const KEYWORDS: [string, string][] = [
  ['egg', '🥚'], ['milk', '🥛'], ['dairy', '🧀'], ['bread', '🍞'], ['bakery', '🥐'],
  ['biscuit', '🍪'], ['chocolate', '🍫'], ['snack', '🍿'], ['namkeen', '🥨'], ['fruit', '🍎'],
  ['vegetable', '🥕'], ['herb', '🌿'], ['rice', '🍚'], ['pulse', '🫘'], ['wheat', '🌾'],
  ['millet', '🌾'], ['oil', '🫒'], ['spice', '🌶️'], ['sugar', '🍬'], ['salt', '🧂'],
  ['coffee', '☕'], ['tea', '🍵'], ['drink', '🥤'], ['juice', '🧃'], ['water', '💧'],
  ['pasta', '🍜'], ['noodle', '🍜'], ['sauce', '🍅'], ['meat', '🥩'], ['fish', '🐟'],
  ['frozen', '🧊'], ['ice cream', '🍨'], ['baby', '👶'], ['soap', '🧼'], ['shampoo', '🧴'],
  ['hair', '💇'], ['oral', '🪥'], ['skin', '🧴'], ['laundry', '🧺'], ['dish', '🧽'],
  ['clean', '🧽'], ['medicine', '💊'], ['pet', '🐾'],
];

export function getCategoryIcon(categoryName?: string | null): string {
  if (!categoryName) return '🛍️';
  const lower = categoryName.toLowerCase();
  if (EXACT[lower]) return EXACT[lower];
  const match = KEYWORDS.find(([keyword]) => lower.includes(keyword));
  return match ? match[1] : '🛍️';
}

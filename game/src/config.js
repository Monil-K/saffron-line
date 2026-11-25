// Every tunable number and the static content of the night kitchen lives here:
// the ingredients, the four house dishes, where each station stands and how the
// service clock ramps up.

export const VIEW = { width: 1280, height: 800 };

export const NIGHT_SECONDS = 185;
export const CARRY_LIMIT = 4;
export const CHEF_SPEED = 272;
export const USE_RANGE = 78;

export const COUNTER = { x: 40, y: 300, w: 1200, h: 128 };
export const FLOOR = { x: 34, y: 430, w: 1212, h: 356 };

// Raw ingredients: kind names are what recipes ask for and what the bins hold.
export const INGREDIENTS = {
  emberroot: {
    name: 'Emberroot', hue: '#e2703c', shade: '#9c3f1b', light: '#f6a25f',
    blush: '#f7c98d', bin: 'Emberroot',
  },
  glasspea: {
    name: 'Glasspea', hue: '#7fc06a', shade: '#3d7440', light: '#c0e58a',
    blush: '#e8f5bd', bin: 'Glasspea',
  },
  sunpetal: {
    name: 'Sunpetal', hue: '#efc352', shade: '#ad7f22', light: '#ffe08a',
    blush: '#fff0bb', bin: 'Sunpetal',
  },
  cloudcap: {
    name: 'Cloudcap', hue: '#cbb69f', shade: '#836d59', light: '#eadbc6',
    blush: '#f7ecdc', bin: 'Cloudcap',
  },
};

// A recipe is a set of cooked ingredients that plate into one dish. Dishes with
// three parts pay more; the two-part ones are the quick tickets of a rush.
export const RECIPES = {
  ember_noodles: {
    id: 'ember_noodles',
    name: 'Emberroot Noodles',
    items: ['emberroot', 'glasspea'],
    value: 14,
    tint: '#d8752f',
    note: 'slippery, smoky',
  },
  glass_dumplings: {
    id: 'glass_dumplings',
    name: 'Glasspea Dumplings',
    items: ['glasspea', 'cloudcap'],
    value: 16,
    tint: '#6fae58',
    note: 'pleated and bright',
  },
  cloud_skewers: {
    id: 'cloud_skewers',
    name: 'Cloudcap Skewers',
    items: ['cloudcap', 'sunpetal'],
    value: 15,
    tint: '#d9a94a',
    note: 'charred at the edge',
  },
  sun_broth: {
    id: 'sun_broth',
    name: 'Sunpetal Broth',
    items: ['sunpetal', 'emberroot', 'cloudcap'],
    value: 21,
    tint: '#e0a63c',
    note: 'deep and golden',
  },
};

export const RECIPE_LIST = Object.values(RECIPES);

// Stations stand on the pass counter, in the order a dish travels: bins, board,
// stove, plating, the pass. Each has a spot on the floor where the chef works it.
export const STATIONS = [
  { id: 'bin_emberroot', type: 'bin', ingredient: 'emberroot', x: 66, y: 312, w: 84, h: 108 },
  { id: 'bin_glasspea', type: 'bin', ingredient: 'glasspea', x: 158, y: 312, w: 84, h: 108 },
  { id: 'bin_sunpetal', type: 'bin', ingredient: 'sunpetal', x: 250, y: 312, w: 84, h: 108 },
  { id: 'bin_cloudcap', type: 'bin', ingredient: 'cloudcap', x: 342, y: 312, w: 84, h: 108 },
  { id: 'board', type: 'board', x: 466, y: 330, w: 150, h: 86 },
  { id: 'stove', type: 'stove', x: 656, y: 316, w: 214, h: 106 },
  { id: 'plating', type: 'plating', x: 912, y: 320, w: 158, h: 102 },
  { id: 'pass', type: 'pass', x: 1108, y: 306, w: 122, h: 116 },
];

// Where the chef's feet must be to use each station: just in front of it.
for (const station of STATIONS) {
  station.usePoint = { x: station.x + station.w / 2, y: COUNTER.y + COUNTER.h + 44 };
  station.label = STATION_LABELS[station.type];
}

function STATION_LABELS(type) {
  return {
    bin: 'Bin',
    board: 'Cutting board',
    stove: 'Stove',
    plating: 'Plating',
    pass: 'The pass',
  }[type];
}

// Two burners: the left and right pan each keep their own timer.
export const BURNERS = [
  { id: 'left', x: 700, y: 358 },
  { id: 'right', x: 828, y: 358 },
];

// Cooking: a pan fills, then the food turns gold inside the ready window, then
// it scorches. Times are seconds since the pan was filled.
export const PAN = {
  underdone: 2.1,
  readyFrom: 2.6,
  readyTo: 4.9,
  burntAt: 6.4,
  clean: 2.2, // seconds a scorched pan takes to be scraped out on its own
};

export const SERVICE = {
  openingOrders: 3,
  firstOrderDelay: 3.4,
  spawnFrom: 9.5,
  spawnTo: 4.2,
  maxTickets: 5,
  patienceFrom: 54,
  patienceTo: 41,
  comboWindow: 9,
  comboMax: 4,
};

export const PALETTE = {
  ink: '#1d1512',
  paper: '#f4e7cd',
  paperShade: '#e2cfa9',
  brass: '#c9932f',
  copper: '#b4622f',
  wood: '#5b3a24',
  woodLight: '#7a5033',
  woodDark: '#3d2617',
  tile: '#2c3a37',
  tileLine: '#1e2a28',
  cream: '#f8ecd2',
  ember: '#ff8a3d',
  red: '#e0503a',
  green: '#7fbf6a',
  floor: '#241a16',
  floorLine: '#2e2320',
};

export const SHOT_NAMES = ['1-cover', '2-plating', '3-the-pass', '4-rush'];

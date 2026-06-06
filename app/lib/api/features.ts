export interface Feature {
  id: string;
  name: string;
  description: string;
  viewed: boolean;
  releaseDate: string;
}

const VIEWED_FEATURES_KEY = 'supercode:viewedFeatures';
const FEATURE_CATALOG_KEY = 'supercode:featureCatalog';

const DEFAULT_FEATURES: Omit<Feature, 'viewed'>[] = [
  {
    id: 'feature-1',
    name: 'Dark Mode',
    description: 'Enable dark mode for better night viewing',
    releaseDate: '2024-03-15',
  },
  {
    id: 'feature-2',
    name: 'Tab Management',
    description: 'Customize your tab layout',
    releaseDate: '2024-03-20',
  },
];

function readViewedIds(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(VIEWED_FEATURES_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeViewedIds(ids: Set<string>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(VIEWED_FEATURES_KEY, JSON.stringify([...ids]));
  } catch (error) {
    console.error('Failed to persist viewed features:', error);
  }
}

function readCatalog(): Omit<Feature, 'viewed'>[] {
  if (typeof window === 'undefined') {
    return DEFAULT_FEATURES;
  }

  try {
    const raw = window.localStorage.getItem(FEATURE_CATALOG_KEY);

    if (!raw) {
      return DEFAULT_FEATURES;
    }

    const parsed = JSON.parse(raw) as Omit<Feature, 'viewed'>[];

    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_FEATURES;
  } catch {
    return DEFAULT_FEATURES;
  }
}

export const getFeatureFlags = async (): Promise<Feature[]> => {
  const catalog = readCatalog();
  const viewed = readViewedIds();

  return catalog.map((feature) => ({ ...feature, viewed: viewed.has(feature.id) }));
};

export const markFeatureViewed = async (featureId: string): Promise<void> => {
  const viewed = readViewedIds();

  if (viewed.has(featureId)) {
    return;
  }

  viewed.add(featureId);
  writeViewedIds(viewed);
};

export const resetFeatureViews = async (): Promise<void> => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(VIEWED_FEATURES_KEY);
};

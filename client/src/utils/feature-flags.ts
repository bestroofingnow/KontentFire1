import { useLocalStorage } from '@/hooks/use-local-storage';

/**
 * Interface for feature flag definitions
 */
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  defaultValue: boolean;
  group?: string;
}

/**
 * Feature flag groups for organizational purposes
 */
export enum FeatureFlagGroup {
  CORE = 'Core Features',
  EXPERIMENTAL = 'Experimental Features',
  PERFORMANCE = 'Performance Optimizations',
  UI = 'UI Improvements',
}

/**
 * Definition of all feature flags in the application
 */
export const FEATURE_FLAGS: FeatureFlag[] = [
  {
    id: 'advanced-content-pipeline',
    name: 'Advanced Content Pipeline',
    description: 'Enable multi-stage content pipeline with review workflows',
    defaultValue: true,
    group: FeatureFlagGroup.CORE,
  },
  {
    id: 'ai-assisted-editing',
    name: 'AI-Assisted Editing',
    description: 'Enable AI suggestions during content editing',
    defaultValue: true,
    group: FeatureFlagGroup.CORE,
  },
  {
    id: 'websocket-notifications',
    name: 'WebSocket Notifications',
    description: 'Enable real-time notifications via WebSockets',
    defaultValue: true,
    group: FeatureFlagGroup.CORE,
  },
  {
    id: 'experimental-templates',
    name: 'Experimental Templates',
    description: 'Enable access to experimental content templates',
    defaultValue: false,
    group: FeatureFlagGroup.EXPERIMENTAL,
  },
  {
    id: 'beta-analytics',
    name: 'Enhanced Analytics',
    description: 'Enable beta analytics dashboard with advanced metrics',
    defaultValue: false,
    group: FeatureFlagGroup.EXPERIMENTAL,
  },
  {
    id: 'content-versioning',
    name: 'Content Versioning',
    description: 'Enable version history for content items',
    defaultValue: true,
    group: FeatureFlagGroup.CORE,
  },
  {
    id: 'lazy-loading',
    name: 'Lazy Loading',
    description: 'Enable lazy loading for improved performance',
    defaultValue: true,
    group: FeatureFlagGroup.PERFORMANCE,
  },
  {
    id: 'code-splitting',
    name: 'Code Splitting',
    description: 'Enable code splitting for improved performance',
    defaultValue: true,
    group: FeatureFlagGroup.PERFORMANCE,
  },
  {
    id: 'new-ui',
    name: 'New UI',
    description: 'Enable the new UI design',
    defaultValue: true,
    group: FeatureFlagGroup.UI,
  },
];

/**
 * Local storage key for feature flags
 */
const FEATURE_FLAGS_STORAGE_KEY = 'kontent-fire-feature-flags';

/**
 * Hook to use a feature flag
 * 
 * @param flagId The ID of the feature flag
 * @returns Whether the feature is enabled
 * 
 * @example
 * const isNewUiEnabled = useFeatureFlag('new-ui');
 * 
 * return (
 *   <div>
 *     {isNewUiEnabled ? <NewUI /> : <OldUI />}
 *   </div>
 * );
 */
export function useFeatureFlag(flagId: string): boolean {
  const flag = FEATURE_FLAGS.find(f => f.id === flagId);
  
  if (!flag) {
    console.warn(`Feature flag ${flagId} does not exist`);
    return false;
  }
  
  const [flags] = useLocalStorage<Record<string, boolean>>(
    FEATURE_FLAGS_STORAGE_KEY,
    {}
  );
  
  // Return the flag value from local storage, or the default value if not set
  return flags[flagId] ?? flag.defaultValue;
}

/**
 * Hook to manage all feature flags
 * 
 * @returns Object with flags, setFlag, resetFlags, and resetFlag functions
 * 
 * @example
 * const { flags, setFlag, resetFlags } = useFeatureFlags();
 * 
 * return (
 *   <div>
 *     <h1>Feature Flags</h1>
 *     {FEATURE_FLAGS.map(flag => (
 *       <div key={flag.id}>
 *         <label>
 *           <input
 *             type="checkbox"
 *             checked={flags[flag.id] ?? flag.defaultValue}
 *             onChange={e => setFlag(flag.id, e.target.checked)}
 *           />
 *           {flag.name}
 *         </label>
 *         <p>{flag.description}</p>
 *       </div>
 *     ))}
 *     <button onClick={resetFlags}>Reset All</button>
 *   </div>
 * );
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useLocalStorage<Record<string, boolean>>(
    FEATURE_FLAGS_STORAGE_KEY,
    {}
  );
  
  // Set a specific flag
  const setFlag = (flagId: string, value: boolean) => {
    setFlags(prev => ({
      ...prev,
      [flagId]: value,
    }));
  };
  
  // Reset all flags to their default values
  const resetFlags = () => {
    setFlags({});
  };
  
  // Reset a specific flag to its default value
  const resetFlag = (flagId: string) => {
    setFlags(prev => {
      const newFlags = { ...prev };
      delete newFlags[flagId];
      return newFlags;
    });
  };
  
  return { flags, setFlag, resetFlags, resetFlag };
}

/**
 * Utility to check if a feature is enabled in a non-React context
 * 
 * @param flagId The ID of the feature flag
 * @returns Whether the feature is enabled
 * 
 * @example
 * if (isFeatureEnabled('experimental-templates')) {
 *   // Do something with experimental templates
 * }
 */
export function isFeatureEnabled(flagId: string): boolean {
  const flag = FEATURE_FLAGS.find(f => f.id === flagId);
  
  if (!flag) {
    console.warn(`Feature flag ${flagId} does not exist`);
    return false;
  }
  
  try {
    // Get flags from local storage
    const flagsStr = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
    const flags = flagsStr ? JSON.parse(flagsStr) : {};
    
    // Return the flag value from local storage, or the default value if not set
    return flags[flagId] ?? flag.defaultValue;
  } catch (e) {
    // If there's an error (e.g., localStorage not available), return the default value
    return flag.defaultValue;
  }
}
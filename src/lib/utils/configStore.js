
import { writable, get } from 'svelte/store';


// Create stores
export const config = writable({
  quick_save_side: 'right',
  theme: 'dark',
  tags: []
});

// Load config from Rust backend
export async function loadConfig() {
  try {
    config.set(cfg);
  } catch (error) {
    console.error('Failed to load config:', error);
  }
}

// Update specific config values
export async function updateConfig(updates) {
  try {

    
    // Update local store
    config.update(c => ({
      ...c,
      ...updates
    }));
  } catch (error) {
    console.error('Failed to update config:', error);
    throw error;
  }
}

// Convenience functions
export async function setTheme(theme) {
  await updateConfig({ theme });
}

export async function setQuickSaveSide(side) {
  await updateConfig({ quick_save_side: side });
}

export async function setTags(tags) {
  await updateConfig({ tags });
}

export async function addTag(tag) {
  const current = get(config);
  if (!current.tags.includes(tag)) {
    await setTags([...current.tags, tag]);
  }
}

export async function removeTag(tag) {
  const current = get(config);
  await setTags(current.tags.filter(t => t !== tag));
}
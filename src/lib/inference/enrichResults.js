import { readTextFile } from '@tauri-apps/plugin-fs';

export async function enrichResults(searchResults) {
    const enrichedResults = await Promise.all(
        searchResults.map(async (result) => {
            try {
                // Replace .png with .json to get metadata file path
                const metadataPath = result.path.replace('.png', '.json');

                // Read the JSON file using Tauri's API
                const metadataContent = await readTextFile(metadataPath);
                const metadata = JSON.parse(metadataContent);

                return {
                    ...result,
                    title: metadata.title,
                    tags: metadata.tags,
                    created_at: metadata.created_at,
                    dimensions: metadata.dimensions
                };
            } catch (error) {
                console.error(`Failed to load metadata for ${result.path}:`, error);
                return {
                    ...result,
                    title: 'Untitled',
                    tags: [],
                    ai_generated: false
                };
            }
        })
    );

    return enrichedResults;
}
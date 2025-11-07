// import { writeTextFile, readTextFile, exists, readFile, writeFile, BaseDirectory, readDir } from '@tauri-apps/plugin-fs';
// import { enrichResults } from '../inference/enrichResults';

// const DIRECTORY = BaseDirectory.AppData
// const APP_DATA_DIR = '/Users/kolejain/Library/Application Support/com.tauri.dev/images/'

// export async function init() {
//     try {

//         const entries = await readDir('images', {
//             baseDir: BaseDirectory.AppData 
//         });

//         const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
//         const imageFiles = entries
//             .filter(entry => entry.isFile)
//             .filter(entry => {
//                 const nameLower = entry.name.toLowerCase();
//                 return imageExtensions.some(ext => nameLower.endsWith(ext));
//             })
//             .map(item => {
//                 return {
//                     path: APP_DATA_DIR + item.name
//                 }
//             })

//         console.log('imagefiles', imageFiles)

//         const richData = await enrichResults(imageFiles)

//         const initData = sortImagesByTimePeriod(richData)

//         console.log('initData', initData)

//         return initData

//     } catch (error) {
//         console.log('error with init function', error)
//     }
// }


// function sortImagesByTimePeriod(images) {
//   const now = new Date();
//   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//   const sevenDaysAgo = new Date(today);
//   sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
//   const thirtyDaysAgo = new Date(today);
//   thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
//   const oneYearAgo = new Date(today);
//   oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

//   const periods = [
//     { label: 'Today', items: [], threshold: today },
//     { label: 'Previous 7 Days', items: [], threshold: sevenDaysAgo },
//     { label: 'Previous 30 Days', items: [], threshold: thirtyDaysAgo },
//     { label: 'Previous Year', items: [], threshold: oneYearAgo },
//     { label: 'All Time', items: [], threshold: new Date(0) }
//   ];

//   images.forEach(image => {
//     const createdAt = new Date(image.created_at);
    
//     for (let i = 0; i < periods.length; i++) {
//       if (createdAt >= periods[i].threshold) {
//         periods[i].items.push(image);
//         break;
//       }
//     }
//   });

//   // Sort each period's items by date descending
//   periods.forEach(period => {
//     period.items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
//   });

//   // Filter out empty periods
//   return periods.filter(period => period.items.length > 0);
// }


import { writable } from 'svelte/store';
import { readDir, BaseDirectory, remove } from '@tauri-apps/plugin-fs';
import { enrichResults } from '../inference/enrichResults';

const APP_DATA_DIR = '/Users/kolejain/Library/Application Support/com.tauri.dev/images/';

function createDashboardStore() {
    const { subscribe, set, update } = writable({
        periods: [],
        allImageCount: 0,
        loading: true
    });

    async function loadImages() {
        try {
            const entries = await readDir('images', {
                baseDir: BaseDirectory.AppData 
            });

            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
            const imageFiles = entries
                .filter(entry => entry.isFile)
                .filter(entry => {
                    const nameLower = entry.name.toLowerCase();
                    return imageExtensions.some(ext => nameLower.endsWith(ext));
                })
                .map(item => ({
                    path: APP_DATA_DIR + item.name
                }));

            const richData = await enrichResults(imageFiles);
            const periods = sortImagesByTimePeriod(richData);
            const allImageCount = richData.length;

            set({ periods, allImageCount, loading: false });
        } catch (error) {
            console.error('Error loading images:', error);
            set({ periods: [], allImageCount: 0, loading: false });
        }
    }

    async function deleteImage(imagePath) {
        try {
            // Extract filename from full path
            const filename = imagePath.split('/').pop();
            
            // Delete the file
            await remove(`images/${filename}`, {
                baseDir: BaseDirectory.AppData
            });

            // Reload images
            await loadImages();
        } catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    }

    async function refresh() {
        await loadImages();
    }

    return {
        subscribe,
        loadImages,
        deleteImage,
        refresh
    };
}

function sortImagesByTimePeriod(images) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const periods = [
        { label: 'Today', items: [], threshold: today },
        { label: 'Previous 7 Days', items: [], threshold: sevenDaysAgo },
        { label: 'Previous 30 Days', items: [], threshold: thirtyDaysAgo },
        { label: 'Previous Year', items: [], threshold: oneYearAgo },
        { label: 'All Time', items: [], threshold: new Date(0) }
    ];

    images.forEach(image => {
        const createdAt = new Date(image.created_at);
        
        for (let i = 0; i < periods.length; i++) {
            if (createdAt >= periods[i].threshold) {
                periods[i].items.push(image);
                break;
            }
        }
    });

    periods.forEach(period => {
        period.items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    });

    return periods.filter(period => period.items.length > 0);
}

export const dashboard = createDashboardStore();

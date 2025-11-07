import { startDrag } from '@crabnebula/tauri-plugin-drag';

async function createResizedIconBytes(srcUrl, maxWidth) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = async () => {
            try {
                const scale = Math.min(1, maxWidth / img.naturalWidth);
                const width = img.naturalWidth * scale;
                const height = img.naturalHeight * scale;

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        return reject(new Error('Canvas toBlob failed'));
                    }
                    const bytes = new Uint8Array(await blob.arrayBuffer());

                    resolve(Array.from(bytes));
                }, 'image/png');
            } catch (e) {
                reject(e);
            }
        };
        img.onerror = (e) => reject(new Error('Image failed to load for resizing'));
        img.src = srcUrl;
    });
}

export async function handleDragStart(event, imageUrl, assetUrl) {
    event.preventDefault();
    
    const iconBytes = await createResizedIconBytes(assetUrl, 100);

    startDrag({
        item: [imageUrl],
        icon: iconBytes
    });
}
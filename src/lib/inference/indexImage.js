import { writeTextFile, readTextFile, exists, readFile, writeFile } from '@tauri-apps/plugin-fs';
import { env, AutoProcessor, CLIPVisionModelWithProjection, RawImage } from '@xenova/transformers';
import { HNSW } from 'hnsw';

const MODEL_NAME = 'Xenova/siglip-base-patch16-512';
const EMBEDDING_DIM = 768;
const INDEX_FILENAME = 'image_index.json';
const APP_DATA_DIR = '/Users/kolejain/Library/Application Support/com.tauri.dev';
const MAP_PATH = `${APP_DATA_DIR}/image_map.json`;
const INDEX_PATH = `${APP_DATA_DIR}/${INDEX_FILENAME}`;

let modelsCache = null;
env.allowLocalModels = false;
env.allowRemoteModels = true;
//env.localModelPath = '/models/';
//env.backends.onnx.wasm.wasmPaths = '/models/';

async function loadModels() {
  if (modelsCache) {
    console.log('📦 Using cached models');
    return modelsCache;
  }
  
  console.log('🔄 Loading models...');
  const processor = await AutoProcessor.from_pretrained(MODEL_NAME);
  const visionModel = await CLIPVisionModelWithProjection.from_pretrained(MODEL_NAME);
  modelsCache = { processor, visionModel };
  console.log('✅ Models loaded successfully');
  return { processor, visionModel };
}

async function getEmbeddingFromBuffer(imageBuffer, processor, visionModel) {
  try {
    console.log('🖼️  Converting image buffer to RawImage...');
    const image = await RawImage.fromBlob(new Blob([imageBuffer]));
    
    console.log('⚙️  Processing image with model...');
    const inputs = await processor(image);
    const output = await visionModel(inputs);
    const tensor = output.pooler_output;
    
    if (!tensor) {
      console.warn('⚠️  Could not find pooler_output tensor');
      return null;
    }
    
    console.log('📊 Normalizing embedding...');
    const embedding = tensor.normalize(2, -1);
    console.log('embedding', embedding.data)
    //const embedding = Array.from(normalized.data);
    console.log(`✅ Generated embedding with ${embedding.length} dimensions`);
    return embedding.data;
  } catch (e) {
    console.error('❌ Failed to process image buffer:', e.message);
    return null;
  }
}

export async function addImageToIndex(imageBuffer, imagePath) {
  try {
    console.log('\n========================================');
    console.log('🚀 Starting addImageToIndex');
    console.log('📁 Image path:', imagePath);
    
    if (!imageBuffer || !imagePath) {
      throw new Error('Missing imageBuffer or imagePath');
    }

    const { processor, visionModel } = await loadModels();
    const bufferArray = Array.isArray(imageBuffer)
      ? imageBuffer
      : Object.values(imageBuffer);
    console.log('📏 Buffer array length:', bufferArray.length);

    let imageMap = {};
    let nextId = 0;
    let index = new HNSW(16, 200, EMBEDDING_DIM, 'cosine');

    const indexExists = await exists(INDEX_PATH);
    const mapExists = await exists(MAP_PATH);
    
    console.log('🔍 Index exists:', indexExists);
    console.log('🔍 Map exists:', mapExists);

    if (indexExists && mapExists) {
      console.log('📂 Loading existing index and map...');
      
      // Load existing index
      const indexData = await readTextFile(INDEX_PATH);
      console.log('📄 Index file size:', indexData.length, 'characters');
      const indexJson = JSON.parse(indexData);
      console.log('🔢 Index contains', Object.keys(indexJson).length, 'keys');
      
      // CRITICAL FIX: Assign the loaded index back to the index variable
      index = HNSW.fromJSON(indexJson);
      console.log('✅ Loaded existing index from JSON');
      
      // Load existing map
      const mapText = await readTextFile(MAP_PATH);
      imageMap = JSON.parse(mapText);
      console.log('🗺️  Image map loaded with', Object.keys(imageMap).length, 'entries');
      
      const existingIds = Object.keys(imageMap).map(Number);
      nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 0;
      console.log('🆔 Next ID will be:', nextId);
      
      // Check if image already indexed
      const alreadyIndexed = Object.values(imageMap).some(p => p === imagePath);
      if (alreadyIndexed) {
        console.log('⚠️  Image already indexed:', imagePath);
        const existingId = Object.keys(imageMap).find(id => imageMap[id] === imagePath);
        return { success: true, id: parseInt(existingId), message: 'Already indexed' };
      }
    } else {
      console.log('🆕 Creating new index and map');
    }

    // Generate embedding
    console.log(`🔄 Processing image for embedding...`);
    const buffer = new Uint8Array(bufferArray);
    const embedding = await getEmbeddingFromBuffer(buffer, processor, visionModel);
    
    if (!embedding) {
      throw new Error('Could not generate embedding for image');
    }

    //const float32Embedding = Float32Array.from(embedding); ============ Add this?

    // CRITICAL FIX: Use nextId instead of hardcoded 3
    console.log(`➕ Adding point with ID ${nextId} to index...`);
    await index.addPoint(nextId, embedding);
    imageMap[nextId] = imagePath;
    
    console.log('💾 Image map updated:', imageMap);

    // Save index and map
    console.log('💾 Saving index to disk...');
    const indexJson = index.toJSON();
    await writeTextFile(INDEX_PATH, JSON.stringify(indexJson));
    console.log('✅ Index saved to:', INDEX_PATH);
    
    console.log('💾 Saving map to disk...');
    await writeTextFile(MAP_PATH, JSON.stringify(imageMap, null, 2));
    console.log('✅ Map saved to:', MAP_PATH);

    console.log(`✅ Successfully added ${imagePath} to index with ID ${nextId}`);
    console.log('========================================\n');
    
    return { success: true, id: nextId };
  } catch (e) {
    console.error('❌ Failed to add image to index:', e);
    console.error('Stack trace:', e.stack);
    throw new Error(e.message);
  }
}
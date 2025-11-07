import { readTextFile, exists } from '@tauri-apps/plugin-fs';
import { env, AutoProcessor, CLIPVisionModelWithProjection, AutoTokenizer, CLIPTextModelWithProjection, RawImage } from '@xenova/transformers';
import { HNSW } from 'hnsw';

const MODEL_NAME = 'Xenova/siglip-base-patch16-512';
const EMBEDDING_DIM = 768;
const TOP_K = 20;
const APP_DATA_DIR = '/Users/kolejain/Library/Application Support/com.tauri.dev';
const INDEX_PATH = `${APP_DATA_DIR}/image_index.json`;
const MAP_PATH = `${APP_DATA_DIR}/image_map.json`;

function toFloat32ArrayFromTensor(t) {
	if (!t) return null;
	if (typeof t.tolist === 'function') {
		const v = t.tolist();
		return Float32Array.from(Array.isArray(v[0]) ? v[0] : v);
	}
	if (t.data) return Float32Array.from(t.data);
	return null;
}

function getEmbedding(out, mode = 'text') {
	if (out && out.pooler_output) {
		const a = toFloat32ArrayFromTensor(out.pooler_output);
		if (a) return a;
	}
	const prefer = mode === 'text' ? ['text_embeds', 'text_embed'] : ['image_embeds', 'image_embed'];
	for (const k of prefer) if (out && out[k]) {
		const a = toFloat32ArrayFromTensor(out[k]);
		if (a) return a;
	}
	if (out && out.last_hidden_state) {
		const lhs = out.last_hidden_state;
		if (typeof lhs.tolist === 'function') {
			const arr = lhs.tolist();
			const seq = arr[0];
			const dim = seq[0].length;
			const outA = new Float32Array(dim);
			for (let i = 0; i < seq.length; i++) for (let d = 0; d < dim; d++) outA[d] += seq[i][d];
			for (let d = 0; d < dim; d++) outA[d] /= seq.length;
			return outA;
		}
		if (lhs.data && lhs.dims) {
			const [, seqLen, dim] = lhs.dims;
			const flat = Array.from(lhs.data);
			const outA = new Float32Array(dim);
			for (let s = 0; s < seqLen; s++) {
				const base = s * dim;
				for (let d = 0; d < dim; d++) outA[d] += flat[base + d];
			}
			for (let d = 0; d < dim; d++) outA[d] /= seqLen;
			return outA;
		}
	}
	return null;
}

function l2Normalize(a) {
	if (!a) return null;
	let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * a[i]; s = Math.sqrt(s) || 1;
	const out = new Float32Array(a.length); for (let i = 0; i < a.length; i++) out[i] = a[i] / s;
	return out;
}


export async function searchImagesWithText(query) {
	try {
		console.log('Loading tokenizer & text model...');
		const tokenizer = await AutoTokenizer.from_pretrained(MODEL_NAME);
		const textModel = await CLIPTextModelWithProjection.from_pretrained(MODEL_NAME);
		const normalizedQuery = query.toLowerCase().trim(); //this is very important!
		const tokens = tokenizer([normalizedQuery], { padding: 'max_length', truncation: true, max_length: 77 });
		const textOutput = await textModel(tokens);

		let emb = getEmbedding(textOutput, 'text');
		if (!emb) throw new Error('No text embedding. Keys: ' + Object.keys(textOutput));
		emb = l2Normalize(emb);

		const indexExists = await exists(INDEX_PATH);
		const mapExists = await exists(MAP_PATH);
		console.log('🔍 Index exists:', indexExists);
		console.log('🔍 Map exists:', mapExists);

		if (!indexExists || !mapExists) {
			throw new Error('Index not found. Please add some images first.');
		}

		const mapData = await readTextFile(MAP_PATH); //JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
		const map = JSON.parse(mapData)
		console.log('this is the map', map)
		const indexData = await readTextFile(INDEX_PATH);
		const indexJson = JSON.parse(indexData);
		const index = HNSW.fromJSON(indexJson);

		const res = index.searchKNN(Array.from(emb), TOP_K);

		if (!res || res.length === 0) {
			console.log('No results');
			return;
		}

		const searchResults = res.map((result, i) => {
			const neighborId = result.id;
			const similarity = result.score;
			const imagePath = map[neighborId];
			const distance = 1 - similarity;

			console.log(`${i + 1}. ${imagePath} (similarity: ${similarity.toFixed(4)}, dist: ${distance.toFixed(4)})`);
			return { path: imagePath, distance, id: neighborId }
		})
			.sort((a, b) => Math.abs(1 - b.distance) - Math.abs(1 - a.distance))
			.map((item, i) => {
				return { ...item, rank: i + 1 };
			});

		return searchResults
	} catch (e) {
		console.error('Search failed:', e);
	}
}



export async function searchImagesWithImage(imagePath) {
  try {
    console.log('Loading index and map...');
    
    const indexExists = await exists(INDEX_PATH);
    const mapExists = await exists(MAP_PATH);
    
    if (!indexExists || !mapExists) {
      throw new Error('Index not found. Please add some images first.');
    }

    // Load map to find the image's ID
    const mapData = await readTextFile(MAP_PATH);
    const map = JSON.parse(mapData);
    
    // Find the ID for this image path
    const imageIdStr = Object.keys(map).find(id => map[id] === imagePath);
    
    if (imageIdStr === undefined) {
      throw new Error('Image not found in index. Please index it first.');
    }
    
    const imageId = parseInt(imageIdStr);
    console.log('Found image ID:', imageId);
    
    // Load raw index JSON
    const indexData = await readTextFile(INDEX_PATH);
    const indexJson = JSON.parse(indexData);
    
    // Extract the embedding from the nodes array
    // nodes is an array of [id, nodeData] pairs
    const nodeEntry = indexJson.nodes.find(([id, _]) => id === imageId);
    
    if (!nodeEntry) {
      throw new Error(`Could not find node with ID ${imageId} in index`);
    }
    
    const embedding = nodeEntry[1].vector;
    
    if (!embedding) {
      throw new Error('Node found but no vector present');
    }
    
    console.log('Found embedding with dimension:', embedding.length);
    
    // Now load the index for searching
    const index = HNSW.fromJSON(indexJson);
    
    // Search using the existing embedding
    const res = index.searchKNN(embedding, TOP_K);

    if (!res || res.length === 0) {
      console.log('No results');
      return [];
    }

    const searchResults = res
      .filter(result => result.id !== imageId) // Exclude the query image itself
      .map((result, i) => {
        const neighborId = result.id;
        const similarity = result.score;
        const resultPath = map[neighborId];
        const distance = 1 - similarity;

        console.log(`${i + 1}. ${resultPath} (similarity: ${similarity.toFixed(4)}, dist: ${distance.toFixed(4)})`);
        return { path: resultPath, distance, id: neighborId };
      })
	  .slice(0, 6)
      .sort((a, b) => Math.abs(1 - b.distance) - Math.abs(1 - a.distance))
      .map((item, i) => {
        return { ...item, rank: i + 1 };
      });

    return searchResults;
  } catch (e) {
    console.error('Image search failed:', e);
    throw e;
  }
}

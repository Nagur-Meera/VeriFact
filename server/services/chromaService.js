import { ChromaClient } from 'chromadb';

class ChromaService {
  constructor() {
    this.client = null;
    this.collection = null;
    this.collectionName = 'news-factcheck-collection';
    this.isConnected = false;
  }

  async initialize() {
    try {
      console.log('Initializing Chroma client...');
      this.client = new ChromaClient({
        path: process.env.CHROMA_URL || 'http://localhost:8000'
      });

      // Create or get collection
      try {
        this.collection = await this.client.getCollection({
          name: this.collectionName
        });
        console.log('Using existing Chroma collection');
      } catch (error) {
        console.log('Creating new Chroma collection...');
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: { "hnsw:space": "cosine" }
        });
      }

      this.isConnected = true;
      console.log('Chroma client initialized successfully');
      return true;
    } catch (error) {
      console.error('Chroma initialization failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  async addDocuments(documents, embeddings, metadatas, ids) {
    if (!this.isConnected || !this.collection) {
      throw new Error('Chroma client not initialized');
    }

    try {
      await this.collection.add({
        ids: ids,
        embeddings: embeddings,
        documents: documents,
        metadatas: metadatas
      });
      return true;
    } catch (error) {
      console.error('Chroma add documents error:', error);
      throw error;
    }
  }

  async queryDocuments(queryEmbedding, nResults = 10, filter = null) {
    if (!this.isConnected || !this.collection) {
      throw new Error('Chroma client not initialized');
    }

    try {
      const queryParams = {
        queryEmbeddings: [queryEmbedding],
        nResults: nResults
      };

      if (filter) {
        queryParams.where = filter;
      }

      const results = await this.collection.query(queryParams);
      
      return results.ids[0].map((id, index) => ({
        id: id,
        score: 1 - results.distances[0][index], // Convert distance to similarity
        document: results.documents[0][index],
        metadata: results.metadatas[0][index]
      }));
    } catch (error) {
      console.error('Chroma query error:', error);
      throw error;
    }
  }

  async updateDocument(id, embedding, document, metadata) {
    if (!this.isConnected || !this.collection) {
      throw new Error('Chroma client not initialized');
    }

    try {
      await this.collection.update({
        ids: [id],
        embeddings: [embedding],
        documents: [document],
        metadatas: [metadata]
      });
      return true;
    } catch (error) {
      console.error('Chroma update error:', error);
      throw error;
    }
  }

  async deleteDocument(id) {
    if (!this.isConnected || !this.collection) {
      throw new Error('Chroma client not initialized');
    }

    try {
      await this.collection.delete({
        ids: [id]
      });
      return true;
    } catch (error) {
      console.error('Chroma delete error:', error);
      throw error;
    }
  }

  async getCollectionInfo() {
    if (!this.isConnected || !this.collection) {
      return { count: 0, error: 'Not connected' };
    }

    try {
      const count = await this.collection.count();
      return {
        name: this.collectionName,
        count: count,
        connected: true
      };
    } catch (error) {
      console.error('Chroma info error:', error);
      return { count: 0, error: error.message };
    }
  }
}

export default ChromaService;

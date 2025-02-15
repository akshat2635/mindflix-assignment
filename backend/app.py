#Importing modules
from flask import Flask, request, jsonify,send_from_directory
from flask_cors import CORS
import chromadb
from PIL import Image
from sentence_transformers import SentenceTransformer
from transformers import CLIPProcessor, CLIPModel
import numpy as np

####################################################################################################################################

#Model Class
class ImageSearch:
    def __init__(self):
        self._load_models()

    def _load_models(self):
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.chroma_client.get_collection(name="image_search")
        self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        self.clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        self.text_model = SentenceTransformer("all-MiniLM-L6-v2")

    def get_text_embedding(self, text):
        return self.text_model.encode(text, convert_to_tensor=True).numpy()

    def get_image_embedding(self, image):
        inputs = self.clip_processor(images=image, return_tensors="pt")
        return self.clip_model.get_image_features(**inputs).detach().numpy().flatten()

    def retrieve_similar_images(self, query_embedding, top_k=5):
        try:
            results = self.collection.query(query_embeddings=[query_embedding.tolist()], n_results=top_k)
            return [results["metadatas"][0][i] for i in range(len(results["ids"][0]))]
        except Exception as e:
            return {"error": str(e)}

    def search(self, image=None, query_text=None):
        try:
            image_embedding = self.get_image_embedding(image) if image else np.zeros(512)
            text_embedding = self.get_text_embedding(query_text) if query_text else np.zeros(384)
            
            image_embedding /= np.linalg.norm(image_embedding) if np.linalg.norm(image_embedding) != 0 else 1
            text_embedding /= np.linalg.norm(text_embedding) if np.linalg.norm(text_embedding) != 0 else 1
            
            combined_embedding = np.concatenate((image_embedding, text_embedding))
            return self.retrieve_similar_images(combined_embedding)
        except Exception as e:
            return {"error": str(e)}

####################################################################################################################################

#Instantiating model and Flask app
image_search = ImageSearch()

app = Flask(__name__)
CORS(app)

#Search route
@app.route("/search", methods=["POST"])
def search_endpoint():
    try:
        query_text = request.form.get("query", "").strip()
        image = request.files.get("image")
        image = Image.open(image).convert("RGB") if image else None

        results = image_search.search(image, query_text)

        # Define the base URL where images are served
        BASE_IMAGE_URL = ""  # Change this based on your setup

        # Modify results to include actual image URLs instead of file paths
        formatted_results = [
            {
                "caption": result["caption"],
                "image": f"http://127.0.0.1:5000/images/{result['image_path']}"  # Ensure proper URL formatting
            }
            for result in results
        ]

        return jsonify({"results": formatted_results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


#Flask serving image directly
@app.route("/images/<filename>")
def serve_image(filename):
    return send_from_directory("flickr8k/Flicker8k_Dataset", filename)


if __name__ == "__main__":
    app.run(port=5000, debug=True)

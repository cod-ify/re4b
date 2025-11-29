import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { VertexAI } from "@google-cloud/vertexai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// --- Configuration ---
const projectId = process.env.GCLOUD_PROJECT;
const location = process.env.GCLOUD_LOCATION || "us-central1";

// Initialize Vertex AI Client
const vertex_ai = new VertexAI({ project: projectId, location });

// --- Models ---

// 1. ANALYSIS MODEL: Gemini 2.5 Flash
// Best for high-speed, accurate multimodal understanding (reading the room geometry)
const geminiAnalysisModel = vertex_ai.preview.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// 2. GENERATION MODEL: Gemini 2.5 Flash Image
// Specialized for high-fidelity image generation
const geminiImageModel = vertex_ai.preview.getGenerativeModel({
  model: "gemini-2.5-flash-image",
});

// Helper
const fileToGenerativePart = (base64DataUrl) => {
  const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length < 3) throw new Error("Invalid base64 image");
  return { inlineData: { mimeType: matches[1], data: matches[2] } };
};

/**
 * Endpoint 1: Magic Prompt Enhancer
 * Uses the Analysis model (Flash 2.5) for text tasks
 */
app.post("/api/enhance-prompt", async (req, res) => {
  try {
    const { prompt, style, roomType, maintainStructure, maintainFurniture } =
      req.body;
    const chat = geminiAnalysisModel.startChat({});

    const input = `You are an expert architectural photographer. Convert this user request into a precise prompt for an AI image generator.
    
    User Request: "${prompt}"
    Room: ${roomType}, Style: ${style}
    Constraints: 
    - Structure: ${maintainStructure ? "Strictly maintained" : "Flexible"}
    - Furniture: ${maintainFurniture ? "Strictly maintained" : "Flexible"}

    Focus on lighting (e.g. "soft diffuse daylight"), materials (e.g. "white oak", "calacatta marble"), and atmosphere. 
    Output ONLY the enhanced prompt text.`;

    const result = await chat.sendMessage(input);
    const response = result.response.candidates[0].content.parts[0].text;
    res.json({ success: true, enhancedPrompt: response.trim() });
  } catch (error) {
    console.error("Enhance Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Endpoint 2: Generate Design (Grounding Pipeline)
 * Step 1: Gemini 2.5 Flash analyzes the scene.
 * Step 2: Gemini 2.5 Flash Image generates the result.
 */
app.post("/api/generate-design", async (req, res) => {
  try {
    const {
      image,
      roomType,
      style,
      colorPalette,
      prompt,
      maintainStructure,
      maintainFurniture,
    } = req.body;
    if (!image) throw new Error("No image provided");

    console.log(
      `Processing: ${roomType} in ${style} style (Structure: ${maintainStructure}, Furniture: ${maintainFurniture})...`
    );

    // --- STEP 1: ANALYSIS (Gemini 2.5 Flash) ---
    // We ask Gemini to describe the room's geometry so the generator knows what to keep.
    let sceneDescription = "A standard room interior.";

    if (maintainStructure || maintainFurniture) {
      console.log("Analyzing scene geometry with Gemini 2.5 Flash...");
      const analysisPrompt = `
        Analyze this interior image of a ${roomType}. 
        Provide a concise, strictly factual description of:
        1. The architectural geometry (window positions, ceiling height, beams, door locations).
        2. The layout of the main furniture pieces (e.g. "L-shaped sofa on left, TV console on right wall").
        
        Do not describe colors or decor style. Only describe SHAPES and POSITIONS.
      `;

      const analysisReq = {
        contents: [
          {
            role: "user",
            parts: [{ text: analysisPrompt }, fileToGenerativePart(image)],
          },
        ],
      };

      const analysisResult = await geminiAnalysisModel.generateContent(
        analysisReq
      );
      if (analysisResult.response.candidates?.[0]?.content?.parts?.[0]?.text) {
        sceneDescription =
          analysisResult.response.candidates[0].content.parts[0].text;
        console.log(
          "Detected Geometry:",
          sceneDescription.slice(0, 100) + "..."
        );
      }
    }

    // --- STEP 2: GENERATION (Gemini 2.5 Flash Image) ---
    console.log("Generating image with Gemini 2.5 Flash Image...");

    const constraintText =
      maintainStructure || maintainFurniture
        ? `Ensure the architectural layout and furniture placement matches this description exactly: ${sceneDescription}`
        : "You are free to reimagine the layout.";

    const fullPrompt = `
      Create a photorealistic, high-resolution image of a ${roomType} designed in a ${style} style.
      
      [Constraints]
      ${constraintText}
      
      [Design Details]
      Palette: ${colorPalette}
      Atmosphere: ${
        prompt ||
        "High-end interior design, architectural digest style, soft natural lighting."
      }
      
      Return an image.
    `;

    const genRequest = {
      contents: [
        {
          role: "user",
          parts: [
            { text: fullPrompt },
            // We provide the image again as reference for the generation model
            fileToGenerativePart(image),
          ],
        },
      ],
    };

    const result = await geminiImageModel.generateContent(genRequest);
    const candidates = result.response.candidates;

    if (!candidates || candidates.length === 0)
      throw new Error("No candidates returned");

    let generatedImageBase64 = null;

    // Check for inline image data in the response parts
    for (const part of candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        generatedImageBase64 = part.inlineData.data;
        break;
      }
    }

    if (generatedImageBase64) {
      res.json({
        success: true,
        image: `data:image/png;base64,${generatedImageBase64}`,
      });
    } else {
      // Fallback/Error handling if only text is returned
      const text = candidates[0].content.parts.map((p) => p.text).join(" ");
      console.warn("Model returned text instead of image:", text);
      throw new Error(
        "The model generated text instead of an image. Please try adjusting the prompt."
      );
    }
  } catch (error) {
    console.error("Design Generation Error:", error);
    res.json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`AI Design Server running on http://localhost:${PORT}`);
});

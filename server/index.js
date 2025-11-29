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

const vertex_ai = new VertexAI({ project: projectId, location });

// --- Models ---
const geminiAnalysisModel = vertex_ai.preview.getGenerativeModel({
  model: "gemini-2.5-flash",
});
const geminiImageModel = vertex_ai.preview.getGenerativeModel({
  model: "gemini-2.5-flash-image",
});

const fileToGenerativePart = (base64DataUrl) => {
  const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length < 3) throw new Error("Invalid base64 image");
  return { inlineData: { mimeType: matches[1], data: matches[2] } };
};

/**
 * Endpoint 1: Magic Prompt Enhancer
 */
app.post("/api/enhance-prompt", async (req, res) => {
  try {
    const { prompt, style, roomType, maintainStructure, maintainFurniture } =
      req.body;
    const chat = geminiAnalysisModel.startChat({});

    // STRICT System Instruction to prevent hallucinated camera angles
    const input = `You are an expert interior design photographer. Convert this user request into a precise prompt for an AI image generator.
    
    User Request: "${prompt}"
    Room: ${roomType}, Style: ${style}
    Constraints: 
    - Structure: ${maintainStructure ? "Strictly maintained" : "Flexible"}
    - Furniture: ${maintainFurniture ? "Strictly maintained" : "Flexible"}

    IMPORTANT: Do NOT describe camera angles, focal lengths, or structural changes (like moving windows/doors). 
    Focus ONLY on lighting (e.g. "soft diffuse daylight"), materials (e.g. "velvet", "oak"), and atmosphere.
    Output ONLY the enhanced prompt.`;

    const result = await chat.sendMessage(input);
    res.json({
      success: true,
      enhancedPrompt:
        result.response.candidates[0].content.parts[0].text.trim(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Endpoint 2: Generate Design
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

    // STEP 1: ANALYSIS
    let furnitureList = "standard furniture";
    console.log("Analyzing scene geometry and furniture...");
    const analysisPrompt = `
      Analyze this interior image of a ${roomType}. 
      1. List the architectural geometry (window positions, ceiling height, beams, door locations).
      2. List every major piece of furniture visible (e.g. "L-shaped sofa, coffee table, arm chair").
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
      furnitureList =
        analysisResult.response.candidates[0].content.parts[0].text;
    }

    // STEP 2: GENERATION
    console.log("Generating image...");
    let constraintInstruction = "";

    if (maintainStructure && maintainFurniture) {
      constraintInstruction = `CRITICAL: PRESERVE EVERYTHING. Keep architecture and furniture exactly as described: "${furnitureList}". Do not move objects. Only update materials/colors.`;
    } else if (maintainStructure && !maintainFurniture) {
      constraintInstruction = `CRITICAL: PRESERVE ARCHITECTURE ONLY. Keep walls/windows as described: "${furnitureList}". HOWEVER, REMOVE AND REPLACE ALL FURNITURE. The room currently contains: ${furnitureList}. Ignore these shapes. Furnish the room from scratch with new ${style} furniture.`;
    } else if (!maintainStructure && maintainFurniture) {
      constraintInstruction = `CRITICAL: PRESERVE FURNITURE LAYOUT. Keep furniture placement: "${furnitureList}". You may redesign the walls/windows.`;
    } else {
      constraintInstruction = `CREATIVE FREEDOM: Reimagine the entire room layout and architecture.`;
    }

    const fullPrompt = `
      CRITICAL: PRESERVE EXACT CAMERA ANGLE AND PERSPECTIVE.
      Create a photorealistic, high-resolution image of a ${roomType} designed in a ${style} style.
      ${constraintInstruction}
      [Design Details] Palette: ${colorPalette}. Atmosphere: ${
      prompt || "High-end interior design, soft natural lighting."
    }
      Return an image.
    `;

    const result = await geminiImageModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }, fileToGenerativePart(image)],
        },
      ],
    });
    const candidates = result.response.candidates;
    if (!candidates || candidates.length === 0)
      throw new Error("No candidates returned");

    let generatedImageBase64 = null;
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
      throw new Error("Model generated text instead of image.");
    }
  } catch (error) {
    console.error("Design Generation Error:", error);
    res.json({ success: false, error: error.message });
  }
});

/**
 * Endpoint 3: Edit Design
 */
app.post("/api/edit-design", async (req, res) => {
  try {
    const { image, editPrompt, referenceImage } = req.body;
    if (!image || !editPrompt) throw new Error("Missing image or prompt");

    console.log(`Editing design: "${editPrompt}"...`);

    let fullPrompt = `
      CRITICAL: PRESERVE EXACT CAMERA ANGLE AND PERSPECTIVE.
      Act as an expert photo editor. Edit the attached image according to: "${editPrompt}".
      1. ONLY change what is requested.
      2. PRESERVE the rest of the image exactly (lighting, perspective, layout).
      3. Output a high-fidelity image.
    `;

    const parts = [{ text: fullPrompt }, fileToGenerativePart(image)];

    if (referenceImage) {
      fullPrompt +=
        " Use the second attached image as a visual reference for the item requested.";
      parts.push(fileToGenerativePart(referenceImage));
    }

    const result = await geminiImageModel.generateContent({
      contents: [{ role: "user", parts }],
    });
    const candidates = result.response.candidates;
    if (!candidates || candidates.length === 0)
      throw new Error("No candidates returned");

    let generatedImageBase64 = null;
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
      throw new Error("Model generated text instead of image.");
    }
  } catch (error) {
    console.error("Edit Generation Error:", error);
    res.json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`AI Design Server running on http://localhost:${PORT}`);
});

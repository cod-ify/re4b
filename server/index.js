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
// Used for "seeing" the room geometry, reasoning, and text generation.
const geminiAnalysisModel = vertex_ai.preview.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// 2. GENERATION MODEL: Gemini 2.5 Flash Image
// Used strictly for creating high-fidelity renders.
const geminiImageModel = vertex_ai.preview.getGenerativeModel({
  model: "gemini-2.5-flash-image",
});

// Helper to convert base64 string to Vertex AI Part format
const fileToGenerativePart = (base64DataUrl) => {
  const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length < 3) throw new Error("Invalid base64 image");
  return { inlineData: { mimeType: matches[1], data: matches[2] } };
};

/**
 * Endpoint 1: Get Suggestions (Magic Prompt)
 */
app.post("/api/enhance-prompt", async (req, res) => {
  try {
    const { prompt, style, roomType, maintainStructure, maintainFurniture } =
      req.body;
    const chat = geminiAnalysisModel.startChat({});

    // STRICT System Instruction to prevent hallucinated camera angles or structural changes
    const input = `You are an expert interior design photographer. Convert this user request into a precise prompt for an AI image generator.
    
    User Request: "${prompt}"
    Room: ${roomType}, Style: ${style}
    Constraints: 
    - Structure: ${maintainStructure ? "Strictly maintained" : "Flexible"}
    - Furniture: ${maintainFurniture ? "Strictly maintained" : "Flexible"}

    IMPORTANT: Do NOT describe camera angles, focal lengths, or structural changes (like moving windows/doors) unless explicitly asked. 
    Focus ONLY on lighting (e.g. "soft diffuse daylight"), materials (e.g. "velvet", "oak"), and atmosphere.
    Output ONLY the enhanced prompt.`;

    const result = await chat.sendMessage(input);
    res.json({
      success: true,
      enhancedPrompt:
        result.response.candidates[0].content.parts[0].text.trim(),
    });
  } catch (error) {
    console.error("Enhance Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Endpoint 2: Generate Design (The Grounding Pipeline)
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

    // STEP 1: ANALYSIS (Grounding)
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
      // Lock Everything: "Reskin"
      constraintInstruction = `CRITICAL: PRESERVE EVERYTHING. Keep architecture and furniture exactly as described: "${furnitureList}". Do not move objects. Only update materials/colors.`;
    } else if (maintainStructure && !maintainFurniture) {
      // Lock Structure, Unlock Furniture: "Refurnish"
      constraintInstruction = `CRITICAL: PRESERVE ARCHITECTURE ONLY. Keep walls/windows as described: "${furnitureList}". HOWEVER, REMOVE AND REPLACE ALL FURNITURE. The room currently contains: ${furnitureList}. Ignore these shapes. Furnish the room from scratch with new ${style} furniture.`;
    } else if (!maintainStructure && maintainFurniture) {
      // Unlock Structure, Lock Furniture: "Renovate Shell"
      constraintInstruction = `CRITICAL: PRESERVE FURNITURE LAYOUT. Keep furniture placement: "${furnitureList}". You may redesign the walls/windows.`;
    } else {
      // Unlock Everything: "Reimagine"
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
 * Endpoint 3: Edit Design (Post-Production)
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

// ... existing imports ... (Keep previous code for index.js)

// ... existing endpoints 1, 2, 3 ...

/**
 * Endpoint 4: Analyze Renovation (Smart Context Aware)
 */
app.post("/api/analyze-renovation", async (req, res) => {
  try {
    const { beforeImage, afterImage, currencySymbol, userNotes } = req.body;
    if (!beforeImage || !afterImage) throw new Error("Missing images");

    console.log("Analyzing renovation plan with smart context...");

    // Add user notes to prompt if available
    const contextInstruction = userNotes
      ? `USER PROVIDED CONTEXT: "${userNotes}". Use this to calculate quantities (e.g. if user says "12x12 room", calculate 144 sq ft for flooring).`
      : "";

    const prompt = `
      Act as an expert construction estimator and safety inspector. Compare Image A (Current) and Image B (Goal).
      ${contextInstruction}
      
      1. **Safety & Risk:** Determine DIY difficulty (Low/Medium/High).
         - High Risk = Electrical, Plumbing, Structural.
      2. **Phases:** Break down the project (e.g. Prep, Demo, Install, Finish).
      3. **Tools with Prices:** List all required tools. Provide an estimated price for each in ${currencySymbol}.
      4. **Smart Materials:** - Identify materials.
         - If item is COUNTABLE (e.g. 2 lamps), set 'defaultQty' to that number.
         - If item is DIMENSIONAL (e.g. paint), set 'defaultQty' to 0 UNLESS you can calculate it from the USER PROVIDED CONTEXT.
      5. **Measurement Guide:** Provide simple tips. 
         - Use plain English: "Measure straight line from corner to corner". 
         - DO NOT use math jargon like "perimeter", "circumference".
         - Use **bold** asterisks for the item name.

      Output STRICTLY VALID JSON:
      {
        "diyRating": "Medium",
        "riskyPhases": ["Electrical"],
        "phases": [
          { 
            "name": "Preparation", 
            "tools": ["Tape Measure", "Mask"],
            "steps": [
              { "action": "Clear room", "detail": "Remove furniture.", "warning": "Lift with legs." }
            ]
          }
        ],
        "toolsList": [
           { "name": "Tape Measure", "price": 10 },
           { "name": "Paint Roller", "price": 15 }
        ],
        "materials": [
          { "id": "m1", "name": "Sofa", "unit": "pc", "unitPrice": 500, "defaultQty": 1, "usage": "Furniture" },
          { "id": "m2", "name": "Wall Paint", "unit": "gal", "unitPrice": 45, "defaultQty": 0, "usage": "Walls" }
        ],
        "measurementGuide": [
          "**For Paint**: Measure the wall length from corner to corner. Multiply by wall height.",
          "**For Flooring**: Measure the floor length and width in a straight line."
        ],
        "videoSearchTerms": ["how to paint a room"]
      }
    `;

    const request = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { text: "Image A (Before):" },
            fileToGenerativePart(beforeImage),
            { text: "Image B (After):" },
            fileToGenerativePart(afterImage),
          ],
        },
      ],
    };

    const result = await geminiAnalysisModel.generateContent(request);
    const responseText = result.response.candidates[0].content.parts[0].text;
    const jsonStr = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const plan = JSON.parse(jsonStr);

    res.json({ success: true, plan });
  } catch (error) {
    console.error("Renovation Analysis Error:", error);
    res.json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`AI Design Server running on http://localhost:${PORT}`);
});

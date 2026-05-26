export const plantTechBadges = [
  "PyTorch",
  "FastAPI",
  "Hugging Face",
  "EfficientNet",
];

export const plantShowcaseItems = [
  {
    title: "Upload Workflow",
    eyebrow: "Step 01",
    summary: "Drag a leaf image into the ML Lab or capture from webcam.",
    accent: "#C8FF00",
  },
  {
    title: "Prediction Dashboard",
    eyebrow: "Step 02",
    summary: "Disease status, confidence, and request timing appear instantly.",
    accent: "#FF6B35",
  },
  {
    title: "Confidence Analysis",
    eyebrow: "Step 03",
    summary: "Top-5 model probabilities are rendered as compact confidence bars.",
    accent: "#A855F7",
  },
  {
    title: "Model Pipeline UI",
    eyebrow: "Step 04",
    summary: "The inference lifecycle is documented inside the product module.",
    accent: "#FF2D2D",
  },
];

export const plantProductStats = [
  { label: "Accuracy", value: "97.84%", color: "#C8FF00" },
  { label: "Classes", value: "15", color: "#FF6B35" },
  { label: "Images", value: "20k+", color: "#A855F7" },
];

export const plantArchitectureSteps = [
  {
    title: "Frontend",
    detail: "Next.js ML Lab sends multipart image payloads.",
    color: "#FF2D2D",
  },
  {
    title: "HF Spaces API",
    detail: "Dockerized CPU inference service on Hugging Face Spaces.",
    color: "#C8FF00",
  },
  {
    title: "FastAPI Inference",
    detail: "UploadFile validation, model singleton, and JSON response schema.",
    color: "#FF6B35",
  },
  {
    title: "EfficientNet-B0",
    detail: "Transfer-learned CNN classifier over 15 plant classes.",
    color: "#A855F7",
  },
  {
    title: "Prediction Engine",
    detail: "Softmax scores, top-5 predictions, and disease guidance.",
    color: "#C8FF00",
  },
];

export interface PlantCareGuidance {
  title: string;
  severity: "Low" | "Moderate" | "High" | "Healthy";
  description: string;
  treatment: string[];
  prevention: string[];
  care: string[];
}

const defaultDiseaseGuidance: PlantCareGuidance = {
  title: "General Plant Disease Guidance",
  severity: "Moderate",
  description:
    "The model detected symptoms consistent with a plant disease class. Confirm visually and isolate the affected plant if symptoms are spreading.",
  treatment: [
    "Remove heavily affected leaves with sanitized tools.",
    "Improve airflow and avoid overhead watering.",
    "Use a crop-appropriate fungicide or bactericide if symptoms progress.",
  ],
  prevention: [
    "Inspect leaves weekly, especially after humid weather.",
    "Avoid splashing soil onto lower leaves.",
    "Rotate crops and clear infected debris after harvest.",
  ],
  care: [
    "Water at the base early in the day.",
    "Keep nutrition balanced; avoid excessive nitrogen.",
    "Track new lesions for 3-5 days before escalating treatment.",
  ],
};

const healthyGuidance: PlantCareGuidance = {
  title: "Healthy Leaf Care Plan",
  severity: "Healthy",
  description:
    "The model classified the sample as healthy. Keep monitoring under consistent lighting and compare new leaves over time.",
  treatment: [
    "No disease treatment is indicated from this scan.",
    "Keep the plant on its current care routine if growth is stable.",
  ],
  prevention: [
    "Maintain spacing for airflow.",
    "Water at soil level and avoid wet leaves overnight.",
    "Check the undersides of leaves during routine inspection.",
  ],
  care: [
    "Use balanced fertilizer at the crop's normal schedule.",
    "Remove aging leaves once they yellow naturally.",
    "Capture another scan if spots, curling, or mildew appears.",
  ],
};

const diseaseGuidance: Record<string, PlantCareGuidance> = {
  Bacterial_spot: {
    title: "Bacterial Spot Response",
    severity: "High",
    description:
      "Bacterial spot often appears as dark, water-soaked lesions and can spread quickly in warm, wet conditions.",
    treatment: [
      "Remove infected leaves and avoid handling wet plants.",
      "Apply copper-based spray where appropriate for the crop.",
      "Disinfect tools between plants.",
    ],
    prevention: [
      "Use disease-free seeds or transplants.",
      "Avoid overhead irrigation.",
      "Rotate away from host crops for at least one season.",
    ],
    care: [
      "Keep foliage dry and improve airflow.",
      "Avoid high-nitrogen fertilizer during active spread.",
      "Scout nearby plants for early lesions.",
    ],
  },
  Early_blight: {
    title: "Early Blight Care Plan",
    severity: "Moderate",
    description:
      "Early blight commonly forms concentric brown spots on older leaves and is favored by humid leaf surfaces.",
    treatment: [
      "Prune affected lower leaves.",
      "Mulch soil to reduce splash-back.",
      "Use labeled fungicide if lesions continue spreading.",
    ],
    prevention: [
      "Stake plants for airflow.",
      "Rotate crops and clear old plant debris.",
      "Water deeply but less frequently.",
    ],
    care: [
      "Keep leaves off soil where possible.",
      "Maintain potassium and calcium levels.",
      "Monitor lower leaves after rain.",
    ],
  },
  Late_blight: {
    title: "Late Blight Alert",
    severity: "High",
    description:
      "Late blight can move rapidly and may cause dark lesions with pale margins under cool, wet conditions.",
    treatment: [
      "Isolate affected plants immediately.",
      "Remove infected foliage and bag debris.",
      "Use a crop-approved fungicide program if confirmed.",
    ],
    prevention: [
      "Avoid prolonged leaf wetness.",
      "Increase spacing and airflow.",
      "Do not compost infected material.",
    ],
    care: [
      "Check plants daily during cool, humid periods.",
      "Water only at the base.",
      "Reduce canopy crowding.",
    ],
  },
  Leaf_Mold: {
    title: "Leaf Mold Management",
    severity: "Moderate",
    description:
      "Leaf mold often develops in humid, poorly ventilated environments and shows yellowing with fuzzy growth on leaf undersides.",
    treatment: [
      "Remove affected leaves.",
      "Reduce humidity around the canopy.",
      "Apply labeled fungicide if needed.",
    ],
    prevention: [
      "Improve ventilation.",
      "Avoid dense canopy growth.",
      "Water early so foliage dries quickly.",
    ],
    care: [
      "Prune for airflow.",
      "Avoid evening watering.",
      "Keep greenhouse humidity controlled.",
    ],
  },
  Septoria_leaf_spot: {
    title: "Septoria Leaf Spot Plan",
    severity: "Moderate",
    description:
      "Septoria leaf spot usually starts on lower leaves as small circular lesions and spreads through splashing water.",
    treatment: [
      "Remove lower infected leaves.",
      "Mulch to reduce soil splash.",
      "Use fungicide when conditions remain wet.",
    ],
    prevention: [
      "Rotate crops.",
      "Clean plant debris after harvest.",
      "Space plants to increase airflow.",
    ],
    care: [
      "Water at the root zone.",
      "Stake plants upright.",
      "Inspect after rainfall.",
    ],
  },
};

export function getPlantGuidance(className?: string, isHealthy?: boolean): PlantCareGuidance {
  if (isHealthy) return healthyGuidance;
  if (!className) return defaultDiseaseGuidance;

  const match = Object.entries(diseaseGuidance).find(([key]) =>
    className.toLowerCase().includes(key.toLowerCase())
  );

  return match?.[1] ?? defaultDiseaseGuidance;
}

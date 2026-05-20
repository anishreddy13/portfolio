import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import numpy as np
import io
import base64
import joblib
from pathlib import Path

# Labels
CANCER_LABELS = {
    'mel':   {'name': 'Melanoma',              'cancerous': True},
    'bcc':   {'name': 'Basal Cell Carcinoma',  'cancerous': True},
    'akiec': {'name': 'Actinic Keratoses',     'cancerous': True},
    'nv':    {'name': 'Melanocytic Nevi',      'cancerous': False},
    'bkl':   {'name': 'Benign Keratosis',      'cancerous': False},
    'df':    {'name': 'Dermatofibroma',        'cancerous': False},
    'vasc':  {'name': 'Vascular Lesion',       'cancerous': False},
}

CLASS_NAMES = ['akiec', 'bcc', 'bkl', 'df', 'mel', 'nv', 'vasc']
NUM_CLASSES = len(CLASS_NAMES)

# Image transforms for inference
INFERENCE_TRANSFORMS = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

def build_model(num_classes=NUM_CLASSES):
    """Build ResNet18 with custom classifier head"""
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    
    # Freeze early layers
    for name, param in model.named_parameters():
        if 'layer4' not in name and 'fc' not in name:
            param.requires_grad = False
    
    # Replace final classifier
    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(in_features, 256),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(256, num_classes)
    )
    return model

def save_skin_model(model, path='skin_model.pth'):
    torch.save(model.state_dict(), path)
    print(f"Skin cancer model saved to {path}")

def load_skin_model(path='skin_model.pth'):
    model = build_model()
    model.load_state_dict(
        torch.load(path, map_location=torch.device('cpu'))
    )
    model.eval()
    return model

def preprocess_image_bytes(image_bytes: bytes) -> torch.Tensor:
    """Convert raw bytes to model input tensor"""
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    tensor = INFERENCE_TRANSFORMS(image).unsqueeze(0)
    return tensor

def preprocess_base64_image(base64_str: str) -> torch.Tensor:
    """Convert base64 string to model input tensor"""
    # Remove data URL prefix if present
    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]
    image_bytes = base64.b64decode(base64_str)
    return preprocess_image_bytes(image_bytes)

def predict_skin_cancer(base64_image: str, model) -> dict:
    """Run inference on a base64 encoded image"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device)
    model.eval()

    # Preprocess
    tensor = preprocess_base64_image(base64_image).to(device)

    with torch.no_grad():
        outputs = model(tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]

    # Build per-class results
    class_results = []
    for i, cls in enumerate(CLASS_NAMES):
        info = CANCER_LABELS[cls]
        class_results.append({
            'class_code': cls,
            'class_name': info['name'],
            'probability': round(float(probabilities[i]) * 100, 2),
            'is_cancerous': info['cancerous'],
        })

    # Sort by probability
    class_results.sort(key=lambda x: x['probability'], reverse=True)

    # Top prediction
    top = class_results[0]
    predicted_class = top['class_code']
    is_cancerous = top['is_cancerous']
    confidence = top['probability']

    # Overall cancer probability
    cancer_prob = sum(
        float(probabilities[i]) * 100
        for i, cls in enumerate(CLASS_NAMES)
        if CANCER_LABELS[cls]['cancerous']
    )
    benign_prob = 100.0 - cancer_prob

    risk_level = 'Low'
    if cancer_prob >= 70:
        risk_level = 'High'
    elif cancer_prob >= 40:
        risk_level = 'Moderate'

    return {
        'prediction': 'Cancerous' if is_cancerous else 'Non-Cancerous',
        'predicted_type': top['class_name'],
        'predicted_code': predicted_class,
        'confidence': round(confidence, 2),
        'cancer_probability': round(cancer_prob, 2),
        'benign_probability': round(benign_prob, 2),
        'risk_level': risk_level,
        'is_cancerous': is_cancerous,
        'all_classes': class_results,
        'top_5': class_results[:5],
    }
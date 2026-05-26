from __future__ import annotations

import base64
import binascii
import io
import json
from dataclasses import dataclass
from pathlib import Path

import torch
from PIL import Image, UnidentifiedImageError
from torchvision import transforms

from plant_dataset import DEFAULT_IMAGE_SIZE, IMAGENET_MEAN, IMAGENET_STD
from plant_model import build_efficientnet_b0


PLANT_INFERENCE_TRANSFORM = transforms.Compose(
    [
        transforms.Resize((DEFAULT_IMAGE_SIZE, DEFAULT_IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ]
)


@dataclass
class PlantDiseasePredictor:
    model: torch.nn.Module
    idx_to_class: dict[int, str]
    device: torch.device


class PlantInferenceError(ValueError):
    pass


def load_class_mapping(mapping_path: str | Path) -> tuple[dict[str, int], dict[int, str]]:
    path = Path(mapping_path)
    if not path.exists():
        raise FileNotFoundError(f"Plant class mapping not found: {path}")

    payload = json.loads(path.read_text(encoding="utf-8"))
    class_to_idx = payload.get("class_to_idx")
    if not isinstance(class_to_idx, dict) or not class_to_idx:
        raise ValueError(f"Invalid plant class mapping file: {path}")

    idx_to_class = {idx: class_name for class_name, idx in class_to_idx.items()}
    return class_to_idx, idx_to_class


def load_plant_predictor(
    checkpoint_path: str | Path,
    mapping_path: str | Path,
    device: torch.device | None = None,
) -> PlantDiseasePredictor:
    checkpoint_path = Path(checkpoint_path)
    if not checkpoint_path.exists():
        raise FileNotFoundError(f"Plant disease checkpoint not found: {checkpoint_path}")

    class_to_idx, idx_to_class = load_class_mapping(mapping_path)
    device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model = build_efficientnet_b0(
        num_classes=len(class_to_idx),
        freeze_backbone=False,
        pretrained=False,
    )
    try:
        checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=True)
    except TypeError:
        checkpoint = torch.load(checkpoint_path, map_location=device)
    except Exception:
        checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)
    state_dict = checkpoint.get("model_state_dict", checkpoint)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()

    return PlantDiseasePredictor(
        model=model,
        idx_to_class=idx_to_class,
        device=device,
    )


def decode_base64_image(base64_image: str) -> bytes:
    if not base64_image or not base64_image.strip():
        raise PlantInferenceError("Image payload cannot be empty")

    payload = base64_image.strip()
    if "," in payload:
        payload = payload.split(",", 1)[1]

    try:
        return base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise PlantInferenceError("Image payload must be valid base64") from exc


def preprocess_image_bytes(image_bytes: bytes) -> torch.Tensor:
    try:
        with Image.open(io.BytesIO(image_bytes)) as image:
            image = image.convert("RGB")
            return PLANT_INFERENCE_TRANSFORM(image).unsqueeze(0)
    except (OSError, UnidentifiedImageError) as exc:
        raise PlantInferenceError("Image payload is not a readable image") from exc


def classify_status(class_name: str) -> str:
    return "healthy" if "healthy" in class_name.lower() else "disease"


def format_class_name(class_name: str) -> str:
    return class_name.replace("___", " ").replace("__", " ").replace("_", " ")


def predict_plant_disease_from_bytes(
    image_bytes: bytes,
    predictor: PlantDiseasePredictor,
) -> dict:
    if not image_bytes:
        raise PlantInferenceError("Image payload cannot be empty")

    tensor = preprocess_image_bytes(image_bytes).to(predictor.device)

    with torch.no_grad():
        outputs = predictor.model(tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]

    top_count = min(5, len(predictor.idx_to_class))
    top_probabilities, top_indices = torch.topk(probabilities, k=top_count)

    top_predictions = []
    for probability, idx in zip(top_probabilities.tolist(), top_indices.tolist()):
        class_name = predictor.idx_to_class[idx]
        top_predictions.append(
            {
                "class_name": class_name,
                "display_name": format_class_name(class_name),
                "confidence": round(float(probability) * 100.0, 2),
                "status": classify_status(class_name),
            }
        )

    top_prediction = top_predictions[0]
    return {
        "predicted_class": top_prediction["class_name"],
        "predicted_display_name": top_prediction["display_name"],
        "confidence_score": top_prediction["confidence"],
        "status": top_prediction["status"],
        "is_healthy": top_prediction["status"] == "healthy",
        "top_5_predictions": top_predictions,
    }


def predict_plant_disease(base64_image: str, predictor: PlantDiseasePredictor) -> dict:
    image_bytes = decode_base64_image(base64_image)
    return predict_plant_disease_from_bytes(image_bytes, predictor)

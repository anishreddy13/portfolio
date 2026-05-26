from __future__ import annotations

import io
import json
import time
import base64
from dataclasses import dataclass
from pathlib import Path

import torch
import torch.nn.functional as F
from PIL import Image, UnidentifiedImageError
from torchvision import transforms

from plant_model import build_efficientnet_b0


DEFAULT_IMAGE_SIZE = 224
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

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


def load_class_mapping(
    mapping_path: str | Path,
) -> tuple[dict[str, int], dict[int, str]]:
    path = Path(mapping_path)

    if not path.exists():
        raise FileNotFoundError(f"Plant class mapping not found: {path}")

    payload = json.loads(path.read_text(encoding="utf-8"))

    class_to_idx = payload.get("class_to_idx")

    if not isinstance(class_to_idx, dict) or not class_to_idx:
        raise ValueError(f"Invalid plant class mapping file: {path}")

    idx_to_class = {
        idx: class_name
        for class_name, idx in class_to_idx.items()
    }

    return class_to_idx, idx_to_class


def load_plant_predictor(
    checkpoint_path: str | Path,
    mapping_path: str | Path,
) -> PlantDiseasePredictor:
    checkpoint_path = Path(checkpoint_path)

    if not checkpoint_path.exists():
        raise FileNotFoundError(
            f"Plant disease checkpoint not found: {checkpoint_path}"
        )

    class_to_idx, idx_to_class = load_class_mapping(mapping_path)

    device = torch.device("cpu")

    model = build_efficientnet_b0(
        num_classes=len(class_to_idx),
        pretrained=False,
    )

    try:
        state_dict = torch.load(
            checkpoint_path,
            map_location=device,
            weights_only=True,
        )
    except TypeError:
        state_dict = torch.load(
            checkpoint_path,
            map_location=device,
        )

    model.load_state_dict(state_dict)

    model.to(device)
    model.eval()

    return PlantDiseasePredictor(
        model=model,
        idx_to_class=idx_to_class,
        device=device,
    )


def preprocess_image_bytes(image_bytes: bytes) -> torch.Tensor:
    try:
        with Image.open(io.BytesIO(image_bytes)) as image:
            image = image.convert("RGB")
            return PLANT_INFERENCE_TRANSFORM(image).unsqueeze(0)

    except (OSError, UnidentifiedImageError) as exc:
        raise PlantInferenceError(
            "Image payload is not a readable image"
        ) from exc


def load_rgb_image(image_bytes: bytes) -> Image.Image:
    try:
        with Image.open(io.BytesIO(image_bytes)) as image:
            return image.convert("RGB")

    except (OSError, UnidentifiedImageError) as exc:
        raise PlantInferenceError(
            "Image payload is not a readable image"
        ) from exc


def classify_status(class_name: str) -> str:
    return "healthy" if "healthy" in class_name.lower() else "disease"


def format_class_name(class_name: str) -> str:
    return (
        class_name
        .replace("___", " ")
        .replace("__", " ")
        .replace("_", " ")
    )


def predict_plant_disease_from_bytes(
    image_bytes: bytes,
    predictor: PlantDiseasePredictor,
) -> dict:
    if not image_bytes:
        raise PlantInferenceError("Image payload cannot be empty")

    tensor = preprocess_image_bytes(image_bytes).to(
        predictor.device
    )

    with torch.no_grad():
        outputs = predictor.model(tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]

    top_count = min(5, len(predictor.idx_to_class))

    top_probabilities, top_indices = torch.topk(
        probabilities,
        k=top_count,
    )

    top_predictions = []

    for probability, idx in zip(
        top_probabilities.tolist(),
        top_indices.tolist(),
    ):
        class_name = predictor.idx_to_class[idx]

        top_predictions.append(
            {
                "class_name": class_name,
                "display_name": format_class_name(class_name),
                "confidence": round(
                    float(probability) * 100.0,
                    2,
                ),
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


def pil_to_data_url(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    payload = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{payload}"


def heatmap_to_rgba(heatmap: Image.Image, alpha: int = 145) -> Image.Image:
    heatmap = heatmap.convert("L")
    pixels = heatmap.load()
    rgba = Image.new("RGBA", heatmap.size)
    out = rgba.load()

    for y in range(heatmap.height):
        for x in range(heatmap.width):
            value = pixels[x, y]
            red = value
            green = int(max(0, 180 - abs(value - 145)))
            blue = int(max(0, 120 - value * 0.45))
            out[x, y] = (red, green, blue, int(alpha * (value / 255)))

    return rgba


def explain_plant_disease_from_bytes(
    image_bytes: bytes,
    predictor: PlantDiseasePredictor,
) -> dict:
    if not image_bytes:
        raise PlantInferenceError("Image payload cannot be empty")

    started_at = time.perf_counter()
    source_image = load_rgb_image(image_bytes)
    tensor = PLANT_INFERENCE_TRANSFORM(source_image).unsqueeze(0).to(
        predictor.device
    )
    tensor.requires_grad_(True)

    activations: list[torch.Tensor] = []
    gradients: list[torch.Tensor] = []
    target_layer = predictor.model.features[-1]

    def save_activation(_module, _input, output):
        activations.append(output)
        output.register_hook(lambda grad: gradients.append(grad))

    forward_handle = target_layer.register_forward_hook(save_activation)

    try:
        predictor.model.zero_grad(set_to_none=True)
        outputs = predictor.model(tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]
        target_idx = int(torch.argmax(probabilities).item())
        target_score = outputs[0, target_idx]
        target_score.backward()

    finally:
        forward_handle.remove()

    if not activations or not gradients:
        raise PlantInferenceError("Could not generate Grad-CAM activations")

    activation = activations[-1].detach()
    gradient = gradients[-1].detach()
    weights = gradient.mean(dim=(2, 3), keepdim=True)
    cam = torch.relu((weights * activation).sum(dim=1, keepdim=True))
    cam = F.interpolate(
        cam,
        size=(source_image.height, source_image.width),
        mode="bilinear",
        align_corners=False,
    )[0, 0]

    cam_min = cam.min()
    cam_max = cam.max()
    cam = (cam - cam_min) / (cam_max - cam_min + 1e-8)
    cam_image = Image.fromarray((cam.cpu().numpy() * 255).astype("uint8"))

    overlay = source_image.convert("RGBA")
    overlay.alpha_composite(heatmap_to_rgba(cam_image))
    model_ms = int((time.perf_counter() - started_at) * 1000)

    prediction = predict_plant_disease_from_bytes(
        image_bytes=image_bytes,
        predictor=predictor,
    )

    return {
        "prediction": prediction,
        "heatmap_base64": pil_to_data_url(cam_image.convert("RGB")),
        "overlay_base64": pil_to_data_url(overlay.convert("RGB")),
        "target_class": predictor.idx_to_class[target_idx],
        "model_inference_ms": model_ms,
    }

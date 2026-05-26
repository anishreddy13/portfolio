from pathlib import Path

import torch

from plant_model import build_efficientnet_b0


CHECKPOINT_PATH = Path(
    "models/plant_disease/best_model.pt"
)

OUTPUT_PATH = Path(
    "models/plant_disease/plant_model_state_dict_clean.pth"
)

device = torch.device("cpu")

checkpoint = torch.load(
    CHECKPOINT_PATH,
    map_location=device,
    weights_only=False,
)

model = build_efficientnet_b0(
    num_classes=15,
    pretrained=False,
)

state_dict = checkpoint["model_state_dict"]

clean_state_dict = {}

for key, value in state_dict.items():
    clean_state_dict[key] = value.cpu()

torch.save(
    clean_state_dict,
    OUTPUT_PATH,
    _use_new_zipfile_serialization=True,
)

print(
    f"Clean Linux-safe state_dict saved to: {OUTPUT_PATH}"
)
from __future__ import annotations

import torch.nn as nn
from torchvision import models


def build_efficientnet_b0(
    num_classes: int,
    freeze_backbone: bool = True,
    pretrained: bool = True,
) -> nn.Module:

    weights = (
        models.EfficientNet_B0_Weights.DEFAULT
        if pretrained
        else None
    )

    model = models.efficientnet_b0(weights=weights)

    in_features = model.classifier[1].in_features

    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, num_classes),
    )

    if freeze_backbone:
        freeze_efficientnet_backbone(model)

    return model


def freeze_efficientnet_backbone(model: nn.Module) -> None:
    for param in model.features.parameters():
        param.requires_grad = False

    for param in model.classifier.parameters():
        param.requires_grad = True


def unfreeze_last_feature_blocks(
    model: nn.Module,
    blocks: int = 2,
) -> None:

    freeze_efficientnet_backbone(model)

    if blocks <= 0:
        return

    feature_blocks = list(model.features.children())

    for block in feature_blocks[-blocks:]:
        for param in block.parameters():
            param.requires_grad = True


def count_trainable_parameters(model: nn.Module) -> int:
    return sum(
        param.numel()
        for param in model.parameters()
        if param.requires_grad
    )


def count_total_parameters(model: nn.Module) -> int:
    return sum(param.numel() for param in model.parameters())
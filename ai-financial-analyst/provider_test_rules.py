"""
provider_test_rules.py — Pure Provider Schema & Integration Test Rules

Contains validation functions for verifying NormalizedResponse wrappers, canonical entity field types,
Enum compliance, quality flag conformance, and compatibility score calculation.

No networking or provider implementations inside this module.
"""

from __future__ import annotations

import logging
from enum import Enum
from typing import Any, List, Optional, Tuple

from normalized_response import NormalizedResponse
from provider_test_models import SchemaValidationResult

logger = logging.getLogger("provider_test_rules")


def validate_normalized_wrapper(response: Any) -> SchemaValidationResult:
    """Validate that response is an instance of NormalizedResponse envelope with valid metadata."""
    res = SchemaValidationResult(target_name="NormalizedResponse")

    if not isinstance(response, NormalizedResponse):
        res.is_valid = False
        res.failed_checks += 1
        res.errors.append(f"Response is not an instance of NormalizedResponse. Got: {type(response)}")
        return res

    res.passed_checks += 1

    # Check required envelope fields
    if not hasattr(response, "value"):
        res.errors.append("NormalizedResponse missing 'value' field.")
        res.failed_checks += 1
    else:
        res.passed_checks += 1

    if not hasattr(response, "provider") or response.provider is None:
        res.errors.append("NormalizedResponse missing 'provider' field.")
        res.failed_checks += 1
    else:
        res.passed_checks += 1

    if not isinstance(response.confidence, (int, float)) or not (0.0 <= response.confidence <= 1.0):
        res.warnings.append(f"Confidence score out of standard range [0.0, 1.0]: {response.confidence}")
        res.failed_checks += 1
    else:
        res.passed_checks += 1

    if not isinstance(response.quality_flags, list):
        res.errors.append("NormalizedResponse 'quality_flags' must be a List[str].")
        res.failed_checks += 1
    else:
        res.passed_checks += 1

    res.is_valid = (len(res.errors) == 0)
    return res


def validate_entity_schema(entity: Any) -> SchemaValidationResult:
    """Validate that entity is a canonical dataclass with valid field types and Enum usages."""
    target = entity.__class__.__name__ if entity is not None else "None"
    res = SchemaValidationResult(target_name=target)

    if entity is None:
        res.warnings.append("Entity value is None.")
        res.passed_checks += 1
        return res

    # Check if object is a list of entities
    if isinstance(entity, list):
        res.passed_checks += 1
        for item in entity:
            sub_res = validate_entity_schema(item)
            res.passed_checks += sub_res.passed_checks
            res.failed_checks += sub_res.failed_checks
            res.errors.extend(sub_res.errors)
            res.warnings.extend(sub_res.warnings)
        res.is_valid = (len(res.errors) == 0)
        return res

    # Check for raw provider-specific object leakage (e.g. dict without to_dict or raw SDK objects)
    if not hasattr(entity, "to_dict"):
        res.errors.append(f"Raw un-normalized object leaked into domain model: {type(entity)}")
        res.failed_checks += 1
        res.is_valid = False
        return res

    res.passed_checks += 1

    # Check Enum attributes for Enum type compliance
    for field_name, value in getattr(entity, "__dict__", {}).items():
        if "status" in field_name or "exchange" in field_name or "asset" in field_name or "currency" in field_name:
            if value is not None and hasattr(value, "value"):
                res.passed_checks += 1
            elif isinstance(value, str):
                res.passed_checks += 1
            else:
                res.warnings.append(f"Field '{field_name}' in {target} is not a recognized Enum string: {value}")

    res.is_valid = (len(res.errors) == 0)
    return res


def validate_unsupported_quality_flag(response: Any) -> SchemaValidationResult:
    """Validate that unsupported data type queries correctly set QUALITY_FLAG = 'UNSUPPORTED_DATA_TYPE'."""
    res = SchemaValidationResult(target_name="UnsupportedDataTypeFlag")
    if isinstance(response, NormalizedResponse):
        if "UNSUPPORTED_DATA_TYPE" in response.quality_flags:
            res.passed_checks += 1
            res.is_valid = True
        else:
            res.warnings.append("Unsupported data type response did not include 'UNSUPPORTED_DATA_TYPE' quality flag.")
            res.failed_checks += 1
            res.is_valid = True  # Warning only
    return res


def validate_unavailable_quality_flag(response: Any) -> SchemaValidationResult:
    """Validate that provider unavailable queries correctly set QUALITY_FLAG = 'PROVIDER_UNAVAILABLE'."""
    res = SchemaValidationResult(target_name="ProviderUnavailableFlag")
    if isinstance(response, NormalizedResponse):
        if "PROVIDER_UNAVAILABLE" in response.quality_flags or "FALLBACK_BASELINE" in response.quality_flags:
            res.passed_checks += 1
            res.is_valid = True
        else:
            res.warnings.append("Unavailable response did not include 'PROVIDER_UNAVAILABLE' or 'FALLBACK_BASELINE' flag.")
            res.failed_checks += 1
            res.is_valid = True
    return res


def calculate_compatibility_score(validations: List[SchemaValidationResult]) -> float:
    """Calculate compatibility score percentage (0.0 to 100.0%) based on validation results."""
    total_passed = sum(v.passed_checks for v in validations)
    total_failed = sum(v.failed_checks for v in validations)
    total_checks = total_passed + total_failed

    if total_checks == 0:
        return 100.0

    score = (total_passed / total_checks) * 100.0
    return max(0.0, min(100.0, score))

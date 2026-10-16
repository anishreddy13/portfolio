from typing import Dict, List, Any
from datetime import datetime
from release_models import (
    ReleaseChecklist, VersionManifest, ReleaseStatus
)

def validate_release(checklist: ReleaseChecklist) -> bool:
    return all([
        checklist.unit_tests_pass,
        checklist.integration_tests_pass,
        checklist.build_successful,
        checklist.documentation_updated,
        checklist.security_audit_passed,
        checklist.demo_data_verified
    ])

def validate_documentation(docs_status: Dict[str, bool]) -> bool:
    required_docs = ["architecture", "api-reference", "user-guide", "deployment-guide"]
    for doc in required_docs:
        if not docs_status.get(doc, False):
            return False
    return True

def validate_configuration(config: Dict[str, Any]) -> bool:
    if "api_url" not in config or "environment" not in config:
        return False
    return True

def validate_demo_data(demo_data: Dict[str, Any]) -> bool:
    return "sample_portfolio" in demo_data and "sample_workspace" in demo_data

def generate_release_notes(version: str, features: List[str]) -> str:
    notes = f"# Release Notes for v{version}\n\n## New Features\n"
    for feature in features:
        notes += f"- {feature}\n"
    return notes

def generate_version_manifest(version: str, components: Dict[str, str]) -> VersionManifest:
    return VersionManifest(
        version=version,
        components=components,
        release_date=datetime.utcnow()
    )

def release_ready(status: ReleaseStatus) -> bool:
    return status == ReleaseStatus.APPROVED

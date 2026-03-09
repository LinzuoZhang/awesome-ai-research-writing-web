"""
Prompt templates for AI academic writing assistant.
Extracted from README.md prompt collection.
"""

import json
import os
from dataclasses import dataclass
from typing import Literal


@dataclass
class PromptTemplate:
    """Represents a prompt template for text processing."""
    id: str
    name: str
    name_en: str
    description: str
    template: str
    input_placeholder: str
    output_format: Literal['latex', 'text', 'word']
    category: Literal['translation', 'adjustment', 'polishing', 'review', 'other']
    input_type: str = 'text'
    accepted_formats: list = None


def _load_templates() -> list[PromptTemplate]:
    """Load templates from prompts.json and template files."""
    # Get the directory where this file is located
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, 'prompts.json')

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    templates = []
    for prompt_data in data['prompts']:
        # Read the template file content
        template_file_path = os.path.join(base_dir, prompt_data['template_file'])
        with open(template_file_path, 'r', encoding='utf-8') as f:
            template_content = f.read()

        template = PromptTemplate(
            id=prompt_data['id'],
            name=prompt_data['name'],
            name_en=prompt_data['name_en'],
            description=prompt_data['description'],
            template=template_content,
            input_placeholder=prompt_data['input_placeholder'],
            output_format=prompt_data['output_format'],
            category=prompt_data['category'],
            input_type=prompt_data.get('input_type', 'text'),
            accepted_formats=prompt_data.get('accepted_formats', [])
        )
        templates.append(template)

    return templates


# Core templates for translation, abbreviation, and expansion
TEMPLATES = _load_templates()


def get_template_by_id(template_id: str) -> PromptTemplate | None:
    """Get a template by its ID."""
    for template in TEMPLATES:
        if template.id == template_id:
            return template
    return None


def get_templates_by_category(category: str) -> list[PromptTemplate]:
    """Get all templates in a category."""
    return [t for t in TEMPLATES if t.category == category]

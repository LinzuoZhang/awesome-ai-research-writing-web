"""
Configuration file for the AI writing assistant web app.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Configuration class."""

    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

    # API Keys (can be overridden by environment variables)
    ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')

    # Default models
    DEFAULT_ANTHROPIC_MODEL = os.environ.get('ANTHROPIC_MODEL', 'claude-sonnet-4-20250514')
    DEFAULT_OPENAI_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-4.1')

    # Request limits
    MAX_INPUT_LENGTH = int(os.environ.get('MAX_INPUT_LENGTH', 10000))
    REQUEST_TIMEOUT = int(os.environ.get('REQUEST_TIMEOUT', 120))

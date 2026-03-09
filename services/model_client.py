"""
Model client for calling LLM APIs (Anthropic, OpenAI, and compatible endpoints)
"""

from typing import Optional


class ModelClient:
    """Client for calling large language model APIs."""

    def __init__(self, api_key: str, api_url: str, model: Optional[str] = None):
        """
        Initialize the model client.

        Args:
            api_key: API key for authentication
            api_url: Base URL of the API endpoint
            model: Optional default model name
        """
        self.api_key = api_key
        self.api_url = api_url.rstrip('/')
        self.model = model
        self._client = None
        self._client_type = None
        self._init_client()

    def _init_client(self):
        """Initialize the appropriate client based on URL."""
        url_lower = self.api_url.lower()

        # Detect client type based on URL
        if 'anthropic' in url_lower:
            self._client_type = 'anthropic'
            try:
                from anthropic import Anthropic
                self._client = Anthropic(
                    api_key=self.api_key,
                    base_url=self.api_url if not self.api_url.endswith('/v1') else self.api_url[:-3]
                )
            except ImportError:
                raise ImportError("Please install anthropic: pip install anthropic")
        else:
            # Default to OpenAI-compatible client
            self._client_type = 'openai'
            try:
                from openai import OpenAI
                self._client = OpenAI(
                    api_key=self.api_key,
                    base_url=self.api_url
                )
            except ImportError:
                raise ImportError("Please install openai: pip install openai")

    def generate(self, prompt: str, input_text: str, model: Optional[str] = None) -> str:
        """
        Generate response from the model.

        Args:
            prompt: The prompt template
            input_text: The input text to process
            model: Optional model name override

        Returns:
            The generated response text
        """
        full_prompt = f"{prompt}\n\n# Input\n{input_text}"
        use_model = model or self.model

        if self._client_type == 'anthropic':
            return self._generate_anthropic(full_prompt, use_model)
        else:
            return self._generate_openai(full_prompt, use_model)

    def _generate_anthropic(self, prompt: str, model: Optional[str] = None) -> str:
        """Generate response using Anthropic API."""
        if model is None:
            model = "claude-sonnet-4-20250514"

        response = self._client.messages.create(
            model=model,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text

    def _generate_openai(self, prompt: str, model: Optional[str] = None) -> str:
        """Generate response using OpenAI-compatible API."""
        if model is None:
            model = "gpt-4.1"

        response = self._client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4096
        )
        return response.choices[0].message.content


class ModelClientFactory:
    """Factory for creating model clients."""

    _clients = {}

    @classmethod
    def get_client(cls, api_url: str, api_key: str, model: Optional[str] = None) -> ModelClient:
        """Get or create a client for the specified URL."""
        key = f"{api_url}:{api_key[:8]}"

        if key not in cls._clients:
            cls._clients[key] = ModelClient(api_key=api_key, api_url=api_url, model=model)

        return cls._clients[key]

    @classmethod
    def clear_cache(cls):
        """Clear the client cache."""
        cls._clients.clear()

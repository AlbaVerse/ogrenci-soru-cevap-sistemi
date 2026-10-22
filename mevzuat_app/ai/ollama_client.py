import os
import logging
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

logger = logging.getLogger(__name__)

FALLBACK_MODELS = [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "mixtral-8x7b-32768",
]

class OllamaClientError(RuntimeError):
    """LLM ile iletişim sırasında oluşan hatalar."""

class OllamaClient:
    def __init__(self, model_name=None, timeout=30, **kwargs):
        self.timeout = timeout
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        if not self.api_key:
            raise OllamaClientError("GROQ_API_KEY ortam değişkeni bulunamadı. Lütfen .env dosyanızı kontrol edin.")
        self.client = Groq(api_key=self.api_key, timeout=timeout)

    def generate(self, prompt, system=None):
        if not isinstance(prompt, str) or not prompt.strip():
            raise ValueError("Prompt boş olamaz.")

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        last_exception = None
        for model in FALLBACK_MODELS:
            try:
                chat_completion = self.client.chat.completions.create(
                    messages=messages,
                    model=model,
                    temperature=0.2,
                    max_tokens=600,
                )
                answer = chat_completion.choices[0].message.content or ""
                if answer.strip():
                    return answer.strip()
            except Exception as exc:
                logger.warning("Model %s başarısız: %s", model, exc)
                last_exception = exc

        raise OllamaClientError(f"Tüm Groq modelleri başarısız oldu. Son hata: {last_exception}")
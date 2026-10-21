import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

MODEL_NAME = "llama-3.3-70b-versatile"


class OllamaClientError(RuntimeError):
    """LLM ile iletisim sirasinda olusan hatalar."""


class OllamaClient:
    def __init__(
        self,
        model_name=MODEL_NAME,
        timeout=60,
        **kwargs,
    ):
        self.model_name = model_name
        self.timeout = timeout
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise OllamaClientError(
                "GROQ_API_KEY ortam degiskeni bulunamadi. Lutfen .env dosyasina veya ortama ekleyin."
            )
        self.client = Groq(api_key=api_key, timeout=timeout)

    def generate(self, prompt, system=None):
        """Groq uzerinden modeli cagirir ve yaniti dondurur."""
        if not isinstance(prompt, str) or not prompt.strip():
            raise ValueError("Prompt bos olamaz.")

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        try:
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model=self.model_name,
                temperature=0.2,
                max_completion_tokens=600,
            )
            answer = chat_completion.choices[0].message.content or ""
        except Exception as exc:
            raise OllamaClientError(f"Groq API baglanti/yanit hatasi: {exc}") from exc

        answer = answer.strip()
        if not answer:
            raise OllamaClientError("Model bos yanit dondurdu.")

        return answer

import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

MODEL_NAME = "qwen3:4b-instruct-2507-q4_K_M"
OLLAMA_BASE_URL = os.getenv(
    "OLLAMA_BASE_URL",
    "http://localhost:11434",
).rstrip("/")


class OllamaClientError(RuntimeError):
    """Ollama ile iletişim sırasında oluşan hatalar."""


class OllamaClient:
    def __init__(
        self,
        model_name=MODEL_NAME,
        base_url=OLLAMA_BASE_URL,
        timeout=120,
    ):
        self.model_name = model_name
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def generate(self, prompt, system=None):
        """Ollama modelinden bir yanıt alır."""

        if not isinstance(prompt, str) or not prompt.strip():
            raise ValueError("Prompt boş olamaz.")

        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.2,
                "num_predict": 700,
            },
        }

        if system:
            payload["system"] = system

        request = Request(
            url=f"{self.base_url}/api/generate",
            data=json.dumps(
                payload,
                ensure_ascii=False,
            ).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urlopen(request, timeout=self.timeout) as response:
                result = json.loads(
                    response.read().decode("utf-8")
                )
        except HTTPError as exc:
            details = exc.read().decode("utf-8", errors="replace")
            raise OllamaClientError(
                f"Ollama HTTP hatası ({exc.code}): {details}"
            ) from exc
        except (URLError, TimeoutError, OSError) as exc:
            raise OllamaClientError(
                "Ollama'ya bağlanılamadı. "
                "Ollama'nın çalıştığını kontrol edin."
            ) from exc
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise OllamaClientError(
                "Ollama geçerli bir yanıt döndürmedi."
            ) from exc

        answer = result.get("response", "").strip()

        if not answer:
            raise OllamaClientError(
                "Ollama boş bir yanıt döndürdü."
            )

        return answer

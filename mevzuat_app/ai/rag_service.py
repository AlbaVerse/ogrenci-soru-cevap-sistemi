"""Mevzuat arama ve Ollama ile cevap üretme servisi."""

import re
import time
import unicodedata
from collections import Counter
from dataclasses import dataclass

from mevzuat_app.ai.ollama_client import OllamaClient
from mevzuat_app.models import Kaynak, Mevzuat


NO_INFO_MESSAGE = (
    "Üniversite mevzuatında bu konuyla ilgili net bir bilgi "
    "bulunmamaktadır, lütfen öğrenci işlerine danışınız."
)

SYSTEM_PROMPT = """
Sen OSTİM Teknik Üniversitesi Dijital Danışmanı ALBA'sın.

Kurallar:
1. Yalnızca sana verilen resmi mevzuat metinlerine dayan.
2. Mevzuatta bulunmayan bilgi, tarih, şart veya madde uydurma.
3. Cevap için yeterli bilgi yoksa yalnızca şu cümleyi yaz:
   "Üniversite mevzuatında bu konuyla ilgili net bir bilgi
   bulunmamaktadır, lütfen öğrenci işlerine danışınız."
4. Cevap varsa bu uyarı cümlesini cevabın sonuna ekleme.
5. Türkçe, açık ve anlaşılır cevap ver.
6. Yararlanılan kaynakları [M1], [M2] gibi etiketlerle belirt.
7. Yalnızca nihai cevabı üret.
"""

STOP_WORDS = {
    "bir", "ve", "veya", "ile", "icin", "hakkinda",
    "bana", "lutfen", "misin", "misiniz", "olur",
    "olabilir", "acikla", "aciklar", "verebilir",
    "nedir", "nasil", "hangi", "var", "yok",
}


def normalize_text(text):
    """Türkçe karakterleri arama için standartlaştırır."""
    translation = str.maketrans({
        "İ": "i", "I": "i", "ı": "i",
        "Ş": "s", "ş": "s",
        "Ğ": "g", "ğ": "g",
        "Ü": "u", "ü": "u",
        "Ö": "o", "ö": "o",
        "Ç": "c", "ç": "c",
    })

    text = text.translate(translation)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(
        char for char in text
        if not unicodedata.combining(char)
    )
    return text.lower()


def tokenize(text):
    """Metni aranabilir kelimelere ayırır."""
    words = re.findall(r"[a-z0-9]+", normalize_text(text))
    return [
        word for word in words
        if len(word) >= 3 and word not in STOP_WORDS
    ]


def has_prefix_match(term, words):
    """Bazı kelime ekleri nedeniyle oluşan farklılıkları yakalar."""
    if len(term) < 4:
        return False

    return any(
        len(word) >= 4
        and (word.startswith(term) or term.startswith(word))
        for word in words
    )


@dataclass(frozen=True)
class RAGResponse:
    """Ortak sohbet servisinin beklediği cevap yapısı."""

    answer_text: str
    mevzuat_ids: list[int]
    confidence_score: float
    response_time_ms: int


class RAGService:
    """Soruyla ilgili mevzuatları bulur ve Ollama'dan cevap alır."""

    def __init__(self, client=None, top_k=5):
        self.client = client or OllamaClient()
        self.top_k = top_k
        self.minimum_score = 2.5

    def _search_records(self, question):
        """Mevzuat parçalarını kelime eşleşmelerine göre sıralar."""
        query_terms = set(tokenize(question))

        if not query_terms:
            return []

        queryset = Mevzuat.objects.select_related("category").only(
            "id",
            "title",
            "content",
            "chunk_index",
            "source_file",
            "category__id",
            "category__name",
        )

        ranked = []

        for item in queryset.iterator(chunk_size=500):
            title_words = Counter(tokenize(item.title))
            content_words = Counter(tokenize(item.content))

            title_set = set(title_words)
            content_set = set(content_words)
            score = 0.0

            for term in query_terms:
                if term in title_words:
                    score += 5.0

                if term in content_words:
                    score += 2.0
                    score += min(content_words[term], 3) * 0.2
                elif has_prefix_match(term, content_set):
                    score += 0.8

                if (
                    term not in title_words
                    and has_prefix_match(term, title_set)
                ):
                    score += 1.5

            if score >= self.minimum_score:
                ranked.append((score, item))

        ranked.sort(
            key=lambda result: (result[0], result[1].id),
            reverse=True,
        )

        return ranked[:self.top_k]

    def _get_source_details(self, item):
        """Mevzuatın dosya ve sayfa bilgisini alır."""
        source = (
            Kaynak.objects
            .filter(mevzuat_id=item.id)
            .order_by("page_number")
            .first()
        )

        source_file = item.source_file or (
            source.url_or_path if source else "Kaynak belirtilmemiş"
        )
        page_number = (
            source.page_number if source else "Belirtilmemiş"
        )

        return source_file, page_number

    def generate_answer(self, question_text):
        """Ortak backend'in çağıracağı ana metot."""
        start_time = time.perf_counter()

        ranked = self._search_records(question_text)

        if not ranked:
            return RAGResponse(
                answer_text=NO_INFO_MESSAGE,
                mevzuat_ids=[],
                confidence_score=0.0,
                response_time_ms=int(
                    (time.perf_counter() - start_time) * 1000
                ),
            )

        # Kaynak etiketlerinin API'de dönen kaynak sırasıyla eşleşmesi için
        # seçilen kayıtları ID'ye göre sıralıyoruz.
        ranked.sort(key=lambda result: result[1].id)

        context_parts = []
        mevzuat_ids = []

        for index, (_, item) in enumerate(ranked, start=1):
            source_file, page_number = self._get_source_details(item)

            context_parts.append(
                f"[M{index}]\n"
                f"Başlık: {item.title}\n"
                f"Kategori: {item.category.name}\n"
                f"Dosya: {source_file}\n"
                f"Sayfa: {page_number}\n"
                f"Mevzuat metni:\n{item.content}"
            )

            mevzuat_ids.append(item.id)

        prompt = (
            "Aşağıdaki resmi mevzuat parçalarını incele.\n\n"
            + "\n\n---\n\n".join(context_parts)
            + "\n\nÖğrencinin sorusu:\n"
            + question_text
            + "\n\nYanıtını yalnızca verilen mevzuatlara dayandır. "
            "Kaynak etiketlerini doğru kullan."
        )

        answer = self.client.generate(
            prompt,
            system=SYSTEM_PROMPT,
        )

        elapsed_ms = int(
            (time.perf_counter() - start_time) * 1000
        )

        return RAGResponse(
            answer_text=answer,
            mevzuat_ids=mevzuat_ids,
            # Prototip için geçici gösterge; kalibre edilmiş olasılık değildir.
            confidence_score=0.65,
            response_time_ms=elapsed_ms,
        )

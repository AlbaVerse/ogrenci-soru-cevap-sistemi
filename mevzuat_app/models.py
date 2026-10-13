import uuid
from django.db import models
from django.conf import settings


class Kategori(models.Model):
    name = models.CharField(max_length=255, unique=True, verbose_name="Kategori Adı")
    slug = models.SlugField(max_length=255, unique=True, verbose_name="Slug")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma Tarihi")

    class Meta:
        db_table = "kategori"
        verbose_name = "Kategori"
        verbose_name_plural = "Kategoriler"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Mevzuat(models.Model):
    title = models.CharField(max_length=500, verbose_name="Başlık")
    content = models.TextField(verbose_name="İçerik/Metin")
    chunk_index = models.IntegerField(default=0, verbose_name="Parça No")
    category = models.ForeignKey(
        Kategori, 
        on_delete=models.CASCADE, 
        related_name="mevzuatlar", 
        verbose_name="Kategori"
    )
    source_file = models.CharField(max_length=255, blank=True, null=True, verbose_name="Dosya Adı")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma Tarihi")

    class Meta:
        db_table = "mevzuat"
        verbose_name = "Mevzuat"
        verbose_name_plural = "Mevzuatlar"
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.title} (Parça {self.chunk_index})"


class Kaynak(models.Model):
    mevzuat = models.ForeignKey(
        Mevzuat, 
        on_delete=models.CASCADE, 
        related_name="kaynaklar", 
        verbose_name="Mevzuat"
    )
    url_or_path = models.CharField(max_length=500, verbose_name="URL veya Dosya Yolu")
    page_number = models.IntegerField(default=1, verbose_name="Sayfa Numarası")

    class Meta:
        db_table = "kaynak"
        verbose_name = "Kaynak"
        verbose_name_plural = "Kaynaklar"

    def __str__(self) -> str:
        return f"{self.mevzuat.title} - Sayfa: {self.page_number}"


class Soru(models.Model):
    session_id = models.UUIDField(default=uuid.uuid4, editable=False, verbose_name="Oturum ID")
    query_text = models.TextField(verbose_name="Soru Metni")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Sorma Tarihi")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="sorular",
        verbose_name="Kullanıcı",
    )

    class Meta:
        db_table = "soru"
        verbose_name = "Soru"
        verbose_name_plural = "Sorular"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Soru: {self.query_text[:30]}..."


class Cevap(models.Model):
    question = models.OneToOneField(
        Soru, 
        on_delete=models.CASCADE, 
        related_name="cevap", 
        verbose_name="Soru"
    )
    class Status(models.TextChoices):
        ANSWERED = "answered", "Yanıtlandı"
        OUT_OF_SCOPE = "out_of_scope", "Kapsam dışı"
        FAILED = "failed", "Hata"

    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.ANSWERED,
        db_index=True,
    )
    answer_text = models.TextField(verbose_name="Cevap Metni")
    confidence_score = models.FloatField(default=0.0, verbose_name="Güven Skoru")
    response_time_ms = models.IntegerField(default=0, verbose_name="Cevap Süresi (ms)")
    referenced_mevzuats = models.ManyToManyField(
        Mevzuat, 
        related_name="cevaplar", 
        verbose_name="Atıfta Bulunulan Mevzuatlar"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma Tarihi")

    class Meta:
        db_table = "cevap"
        verbose_name = "Cevap"
        verbose_name_plural = "Cevaplar"

    def __str__(self) -> str:
        return f"Cevap ({self.question.id})"
# Create your models here.

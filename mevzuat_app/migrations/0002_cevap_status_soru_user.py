import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def fix_old_rows(apps, schema_editor):
    Cevap = apps.get_model("mevzuat_app", "Cevap")
    Cevap.objects.filter(confidence_score=0).update(status="out_of_scope")


class Migration(migrations.Migration):

    dependencies = [
        ("mevzuat_app", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="cevap",
            name="status",
            field=models.CharField(
                choices=[
                    ("answered", "Yanıtlandı"),
                    ("out_of_scope", "Kapsam dışı"),
                    ("failed", "Hata"),
                ],
                db_index=True,
                default="answered",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="soru",
            name="user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="sorular",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Kullanıcı",
            ),
        ),
        migrations.RunPython(code=fix_old_rows, reverse_code=migrations.RunPython.noop),
    ]
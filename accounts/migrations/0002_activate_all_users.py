from django.db import migrations


def activate_users(apps, schema_editor):
    User = apps.get_model("auth", "User")
    User.objects.all().update(is_active=True)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(activate_users, reverse_code=migrations.RunPython.noop),
    ]

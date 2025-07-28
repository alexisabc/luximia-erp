from django.db import migrations
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType


def create_permissions(apps, schema_editor):
    content_type, _ = ContentType.objects.get_or_create(app_label='cxc', model='extrapermission')
    Permission.objects.get_or_create(
        codename='can_view_inactive_records',
        name='Puede ver registros inactivos',
        content_type=content_type,
    )
    Permission.objects.get_or_create(
        codename='can_delete_permanently',
        name='Puede eliminar permanentemente',
        content_type=content_type,
    )
    Permission.objects.get_or_create(
        codename='can_view_auditlog',
        name='Puede ver auditoría',
        content_type=content_type,
    )


class Migration(migrations.Migration):

    dependencies = [
        ('cxc', '0005_custom_permissions'),
    ]

    operations = [
        migrations.RunPython(create_permissions, reverse_code=migrations.RunPython.noop),
    ]

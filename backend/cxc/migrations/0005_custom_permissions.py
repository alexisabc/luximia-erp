from django.db import migrations, models
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType


def create_permissions(apps, schema_editor):
    content_type, _ = ContentType.objects.get_or_create(app_label='cxc', model='extrapermission')
    Permission.objects.get_or_create(
        codename='can_view_dashboard',
        name='Puede ver dashboard',
        content_type=content_type,
    )
    Permission.objects.get_or_create(
        codename='can_use_ai',
        name='Puede usar IA',
        content_type=content_type,
    )
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
        ('cxc', '0004_contrato_activo_pago_activo_plandepagos_activo_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='ExtraPermission',
            fields=[],
            options={
                'managed': False,
                'permissions': [
                    ('can_view_dashboard', 'Puede ver dashboard'),
                    ('can_use_ai', 'Puede usar IA'),
                    ('can_view_inactive_records', 'Puede ver registros inactivos'),
                    ('can_delete_permanently', 'Puede eliminar permanentemente'),
                    ('can_view_auditlog', 'Puede ver auditoría'),
                ],
            },
        ),
        migrations.RunPython(create_permissions, reverse_code=migrations.RunPython.noop),
    ]

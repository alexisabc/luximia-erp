from django.db import migrations
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType


def translate_auth_permissions(apps, schema_editor):
    translations = {
        'add_user': 'Añadir usuario',
        'change_user': 'Cambiar usuario',
        'delete_user': 'Eliminar usuario',
        'view_user': 'Ver usuario',
        'add_group': 'Añadir rol',
        'change_group': 'Cambiar rol',
        'delete_group': 'Eliminar rol',
        'view_group': 'Ver rol',
    }
    for codename, name in translations.items():
        Permission.objects.filter(codename=codename).update(name=name)


class Migration(migrations.Migration):

    dependencies = [
        ('cxc', '0007_auditlog'),
    ]

    operations = [
        migrations.RunPython(translate_auth_permissions, reverse_code=migrations.RunPython.noop),
    ]

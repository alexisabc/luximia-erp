from django.db import migrations
from pgvector.django import VectorField


class Migration(migrations.Migration):

    dependencies = [
        ('cxc', '0002_document_embedding'),
    ]

    operations = [
        migrations.AlterField(
            model_name='documentembedding',
            name='embedding',
            field=VectorField(dimensions=1536),
        ),
    ]

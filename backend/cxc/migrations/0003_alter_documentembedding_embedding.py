from django.db import migrations
import pgvector.django


class Migration(migrations.Migration):

    dependencies = [
        ('cxc', '0002_document_embedding'),
    ]

    operations = [
        migrations.AlterField(
            model_name='documentembedding',
            name='embedding',
            field=pgvector.django.fields.VectorField(dimensions=1536),
        ),
    ]

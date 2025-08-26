from django.db import migrations, models
import pgvector.django


class Migration(migrations.Migration):

    dependencies = [
        ('cxc', '0001_initial'),
    ]

    operations = [
        pgvector.django.operations.VectorExtension(),
        migrations.CreateModel(
            name='DocumentEmbedding',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('embedding', pgvector.django.fields.VectorField(dim=1536)),
            ],
        ),
    ]

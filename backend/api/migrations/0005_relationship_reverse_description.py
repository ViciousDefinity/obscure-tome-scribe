# Generated by Django 5.1.7 on 2025-03-23 03:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_relationship'),
    ]

    operations = [
        migrations.AddField(
            model_name='relationship',
            name='reverse_description',
            field=models.CharField(default='is realted to', max_length=255),
            preserve_default=False,
        ),
    ]

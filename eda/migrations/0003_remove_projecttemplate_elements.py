# Generated by Django 3.2.7 on 2021-10-10 21:52

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('eda', '0002_auto_20211010_2132'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='projecttemplate',
            name='elements',
        ),
    ]

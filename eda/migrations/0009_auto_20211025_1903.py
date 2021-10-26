# Generated by Django 3.1.6 on 2021-10-25 19:03

from django.db import migrations, models
import eda.models


class Migration(migrations.Migration):

    dependencies = [
        ('eda', '0008_auto_20211025_1901'),
    ]

    operations = [
        migrations.AlterField(
            model_name='element',
            name='id',
            field=models.CharField(default=eda.models.new_element_id, max_length=250, primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name='element',
            name='name',
            field=models.CharField(default='New Element', max_length=250),
        ),
    ]

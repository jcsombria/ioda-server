# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0014_job_user'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='job',
            name='id',
        ),
        migrations.RemoveField(
            model_name='job',
            name='list',
        ),
        migrations.AlterField(
            model_name='job',
            name='name',
            field=models.TextField(primary_key=True, serialize=False, default=''),
            preserve_default=True,
        ),
    ]

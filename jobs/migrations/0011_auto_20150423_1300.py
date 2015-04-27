# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import jobs.models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0010_auto_20150410_1521'),
    ]

    operations = [
        migrations.AddField(
            model_name='runningjob',
            name='status',
            field=models.TextField(default='unknown'),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='runningjob',
            name='input',
            field=models.FileField(upload_to=jobs.models.get_upload_path, default=None),
            preserve_default=True,
        ),
    ]

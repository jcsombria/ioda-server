# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0008_runningjob_timestamp'),
    ]

    operations = [
        migrations.AddField(
            model_name='runningjob',
            name='input',
            field=models.FileField(default=None, upload_to=''),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='runningjob',
            name='output',
            field=models.FileField(default=None, upload_to=''),
            preserve_default=True,
        ),
    ]

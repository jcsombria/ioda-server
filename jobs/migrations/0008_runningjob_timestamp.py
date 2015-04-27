# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0007_auto_20150409_1733'),
    ]

    operations = [
        migrations.AddField(
            model_name='runningjob',
            name='timestamp',
            field=models.DateTimeField(default=None, auto_now_add=True),
            preserve_default=True,
        ),
    ]

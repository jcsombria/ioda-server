# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0013_auto_20150428_1419'),
    ]

    operations = [
        migrations.AddField(
            model_name='job',
            name='user',
            field=models.TextField(default=''),
            preserve_default=True,
        ),
    ]

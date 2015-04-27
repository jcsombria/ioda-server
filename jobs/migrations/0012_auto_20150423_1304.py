# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0011_auto_20150423_1300'),
    ]

    operations = [
        migrations.AlterField(
            model_name='runningjob',
            name='status',
            field=models.TextField(default=''),
            preserve_default=True,
        ),
    ]

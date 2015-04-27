# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0004_list_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='password',
            field=models.TextField(default=''),
            preserve_default=True,
        ),
    ]

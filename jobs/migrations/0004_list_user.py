# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0003_user_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='list',
            name='user',
            field=models.TextField(default=''),
            preserve_default=True,
        ),
    ]

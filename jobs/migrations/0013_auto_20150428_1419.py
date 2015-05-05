# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0012_auto_20150423_1304'),
    ]

    operations = [
        migrations.AddField(
            model_name='job',
            name='backend',
            field=models.CharField(choices=[('TO', 'Torque'), ('CO', 'Condor')], default='TO', max_length=2),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='job',
            name='host',
            field=models.GenericIPAddressField(default='0.0.0.0'),
            preserve_default=True,
        ),
    ]

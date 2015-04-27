# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0005_user_password'),
    ]

    operations = [
        migrations.CreateModel(
            name='RunningJob',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('job', models.ForeignKey(default=None, to='jobs.Job')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]

# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import jobs.models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('auth', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Job',
            fields=[
                ('name', models.CharField(serialize=False, default='', max_length=250, primary_key=True)),
                ('input', models.TextField(default='')),
                ('output', models.CharField(default='', max_length=255)),
                ('description', models.TextField(default='')),
                ('host', models.GenericIPAddressField(default='0.0.0.0')),
                ('user', models.CharField(default='', max_length=255)),
                ('backend', models.CharField(default='TO', max_length=2, choices=[('TO', 'Torque'), ('CO', 'Condor')])),
                ('job_path', models.CharField(max_length=255)),
                ('results_path', models.CharField(max_length=255)),
                ('tmp_path', models.CharField(max_length=255)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='RunningJob',
            fields=[
                ('id', models.AutoField(serialize=False, verbose_name='ID', primary_key=True, auto_created=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True, default=None)),
                ('expiration_date', models.DateTimeField(default=jobs.models._get_expiration_date)),
                ('runningjob_id', models.CharField(default='', max_length=255)),
                ('status', models.CharField(default='', max_length=255)),
                ('input', models.FileField(default=None, upload_to=jobs.models.get_upload_path)),
                ('output', models.FileField(default=None, upload_to='')),
                ('notified_completed', models.BooleanField(default=False)),
                ('notified_expiration', models.BooleanField(default=False)),
                ('job', models.ForeignKey(to='jobs.Job', default=None)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('user', models.OneToOneField(serialize=False, primary_key=True, to=settings.AUTH_USER_MODEL, default=None)),
                ('expiration_date', models.DateTimeField(default=jobs.models._get_expiration_date)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AddField(
            model_name='runningjob',
            name='user',
            field=models.ForeignKey(to=settings.AUTH_USER_MODEL, default=None),
            preserve_default=True,
        ),
    ]

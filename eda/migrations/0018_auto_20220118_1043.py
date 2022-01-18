# Generated by Django 3.2.7 on 2022-01-18 10:43

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('eda', '0017_auto_20220114_1558'),
    ]

    operations = [
        migrations.CreateModel(
            name='DefaultElement',
            fields=[
                ('element_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='eda.element')),
            ],
            bases=('eda.element',),
        ),
        migrations.RenameField(
            model_name='elementgroup',
            old_name='position_in_group',
            new_name='position_in_groups',
        ),
        migrations.RemoveField(
            model_name='elementgroup',
            name='after',
        ),
        migrations.RemoveField(
            model_name='elementgroup',
            name='before',
        ),
        migrations.RemoveField(
            model_name='elementgroup',
            name='project',
        ),
        migrations.AddField(
            model_name='element',
            name='group',
            field=models.ManyToManyField(to='eda.ElementGroup'),
        ),
        migrations.AddField(
            model_name='element',
            name='language',
            field=models.CharField(choices=[('PY', 'Python'), ('C', 'C'), ('MA', 'Matlab')], default='PY', max_length=2),
        ),
        migrations.AddField(
            model_name='element',
            name='nick',
            field=models.CharField(default='new_element', max_length=250),
        ),
        migrations.AlterField(
            model_name='element',
            name='description',
            field=models.CharField(blank=True, default='A new Element', max_length=500),
        ),
        migrations.AlterField(
            model_name='element',
            name='help',
            field=models.CharField(blank=True, max_length=250),
        ),
        migrations.AlterField(
            model_name='element',
            name='id',
            field=models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
        migrations.AlterField(
            model_name='element',
            name='properties',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.CreateModel(
            name='UserElement',
            fields=[
                ('element_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='eda.element')),
                ('user', models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            bases=('eda.element',),
        ),
        migrations.CreateModel(
            name='DefaultElementGroup',
            fields=[
                ('elementgroup_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='eda.elementgroup')),
                ('projectTemplate', models.ManyToManyField(to='eda.ProjectTemplate')),
            ],
            bases=('eda.elementgroup',),
        ),
        migrations.CreateModel(
            name='UserElementGroup',
            fields=[
                ('elementgroup_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='eda.elementgroup')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.RESTRICT, to='eda.project')),
            ],
            bases=('eda.elementgroup',),
        ),
    ]

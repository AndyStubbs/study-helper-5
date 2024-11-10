# Generated by Django 5.1.2 on 2024-11-09 14:55

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('topics', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Question',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.CharField(max_length=500)),
                ('answers', models.JSONField(help_text='Store answers as a JSON array')),
                ('correct', models.IntegerField(help_text='Index of the correct answer in the answers array')),
                ('concepts', models.CharField(help_text='Comma-separated list of core concepts related to the question', max_length=300)),
                ('topic', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='questions', to='topics.topic')),
            ],
        ),
    ]

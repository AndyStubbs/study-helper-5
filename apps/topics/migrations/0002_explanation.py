# Generated by Django 5.1.2 on 2024-11-13 18:18

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('topics', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Explanation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField(help_text='Detailed explanation for the question.')),
                ('question', models.OneToOneField(help_text='The question that this explanation is linked to.', on_delete=django.db.models.deletion.CASCADE, related_name='explanation', to='topics.question')),
            ],
        ),
    ]
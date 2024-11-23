# Generated by Django 5.1.2 on 2024-11-22 22:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('topics', '0002_topic_topic_data'),
    ]

    operations = [
        migrations.AddField(
            model_name='question',
            name='source',
            field=models.TextField(blank=True, help_text='Additional details added for the source of the question.', max_length=500),
        ),
    ]

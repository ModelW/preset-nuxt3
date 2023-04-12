# Generated by Django 4.1.5 on 2023-01-31 15:29

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("cms", "0003_homepage_main_text"),
    ]

    operations = [
        migrations.AddField(
            model_name="homepage",
            name="main_image",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="cms.customimage",
            ),
        ),
    ]

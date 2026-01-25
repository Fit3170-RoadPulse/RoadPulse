# Generated migration for adding redeemed_at field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rp_core', '0005_appuser_cumulative_distance_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='rewardredemption',
            name='redeemed_at',
            field=models.DateTimeField(blank=True, help_text='When the voucher was actually redeemed/used', null=True),
        ),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("rp_core", "0004_pointtransaction"),
    ]

    operations = [
        migrations.AddField(
            model_name="appuser",
            name="cumulative_distance",
            field=models.FloatField(
                default=0.0,
                help_text="Total distance travelled by the user (kilometres)",
            ),
            preserve_default=True,
        ),
    ]

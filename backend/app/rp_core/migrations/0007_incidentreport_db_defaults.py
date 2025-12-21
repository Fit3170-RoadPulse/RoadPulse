from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("rp_core", "0006_provisional_points"),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                # Ensure DB-level defaults exist so inserts from older code paths
                # (or partial field sets) don't violate NOT NULL constraints.
                "ALTER TABLE rp_core_incidentreport ALTER COLUMN yes_votes SET DEFAULT 0;",
                "ALTER TABLE rp_core_incidentreport ALTER COLUMN no_votes SET DEFAULT 0;",
                "ALTER TABLE rp_core_incidentreport ALTER COLUMN total_votes SET DEFAULT 0;",
                "ALTER TABLE rp_core_incidentreport ALTER COLUMN consecutive_no_votes SET DEFAULT 0;",
                "ALTER TABLE rp_core_incidentreport ALTER COLUMN required_votes SET DEFAULT 7;",
                "ALTER TABLE rp_core_incidentreport ALTER COLUMN status SET DEFAULT 'OPEN';",
            ],
            reverse_sql=[
                "ALTER TABLE rp_core_incidentreport ALTER COLUMN yes_votes DROP DEFAULT;",
                "ALTER TABLE rp_core_incidentreport ALTER COLUMN no_votes DROP DEFAULT;",
                "ALTER TABLE rp_core_incidentreport ALTER COLUMN total_votes DROP DEFAULT;",
                "ALTER TABLE rp_core_incidentreport ALTER COLUMN consecutive_no_votes DROP DEFAULT;",
                "ALTER TABLE rp_core_incidentreport ALTER COLUMN required_votes DROP DEFAULT;",
                "ALTER TABLE rp_core_incidentreport ALTER COLUMN status DROP DEFAULT;",
            ],
        )
    ]


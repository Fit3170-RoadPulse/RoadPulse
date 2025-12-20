from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("rp_core", "0005_incidentreport_voting"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1
                            FROM information_schema.columns
                            WHERE table_name = 'rp_core_appuser'
                              AND column_name = 'provisional_points'
                        ) THEN
                            ALTER TABLE rp_core_appuser
                            ADD COLUMN provisional_points integer NOT NULL DEFAULT 0;
                        END IF;
                    END $$;
                    """,
                    reverse_sql="""
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1
                            FROM information_schema.columns
                            WHERE table_name = 'rp_core_appuser'
                              AND column_name = 'provisional_points'
                        ) THEN
                            ALTER TABLE rp_core_appuser DROP COLUMN provisional_points;
                        END IF;
                    END $$;
                    """,
                ),
                migrations.RunSQL(
                    sql="""
                    CREATE TABLE IF NOT EXISTS rp_core_incidentprovisionalmark (
                        id bigserial PRIMARY KEY,
                        role varchar(20) NOT NULL,
                        amount integer NOT NULL DEFAULT 1,
                        created_at timestamptz NOT NULL DEFAULT NOW(),
                        settled_at timestamptz NULL,
                        report_id bigint NOT NULL REFERENCES rp_core_incidentreport(id) DEFERRABLE INITIALLY DEFERRED,
                        user_id bigint NOT NULL REFERENCES rp_core_appuser(id) DEFERRABLE INITIALLY DEFERRED
                    );
                    CREATE UNIQUE INDEX IF NOT EXISTS uniq_incident_provisional_mark
                        ON rp_core_incidentprovisionalmark(report_id, user_id, role);
                    CREATE INDEX IF NOT EXISTS rp_core_incidentprov_created_at_idx
                        ON rp_core_incidentprovisionalmark(created_at);
                    CREATE INDEX IF NOT EXISTS rp_core_incidentprov_settled_at_idx
                        ON rp_core_incidentprovisionalmark(settled_at);
                    """,
                    reverse_sql="""
                    DROP TABLE IF EXISTS rp_core_incidentprovisionalmark;
                    """,
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="appuser",
                    name="provisional_points",
                    field=models.PositiveIntegerField(default=0, help_text="Provisional points pending hazard outcomes; not spendable."),
                ),
                migrations.CreateModel(
                    name="IncidentProvisionalMark",
                    fields=[
                        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                        ("role", models.CharField(choices=[("REPORTER", "Reporter"), ("VOTER", "Voter")], max_length=20)),
                        ("amount", models.PositiveIntegerField(default=1)),
                        ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                        ("settled_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                        ("report", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="provisional_marks", to="rp_core.incidentreport")),
                        ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="incident_provisional_marks", to=settings.AUTH_USER_MODEL)),
                    ],
                ),
                migrations.AddConstraint(
                    model_name="incidentprovisionalmark",
                    constraint=models.UniqueConstraint(fields=("report", "user", "role"), name="uniq_incident_provisional_mark"),
                ),
            ],
        )
    ]

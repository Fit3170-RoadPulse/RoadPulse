from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from django.db.models import F

from rp_core.models import AppUser, IncidentProvisionalMark, IncidentReport, IncidentReportVote
from rp_core.services.points import add_points, deduct_points


def _safe_deduct_one(user: AppUser, reason: str, ref: str) -> None:
    _safe_deduct(user, 1, reason=reason, ref=ref)


def _safe_deduct(user: AppUser, amount: int, reason: str, ref: str) -> None:
    if amount <= 0:
        return
    user.refresh_from_db(fields=["reward_points"])
    to_deduct = min(int(user.available_points), int(amount))
    if to_deduct <= 0:
        return
    try:
        deduct_points(user, to_deduct, reason=reason, ref=ref)
    except ValueError:
        return


@transaction.atomic
def grant_report_provisional_point(report: IncidentReport) -> None:
    if report.report_type != IncidentReport.ReportType.HAZARD:
        return
    if not report.reporter_id:
        return
    mark, created = IncidentProvisionalMark.objects.get_or_create(
        report=report,
        user=report.reporter,
        role=IncidentProvisionalMark.Role.REPORTER,
        defaults={"amount": 1},
    )
    if not created:
        return
    u = AppUser.objects.select_for_update().get(pk=report.reporter.pk)
    u.provisional_points = F("provisional_points") + 1
    u.save(update_fields=["provisional_points"])


@transaction.atomic
def grant_vote_provisional_point(voter: AppUser, report: IncidentReport, vote: IncidentReportVote) -> None:
    if report.report_type != IncidentReport.ReportType.HAZARD:
        return
    mark, created = IncidentProvisionalMark.objects.get_or_create(
        report=report,
        user=voter,
        role=IncidentProvisionalMark.Role.VOTER,
        defaults={"amount": 1},
    )
    if not created:
        return
    u = AppUser.objects.select_for_update().get(pk=voter.pk)
    u.provisional_points = F("provisional_points") + 1
    u.save(update_fields=["provisional_points"])


@transaction.atomic
def _settle_provisionals_into_rewards(report: IncidentReport) -> None:
    """
    Move all provisional marks for this report into spendable reward points.
    Idempotent via IncidentProvisionalMark.settled_at and PointTransaction.reference.
    """
    now = timezone.now()
    marks = (
        IncidentProvisionalMark.objects.select_for_update()
        .select_related("user")
        .filter(report=report, settled_at__isnull=True)
    )
    for mark in marks:
        user = AppUser.objects.select_for_update().get(pk=mark.user.pk)
        user.refresh_from_db(fields=["provisional_points"])

        amount = int(mark.amount or 0)
        if amount <= 0:
            mark.settled_at = now
            mark.save(update_fields=["settled_at"])
            continue

        ref = f"incident_report:{report.id}:user:{user.id}:provisional_settled:{mark.role}"
        # Add spendable points (idempotent by reference)
        add_points(user, amount, reason="incident_provisional_settled", ref=ref)

        # Decrement provisional (clamped) after adding, so a crash here is safely retryable.
        dec = min(int(user.provisional_points), amount)
        if dec > 0:
            user.provisional_points = F("provisional_points") - dec
            user.save(update_fields=["provisional_points"])

        mark.settled_at = now
        mark.save(update_fields=["settled_at"])


@transaction.atomic
def close_and_settle_report(report_id: int) -> IncidentReport:
    # Avoid select_related() here: reporter is nullable, and some DBs disallow
    # FOR UPDATE on the nullable side of an outer join.
    report = IncidentReport.objects.select_for_update().get(pk=report_id)
    if report.status != IncidentReport.Status.OPEN:
        return report
    if report.report_type != IncidentReport.ReportType.HAZARD:
        # Only hazard reports participate in voting/settlement.
        report.status = IncidentReport.Status.TIED
        report.ended_at = timezone.now()
        report.save(update_fields=["status", "ended_at"])
        return report

    report.ended_at = timezone.now()
    report.status = IncidentReport.Status.TIED
    if report.yes_votes > report.no_votes:
        report.status = IncidentReport.Status.CONFIRMED
    elif report.no_votes > report.yes_votes:
        report.status = IncidentReport.Status.REJECTED

    report.save(update_fields=["status", "ended_at"])

    if report.settled_at is not None:
        return report

    # Provisional points become spendable only after outcome is decided.
    _settle_provisionals_into_rewards(report)

    if report.status == IncidentReport.Status.CONFIRMED:
        if report.reporter_id:
            add_points(
                report.reporter,
                2,
                reason="incident_report_confirmed_bonus",
                ref=f"incident_report:{report.id}:reporter:confirmed_bonus",
            )

    elif report.status == IncidentReport.Status.REJECTED:
        if report.reporter_id:
            # Fast rejection rule: if rejected within X minutes of creation, apply -3 instead of -1.
            fast_minutes = 5
            try:
                from django.conf import settings

                fast_minutes = int(getattr(settings, "INCIDENT_REPORT_FAST_REJECT_MINUTES", 5))
            except Exception:
                fast_minutes = 5

            penalty = 1
            if report.ended_at and report.created_at:
                elapsed = report.ended_at - report.created_at
                if elapsed.total_seconds() <= max(1, fast_minutes) * 60:
                    penalty = 3

            _safe_deduct(
                report.reporter,
                penalty,
                reason="incident_report_rejected_penalty",
                ref=f"incident_report:{report.id}:reporter:rejected_penalty:{penalty}",
            )

    # tie: keep provisional marks unchanged
    report.settled_at = timezone.now()
    report.save(update_fields=["settled_at"])
    return report

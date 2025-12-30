from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import AppUser, ExchangeItem, IncidentReport, RewardRedemption, PointTransaction
from datetime import timedelta
from django.test import TestCase
from django.db import IntegrityError, transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.test.utils import override_settings
from .services.points import get_balance, add_points, deduct_points


# Test cases for the reward exchange system
class RewardExchangeTests(APITestCase):
    # Set up initial data for tests
    def setUp(self):
        self.user = AppUser.objects.create_user(
            username="testuser",
            password="pass12345",
            email="testuser@example.com",
            reward_points=100,
        )
        self.item = ExchangeItem.objects.create(
            name="Fuel Voucher",
            description="Redeemable at participating stations.",
            points_cost=25,
            stock=5,
        )

    # Test listing exchange items
    def test_list_exchange_items(self):
        response = self.client.get(reverse("exchange-items"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], self.item.name)

    # Test retrieving reward points for authenticated user
    def test_reward_account_returns_points(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse("reward-account"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["reward_points"], 100)

    # Test successful reward redemption
    def test_redeem_reward_success(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse("redeem-reward"),
            {"item_id": self.item.id, "quantity": 2},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.item.refresh_from_db()
        self.assertEqual(self.user.reward_points, 50)
        self.assertEqual(self.item.stock, 3)

        redemption = RewardRedemption.objects.get()
        self.assertEqual(redemption.quantity, 2)
        self.assertEqual(redemption.points_spent, 50)

    # Test redemption failure due to insufficient points
    def test_redeem_fails_with_insufficient_points(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse("redeem-reward"),
            {"item_id": self.item.id, "quantity": 5},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Not enough reward points.", response.data["detail"])

    # Test redemption failure due to insufficient stock
    def test_redeem_fails_with_insufficient_stock(self):
        self.item.stock = 1
        self.item.save(update_fields=["stock"])

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse("redeem-reward"),
            {"item_id": self.item.id, "quantity": 2},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Requested quantity exceeds available stock.", response.data["detail"])


class PointTransactionModelTests(TestCase):
    def setUp(self):
        self.user = AppUser.objects.create_user(
            username="pt_user",
            email="pt_user@example.com",
            password="pass12345",
            reward_points=0,
        )

    def test_create_earn_spend_adjust(self):
        earn = PointTransaction.objects.create(
            user=self.user,
            kind=PointTransaction.Kind.EARN,
            amount=50,
            reason="daily_login",
            reference="ref-1",
        )
        spend = PointTransaction.objects.create(
            user=self.user,
            kind=PointTransaction.Kind.SPEND,
            amount=20,
            reason="redeem_reward",
            reference="order-123",
        )
        adjust = PointTransaction.objects.create(
            user=self.user,
            kind=PointTransaction.Kind.ADJUST,
            amount=5,
            reason="admin_adjustment",
        )

        self.assertEqual(earn.amount, 50)
        self.assertEqual(spend.amount, 20)
        self.assertEqual(adjust.amount, 5)
        self.assertEqual(earn.kind, PointTransaction.Kind.EARN)
        self.assertEqual(spend.kind, PointTransaction.Kind.SPEND)
        self.assertEqual(adjust.kind, PointTransaction.Kind.ADJUST)
        self.assertIsNotNone(earn.created_at)
        self.assertIsNotNone(spend.created_at)
        self.assertIsNotNone(adjust.created_at)

    def test_amount_must_be_greater_than_zero_db_constraint(self):
        # CheckConstraint enforced at the DB level
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                PointTransaction.objects.create(
                    user=self.user,
                    kind=PointTransaction.Kind.EARN,
                    amount=0,  # violates pt_amount_gt_zero
                    reason="bad_zero",
                )

    def test_kind_must_be_valid_choice(self):
        pt = PointTransaction(
            user=self.user,
            kind="BONUS",  # not in choices
            amount=10,
            reason="invalid_kind",
        )
        with self.assertRaises(ValidationError):
            pt.full_clean()  # validate choices before save

    def test_default_ordering_is_newest_first(self):
        # Create two and force one to look older by updating created_at
        newer = PointTransaction.objects.create(
            user=self.user, kind=PointTransaction.Kind.EARN, amount=1, reason="n"
        )
        older = PointTransaction.objects.create(
            user=self.user, kind=PointTransaction.Kind.EARN, amount=1, reason="o"
        )
        # Make `older` actually older
        PointTransaction.objects.filter(pk=older.pk).update(
            created_at=timezone.now() - timedelta(days=1)
        )

        pts = list(PointTransaction.objects.all())
        # Newest first per Meta.ordering = ["-created_at"]
        self.assertEqual(pts[0].pk, newer.pk)
        self.assertEqual(pts[-1].pk, older.pk)

    def test_deleting_user_cascades_transactions(self):
        PointTransaction.objects.create(
            user=self.user, kind=PointTransaction.Kind.EARN, amount=10, reason="x"
        )
        self.assertEqual(PointTransaction.objects.count(), 1)
        self.user.delete()
        self.assertEqual(PointTransaction.objects.count(), 0)

    def test_reference_is_not_unique_but_indexed(self):
        # You only defined an index, not a uniqueness constraint
        PointTransaction.objects.create(
            user=self.user, kind=PointTransaction.Kind.EARN, amount=10,
            reason="r", reference="dup-ref"
        )
        PointTransaction.objects.create(
            user=self.user, kind=PointTransaction.Kind.SPEND, amount=3,
            reason="r2", reference="dup-ref"
        )
        qs = PointTransaction.objects.filter(user=self.user, reference="dup-ref")
        self.assertEqual(qs.count(), 2)

    def test_str_representation(self):
        # NOTE: Your model currently defines `_str_` instead of `__str__`.
        # Fix it first, then this test will pass.
        pt = PointTransaction.objects.create(
            user=self.user, kind=PointTransaction.Kind.SPEND, amount=7, reason="redeem"
        )
        s = str(pt)
        self.assertIn(self.user.username, s)
        self.assertIn("redeem", s)
        # should include '-' for spend
        self.assertIn("-", s)


class PointsServiceTests(TestCase):
    def setUp(self):
        self.user = AppUser.objects.create_user(
            username="alice",
            email="alice@example.com",
            password="secret",
            reward_points=10,
        )

    # ---- get_balance ----
    def test_get_balance_returns_user_field(self):
        self.assertEqual(get_balance(self.user), 10)
        self.user.reward_points = 42
        self.user.save(update_fields=["reward_points"])
        self.assertEqual(get_balance(self.user), 42)

    # ---- add_points ----
    def test_add_points_happy_path(self):
        txn = add_points(self.user, amount=5, reason="daily_login")
        self.assertIsInstance(txn, PointTransaction)
        self.user.refresh_from_db(fields=["reward_points"])
        self.assertEqual(self.user.reward_points, 15)
        self.assertEqual(txn.kind, PointTransaction.Kind.EARN)
        self.assertEqual(txn.amount, 5)
        self.assertEqual(txn.reason, "daily_login")
        self.assertIsNone(txn.reference)

    def test_add_points_idempotent_by_reference(self):
        ref = "login-2025-10-15"
        t1 = add_points(self.user, 5, "daily_login", ref=ref)
        t2 = add_points(self.user, 5, "daily_login", ref=ref)  # should no-op (returns existing)
        self.assertEqual(t1.pk, t2.pk)

        # points only applied once
        self.user.refresh_from_db(fields=["reward_points"])
        self.assertEqual(self.user.reward_points, 15)
        self.assertEqual(
            PointTransaction.objects.filter(user=self.user, reference=ref).count(), 1
        )

    def test_add_points_with_different_refs_creates_multiple_txns(self):
        add_points(self.user, 5, "bonus", ref="A")
        add_points(self.user, 5, "bonus", ref="B")
        self.user.refresh_from_db(fields=["reward_points"])
        self.assertEqual(self.user.reward_points, 20)
        self.assertEqual(PointTransaction.objects.filter(user=self.user).count(), 2)

    def test_add_points_without_ref_not_idempotent(self):
        add_points(self.user, 3, "streak")
        add_points(self.user, 3, "streak")
        self.user.refresh_from_db(fields=["reward_points"])
        self.assertEqual(self.user.reward_points, 16)  # +3 twice
        self.assertEqual(PointTransaction.objects.filter(user=self.user, reason="streak").count(), 2)

    def test_add_points_invalid_amount_raises_and_no_side_effects(self):
        with self.assertRaises(ValueError):
            add_points(self.user, 0, "bad")
        self.user.refresh_from_db(fields=["reward_points"])
        self.assertEqual(self.user.reward_points, 10)
        self.assertEqual(PointTransaction.objects.filter(user=self.user).count(), 0)

    # ---- deduct_points ----
    def test_deduct_points_happy_path(self):
        txn = deduct_points(self.user, 4, "redeem_reward", ref="order-1")
        self.assertIsInstance(txn, PointTransaction)
        self.user.refresh_from_db(fields=["reward_points"])
        self.assertEqual(self.user.reward_points, 6)
        self.assertEqual(txn.kind, PointTransaction.Kind.SPEND)
        self.assertEqual(txn.amount, 4)
        self.assertEqual(txn.reference, "order-1")

    def test_deduct_points_idempotent_by_reference(self):
        ref = "order-XYZ"
        t1 = deduct_points(self.user, 5, "redeem_reward", ref=ref)
        # second call should return the same txn and not double-spend
        t2 = deduct_points(self.user, 5, "redeem_reward", ref=ref)
        self.assertEqual(t1.pk, t2.pk)
        self.user.refresh_from_db(fields=["reward_points"])
        self.assertEqual(self.user.reward_points, 5)
        self.assertEqual(
            PointTransaction.objects.filter(user=self.user, reference=ref).count(), 1
        )

    def test_deduct_points_insufficient_raises_and_no_side_effects(self):
        with self.assertRaises(ValueError):
            deduct_points(self.user, 999, "redeem_reward")
        self.user.refresh_from_db(fields=["reward_points"])
        self.assertEqual(self.user.reward_points, 10)
        self.assertEqual(PointTransaction.objects.filter(user=self.user).count(), 0)

    def test_deduct_points_invalid_amount_raises(self):
        with self.assertRaises(ValueError):
            deduct_points(self.user, 0, "bad")
        self.user.refresh_from_db(fields=["reward_points"])
        self.assertEqual(self.user.reward_points, 10)
        self.assertEqual(PointTransaction.objects.filter(user=self.user).count(), 0)

    # ---- cross-user + reference semantics ----
    def test_same_reference_allowed_for_different_users(self):
        bob = AppUser.objects.create_user(
            username="bob",
            email="bob@example.com",
            password="secret",
            reward_points=20,
        )
        add_points(self.user, 5, "daily_login", ref="dup-ref")
        add_points(bob, 5, "daily_login", ref="dup-ref")
        self.user.refresh_from_db(fields=["reward_points"])
        bob.refresh_from_db(fields=["reward_points"])
        self.assertEqual(self.user.reward_points, 15)
        self.assertEqual(bob.reward_points, 25)

    # ---- basic atomicity sanity checks ----
    def test_functions_run_in_atomic_transactions(self):
        """
        Smoke test: ensure we can call within an outer atomic block
        without leaving partial state on error (no nested IntegrityError here,
        but verifies they play nice with outer transactions).
        """
        with transaction.atomic():
            add_points(self.user, 2, "outer")
            deduct_points(self.user, 1, "outer-spend")
        self.user.refresh_from_db(fields=["reward_points"])
        self.assertEqual(self.user.reward_points, 11)

    # ---- model indexing/constraints would not block our idempotency pattern ----
    def test_reference_index_allows_multiple_rows_without_unique(self):
        # Your model uses an index, not unique; idempotency relies on app logic.
        add_points(self.user, 1, "A", ref="X")
        # Manually create another row with same ref to prove DB allows it
        PointTransaction.objects.create(
            user=self.user, kind=PointTransaction.Kind.EARN, amount=1, reason="manual", reference="X"
        )
        self.assertEqual(PointTransaction.objects.filter(user=self.user, reference="X").count(), 2)


@override_settings(
    INCIDENT_REPORT_REQUIRED_VOTES=5,
    INCIDENT_REPORT_NO_STREAK_LIMIT=3,
    INCIDENT_REPORT_EXPIRE_MINUTES_HAZARD=15,
    INCIDENT_REPORT_EXPIRE_MINUTES_ACCIDENT=10,
    INCIDENT_REPORT_EXPIRE_MINUTES_WEATHER=30,
    INCIDENT_REPORT_EXPIRE_MINUTES_CRIME=10,
    INCIDENT_REPORT_EXPIRE_MINUTES_OTHER=20,
)
class IncidentReportVotingTests(APITestCase):
    def setUp(self):
        self.reporter = AppUser.objects.create_user(
            username="reporter",
            password="pass12345",
            email="reporter@example.com",
            reward_points=0,
        )
        self.v1 = AppUser.objects.create_user(
            username="v1",
            password="pass12345",
            email="v1@example.com",
            reward_points=0,
        )
        self.v2 = AppUser.objects.create_user(
            username="v2",
            password="pass12345",
            email="v2@example.com",
            reward_points=0,
        )
        self.v3 = AppUser.objects.create_user(
            username="v3",
            password="pass12345",
            email="v3@example.com",
            reward_points=0,
        )

    def test_report_creation_grants_provisional_point(self):
        self.client.force_authenticate(user=self.reporter)
        res = self.client.post(
            reverse("incident-reports"),
            {
                "report_type": "HAZARD",
                "description": "Pothole",
                "latitude": "-37.810000",
                "longitude": "144.960000",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.reporter.refresh_from_db(fields=["reward_points"])
        self.assertEqual(self.reporter.reward_points, 0)
        self.reporter.refresh_from_db(fields=["provisional_points"])
        self.assertEqual(self.reporter.provisional_points, 1)

    def test_non_hazard_report_no_provisional_and_no_voting(self):
        self.client.force_authenticate(user=self.reporter)
        res = self.client.post(
            reverse("incident-reports"),
            {
                "report_type": "ACCIDENT",
                "description": "Minor crash",
                "latitude": "-37.810000",
                "longitude": "144.960000",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.reporter.refresh_from_db(fields=["reward_points", "provisional_points"])
        self.assertEqual(self.reporter.reward_points, 0)
        self.assertEqual(self.reporter.provisional_points, 0)

        report_id = res.data["id"]
        self.client.force_authenticate(user=self.v1)
        vr = self.client.post(
            reverse("incident-report-vote", kwargs={"report_id": report_id}),
            {"choice": "YES", "latitude": "-37.810000", "longitude": "144.960000"},
            format="json",
        )
        self.assertEqual(vr.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_hazard_reports_expire_for_active(self):
        # The DB has a constraint `expires_at >= created_at`, so to simulate an
        # past-expired report we backdate created_at and expires_at via an
        # update after insert.
        report = IncidentReport.objects.create(
            report_type=IncidentReport.ReportType.ACCIDENT,
            description="Old accident",
            latitude="-37.810000",
            longitude="144.960000",
            reporter=self.reporter,
            expires_at=timezone.now() + timedelta(days=1),
        )
        IncidentReport.objects.filter(pk=report.pk).update(
            created_at=timezone.now() - timedelta(days=2),
            expires_at=timezone.now() - timedelta(days=1),
        )
        report.refresh_from_db()
        self.assertFalse(report.is_active)
        self.assertFalse(IncidentReport.objects.active().filter(pk=report.pk).exists())

    def test_three_consecutive_no_closes_and_rejects(self):
        self.client.force_authenticate(user=self.reporter)
        r = self.client.post(
            reverse("incident-reports"),
            {
                "report_type": "HAZARD",
                "description": "Debris",
                "latitude": "-37.810000",
                "longitude": "144.960000",
            },
            format="json",
        ).data
        report_id = r["id"]

        # 3 NO votes -> should close
        for voter in [self.v1, self.v2, self.v3]:
            self.client.force_authenticate(user=voter)
            vr = self.client.post(
                reverse("incident-report-vote", kwargs={"report_id": report_id}),
                {"choice": "NO", "latitude": "-37.810000", "longitude": "144.960000"},
                format="json",
            )
            self.assertEqual(vr.status_code, status.HTTP_200_OK)

        report = IncidentReport.objects.get(pk=report_id)
        self.assertEqual(report.status, IncidentReport.Status.REJECTED)
        self.assertIsNotNone(report.ended_at)
        self.assertIsNotNone(report.settled_at)

        # report is rejected quickly; provisional is settled into reward then penalty applies
        self.reporter.refresh_from_db(fields=["reward_points", "provisional_points"])
        self.assertEqual(self.reporter.provisional_points, 0)
        self.assertEqual(self.reporter.reward_points, 0)

        # each voter got +1 provisional, settled into reward at close
        for voter in [self.v1, self.v2, self.v3]:
            voter.refresh_from_db(fields=["reward_points", "provisional_points"])
            self.assertEqual(voter.provisional_points, 0)
            self.assertEqual(voter.reward_points, 1)

    @override_settings(INCIDENT_REPORT_FAST_REJECT_MINUTES=5)
    def test_fast_reject_applies_minus_3_when_reporter_has_points(self):
        # Give reporter enough points so we can observe the full -3 deduction.
        self.reporter.reward_points = 10
        self.reporter.save(update_fields=["reward_points"])

        self.client.force_authenticate(user=self.reporter)
        report_id = self.client.post(
            reverse("incident-reports"),
            {
                "report_type": "HAZARD",
                "description": "Debris",
                "latitude": "-37.810000",
                "longitude": "144.960000",
            },
            format="json",
        ).data["id"]

        for voter in [self.v1, self.v2, self.v3]:
            self.client.force_authenticate(user=voter)
            self.client.post(
                reverse("incident-report-vote", kwargs={"report_id": report_id}),
                {"choice": "NO", "latitude": "-37.810000", "longitude": "144.960000"},
                format="json",
            )

        # Provisional settles (+1) then -3 penalty => 10 + 1 - 3 = 8
        self.reporter.refresh_from_db(fields=["reward_points", "provisional_points"])
        self.assertEqual(self.reporter.provisional_points, 0)
        self.assertEqual(self.reporter.reward_points, 8)

    @override_settings(INCIDENT_REPORT_REQUIRED_VOTES=5)
    def test_confirmed_rewards_and_penalties(self):
        self.client.force_authenticate(user=self.reporter)
        r = self.client.post(
            reverse("incident-reports"),
            {
                "report_type": "HAZARD",
                "description": "Flooded road",
                "latitude": "-37.810000",
                "longitude": "144.960000",
            },
            format="json",
        ).data
        report_id = r["id"]

        yes_voters = [self.v1, self.v2, self.v3]
        no_voters = []

        for voter in yes_voters:
            self.client.force_authenticate(user=voter)
            self.client.post(
                reverse("incident-report-vote", kwargs={"report_id": report_id}),
                {"choice": "YES", "latitude": "-37.810000", "longitude": "144.960000"},
                format="json",
            )

        # Add 2 NO voters to reach 5 total votes -> close
        v4 = AppUser.objects.create_user(username="v4", email="v4@example.com", password="pass12345", reward_points=1)
        v5 = AppUser.objects.create_user(username="v5", email="v5@example.com", password="pass12345", reward_points=1)
        no_voters = [v4, v5]
        for voter in no_voters:
            self.client.force_authenticate(user=voter)
            self.client.post(
                reverse("incident-report-vote", kwargs={"report_id": report_id}),
                {"choice": "NO", "latitude": "-37.810000", "longitude": "144.960000"},
                format="json",
            )

        report = IncidentReport.objects.get(pk=report_id)
        self.assertEqual(report.status, IncidentReport.Status.CONFIRMED)

        # reporter: provisional settles (+1) then +2 confirmed bonus = 3
        self.reporter.refresh_from_db(fields=["reward_points", "provisional_points"])
        self.assertEqual(self.reporter.provisional_points, 0)
        self.assertEqual(self.reporter.reward_points, 3)

        # YES voters: provisional settles into reward (+1)
        for voter in yes_voters:
            voter.refresh_from_db(fields=["reward_points", "provisional_points"])
            self.assertEqual(voter.provisional_points, 0)
            self.assertEqual(voter.reward_points, 1)

        # NO voters: provisional settles into reward (+1), no penalties
        for voter in no_voters:
            voter.refresh_from_db(fields=["reward_points", "provisional_points"])
            self.assertEqual(voter.provisional_points, 0)
            self.assertEqual(voter.reward_points, 2)

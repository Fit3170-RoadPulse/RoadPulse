from django.db import transaction
from django.db.models import F
from rp_core.models import AppUser, PointTransaction


def get_balance(user: AppUser) -> int:
    return user.available_points

@transaction.atomic
def add_points(user: AppUser, amount: int, reason: str, ref: str | None = None, expiry_date=None) -> PointTransaction:
    if amount <= 0:
        raise ValueError("amount must be > 0")
    
    if ref:
        existing = PointTransaction.objects.filter(user=user, reference=ref).first()
        if existing:
            return existing

    # Lock the user row to avoid races
    u = AppUser.objects.select_for_update().get(pk=user.pk)
    u.refresh_from_db(fields=["reward_points"])

    txn = PointTransaction.objects.create(
        user=u, 
        kind=PointTransaction.Kind.EARN, 
        amount=amount, 
        reason=reason, 
        reference=ref,
        expiry_date=expiry_date
    )
    u.reward_points = F("reward_points") + amount
    u.save(update_fields=["reward_points"])
    u.refresh_from_db(fields=["reward_points"])
    return txn

@transaction.atomic
def deduct_points(user: AppUser, amount: int, reason: str, ref: str | None = None) -> PointTransaction:
    if amount <= 0:
        raise ValueError("amount must be > 0")
    if ref:
        existing = PointTransaction.objects.filter(user=user, reference=ref).first()
        if existing:
            return existing

    u = AppUser.objects.select_for_update().get(pk=user.pk)
    u.refresh_from_db(fields=["reward_points"])

    # Check available points
    if u.available_points < amount:
        raise ValueError("Insufficient points")

    txn = PointTransaction.objects.create(
        user=u, 
        kind=PointTransaction.Kind.SPEND, 
        amount=amount, 
        reason=reason, 
        reference=ref
    )
    u.reward_points = F("reward_points") - amount
    u.save(update_fields=["reward_points"])
    u.refresh_from_db(fields=["reward_points"])
    return txn

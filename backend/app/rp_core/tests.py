from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import AppUser, ExchangeItem, RewardRedemption


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

    # Test authentication requirement for reward account
    def test_reward_account_requires_authentication(self):
        response = self.client.get(reverse("reward-account"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

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

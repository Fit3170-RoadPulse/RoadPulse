import os
from urllib.parse import urlparse

import requests
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from rp_core.models import ExchangeItem


class Command(BaseCommand):
    help = 'Seeds the database with 3 dummy rewards (Exchange Items)'

    def handle(self, *args, **kwargs):
        # Create or update 3 dummy rewards
        rewards_data = [
            {
                'name': '$10 Fuel Voucher',
                'description': 'Redeem this voucher for $10 off your next fuel purchase at participating stations.',
                'points_cost': 500,
                'stock': 100,
                'image_url': 'https://via.placeholder.com/300x200/667eea/ffffff?text=Fuel+Voucher',
                'is_active': True,
            },
            {
                'name': 'Coffee Shop Gift Card',
                'description': 'Enjoy a free coffee or tea at any of our partner coffee shops nationwide.',
                'points_cost': 200,
                'stock': 250,
                'image_url': 'https://via.placeholder.com/300x200/764ba2/ffffff?text=Coffee+Card',
                'is_active': True,
            },
            {
                'name': 'Premium Car Wash Package',
                'description': 'Complete car wash and detailing service worth $30. Keep your vehicle spotless!',
                'points_cost': 750,
                'stock': 50,
                'image_url': 'https://via.placeholder.com/300x200/48bb78/ffffff?text=Car+Wash',
                'is_active': True,
            },
        ]

        created_count = 0
        updated_count = 0

        for reward_data in rewards_data:
            image_url = reward_data.pop("image_url", None)
            name = reward_data["name"]
            reward, created = ExchangeItem.objects.update_or_create(
                name=name,
                defaults=reward_data,
            )
            created_count += 1 if created else 0
            updated_count += 0 if created else 1

            if image_url and not reward.image:
                try:
                    response = requests.get(image_url, timeout=10)
                    response.raise_for_status()
                    url_path = urlparse(image_url).path
                    base_name = os.path.basename(url_path) or f"{slugify(name)}.jpg"
                    reward.image.save(base_name, ContentFile(response.content), save=True)
                except Exception as exc:
                    self.stdout.write(self.style.WARNING(
                        f"Could not fetch image for {name}: {exc}"
                    ))

            self.stdout.write(self.style.SUCCESS(
                f"Reward ready: {reward.name} ({'created' if created else 'updated'})"
            ))

        self.stdout.write(self.style.SUCCESS(
            f"Seed complete. Created: {created_count}, Updated: {updated_count}"
        ))

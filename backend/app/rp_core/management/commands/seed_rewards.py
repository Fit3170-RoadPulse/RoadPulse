from django.core.management.base import BaseCommand
from rp_core.models import ExchangeItem


class Command(BaseCommand):
    help = 'Seeds the database with 3 dummy rewards (Exchange Items)'

    def handle(self, *args, **kwargs):
        # Clear existing rewards (optional)
        ExchangeItem.objects.all().delete()
        self.stdout.write(self.style.WARNING('Cleared existing rewards'))
        
        # Create 3 dummy rewards
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
        
        created_rewards = []
        for reward_data in rewards_data:
            reward = ExchangeItem.objects.create(**reward_data)
            created_rewards.append(reward)
            self.stdout.write(self.style.SUCCESS(f'✅ Created reward: {reward.name}'))
        
        self.stdout.write(self.style.SUCCESS(f'\n🎉 Successfully seeded {len(created_rewards)} rewards!'))

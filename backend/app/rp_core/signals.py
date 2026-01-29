from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver
from .models import ExchangeItem
import cloudinary.uploader

@receiver(post_delete, sender=ExchangeItem)
def cleanup_image_on_delete(sender, instance, **kwargs):
    """
    Delete the image from Cloudinary when the ExchangeItem is deleted.
    """
    if instance.image:
        # For Cloudinary, checking the public_id or just letting the storage backend handle delete
        # instance.image.delete(save=False) works for FileSystem and S3, 
        # but verifies if django-cloudinary-storage supports it. It usually does.
        # However, to be extra safe with Cloudinary public_ids, we can use the storage API.
        # But instance.image.delete(save=False) is the standard Django way.
        instance.image.delete(save=False)

@receiver(pre_save, sender=ExchangeItem)
def cleanup_image_on_change(sender, instance, **kwargs):
    """
    Delete the old image from Cloudinary when the image is updated (replaced).
    """
    if not instance.pk:
        return  # New instance, no old image

    try:
        old_instance = ExchangeItem.objects.get(pk=instance.pk)
    except ExchangeItem.DoesNotExist:
        return

    old_image = old_instance.image
    new_image = instance.image

    if old_image and old_image != new_image:
        # If the image has changed, delete the old one
        old_image.delete(save=False)

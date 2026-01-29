from django.apps import AppConfig


class RpCoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rp_core'

    def ready(self):
        import rp_core.signals

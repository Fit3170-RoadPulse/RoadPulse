from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class EmailBackend(ModelBackend):
    """
    Custom authentication backend that allows users to authenticate with email instead of username.
    """
    def authenticate(self, request, email=None, password=None, **kwargs):
        """
        Authenticate a user based on email address and password.
        """
        UserModel = get_user_model()
        
        if email is None or password is None:
            return None
        
        try:
            # Try to find the user by email
            user = UserModel.objects.get(email=email)
        except UserModel.DoesNotExist:
            # User not found
            return None
        except UserModel.MultipleObjectsReturned:
            # Multiple users with same email (shouldn't happen if email is unique)
            return None
        
        # Check the password
        if user.check_password(password):
            return user
        
        return None

from datetime import datetime, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User

from jobs.models import UserProfile

class Command(BaseCommand):
  help = 'Deactivate users account based on expiration date.'

  def handle(self, *args, **options):
    try:
      users = User.objects.all()
      for user in users:
        try:
          profile = UserProfile.objects.get(user=user)
          now = datetime.now(profile.expiration_date.tzinfo)
          if profile.expiration_date < now:
            user.is_active = False
            user.save()
            message = self.getMessageForProfileExpiration(profile)
            self.stdout.write(message)
        except UserProfile.DoesNotExist:
          expiration_date = self.getNewExpirationDate()
          UserProfile.objects.create(
            user=user,
            expiration_date=expiration_date
          )
          message = self.getMessageForProfileExpiration(user)
          self.stdout.write(message)
    except User.DoesNotExist:
      raise CommandError('There are no users to update')

  def getMessageForProfileExpired(self, profile):
    return 'Disabling user account %s because of expiration date: %s' % (
      user.username,
      profile.expiration_date,
    )

  def getNewExpirationDate(self):
    return datetime.now() + timedelta(days=365)

  def getMessageForNewProfile(self, user):
    return 'Creating profile for user %s.' % user.username

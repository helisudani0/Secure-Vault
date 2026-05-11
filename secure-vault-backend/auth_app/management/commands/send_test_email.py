from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand, CommandError
from django.core.validators import validate_email
from django.core.exceptions import ValidationError


class Command(BaseCommand):
    help = "Send a real test email with the currently configured email backend."

    def add_arguments(self, parser):
        parser.add_argument("recipient", help="Recipient email address")

    def handle(self, *args, **options):
        recipient = options["recipient"].strip()
        try:
            validate_email(recipient)
        except ValidationError as exc:
            raise CommandError("Recipient must be a valid email address") from exc

        sent_count = send_mail(
            subject="Privora email delivery test",
            message=(
                "Privora can send transactional email from this environment.\n\n"
                "If you received this, verification and recovery emails can be delivered."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )

        if sent_count != 1:
            raise CommandError("Email backend did not report a successful send.")

        self.stdout.write(self.style.SUCCESS(f"Sent test email to {recipient}"))

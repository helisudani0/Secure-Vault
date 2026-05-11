from django.conf import settings
from django.core.checks import Error, Warning, register


DEV_EMAIL_BACKENDS = {
    'django.core.mail.backends.console.EmailBackend',
    'django.core.mail.backends.locmem.EmailBackend',
    'django.core.mail.backends.filebased.EmailBackend',
}


@register()
def production_email_check(app_configs, **kwargs):
    issues = []
    if settings.DJANGO_ENV != 'production':
        return issues

    if settings.EMAIL_BACKEND in DEV_EMAIL_BACKENDS:
        issues.append(Error(
            'Production email is configured with a development-only backend.',
            hint='Set EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend and configure SMTP credentials.',
            id='privora.E001',
        ))

    if settings.EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend':
        missing = []
        if not settings.EMAIL_HOST or settings.EMAIL_HOST == 'localhost':
            missing.append('EMAIL_HOST')
        if not settings.DEFAULT_FROM_EMAIL or 'localhost' in settings.DEFAULT_FROM_EMAIL:
            missing.append('DEFAULT_FROM_EMAIL')
        if missing:
            issues.append(Error(
                f'Production SMTP email configuration is incomplete: {", ".join(missing)}.',
                hint='Configure a real transactional email provider before launch.',
                id='privora.E002',
            ))

    if settings.USE_S3_STORAGE:
        missing_storage = [
            name for name in (
                'AWS_ACCESS_KEY_ID',
                'AWS_SECRET_ACCESS_KEY',
                'AWS_STORAGE_BUCKET_NAME',
                'AWS_S3_REGION_NAME',
            )
            if not getattr(settings, name, '')
        ]
        if missing_storage:
            issues.append(Error(
                f'Production object storage configuration is incomplete: {", ".join(missing_storage)}.',
                hint='Configure S3-compatible object storage credentials and a private bucket.',
                id='privora.E003',
            ))

    return issues


@register(deploy=True)
def production_operational_check(app_configs, **kwargs):
    issues = []
    if settings.DJANGO_ENV != 'production':
        return issues

    if not settings.CACHE_URL:
        issues.append(Warning(
            'CACHE_URL is not set; auth rate limits will use per-process memory.',
            hint='Use Redis in production so rate limits work across workers.',
            id='privora.W001',
        ))

    if not settings.SENTRY_DSN:
        issues.append(Warning(
            'SENTRY_DSN is not set.',
            hint='Configure Sentry or another error monitor before public launch.',
            id='privora.W002',
        ))

    return issues

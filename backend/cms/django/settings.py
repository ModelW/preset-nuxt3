import os
from importlib import metadata

from model_w.env_manager import EnvManager
from model_w.preset.django import ModelWDjango

BASE_URL = "http://127.0.0.1:3000"
MIDDLEWARE = []
REST_FRAMEWORK = {}


def get_package_version() -> str:
    """
    Trying to get the current package version using the metadata module. This
    assumes that the version is indeed set in pyproject.toml and that the
    package was cleanly installed.
    """

    try:
        return metadata.version("abitbol")
    except metadata.PackageNotFoundError:
        return "0.0.0"


with EnvManager(ModelWDjango(enable_storages=False)) as env:
    # ---
    # Apps
    # ---

    INSTALLED_APPS = [
        "corsheaders",
        "drf_spectacular",
        "drf_spectacular_sidecar",
        "django_extensions",
        "wagtail.api.v2",
        "cms.apps.cms",
        "cms.apps.people",
    ]

    MIDDLEWARE.insert(1, 'django.middleware.security.SecurityMiddleware')
    MIDDLEWARE.insert(1, 'django.middleware.clickjacking.XFrameOptionsMiddleware')
    MIDDLEWARE.insert(1, "corsheaders.middleware.CorsMiddleware")

    CSRF_TRUSTED_ORIGINS = [BASE_URL]

    CORS_ALLOWED_ORIGINS = [BASE_URL, 'http://localhost', 'http://localhost:3000']

    # ---
    # Plumbing
    # ---

    ROOT_URLCONF = "cms.django.urls"

    WSGI_APPLICATION = "cms.django.wsgi.application"

    # ---
    # Auth
    # ---

    AUTH_USER_MODEL = "people.User"

    # ---
    # i18n
    # ---

    LANGUAGES = [
        ("en", "English"),
    ]

    # ---
    # OpenAPI Schema
    # ---

    REST_FRAMEWORK["DEFAULT_SCHEMA_CLASS"] = "drf_spectacular.openapi.AutoSchema"

    SPECTACULAR_SETTINGS = {
        "TITLE": "Abitbol",
        "VERSION": get_package_version(),
        "SERVE_INCLUDE_SCHEMA": False,
        "SWAGGER_UI_DIST": "SIDECAR",  # shorthand to use the sidecar instead
        "SWAGGER_UI_FAVICON_HREF": "SIDECAR",
        "REDOC_DIST": "SIDECAR",
    }

    # ---
    # Wagtail
    # ---

    WAGTAILAPI_BASE_URL = env.get("WAGTAILAPI_BASE_URL")
    WAGTAIL_SITE_NAME = "Abitbol"
    WAGTAILIMAGES_IMAGE_MODEL = "cms.CustomImage"
    WAGTAILDOCS_DOCUMENT_MODEL = "cms.CustomDocument"

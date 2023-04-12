from typing import Any

from wagtail.api.v2.views import PagesAPIViewSet
from wagtail.images.api.v2.views import ImagesAPIViewSet

from cms.apps.cms.serializers import ImageSerializer


class PagesViewSet(PagesAPIViewSet):
    permission_classes = []

    def get_object(self) -> Any:
        page = super().get_object()
        return (
            page.get_latest_revision_as_object()
            if self.request.query_params.get("draft") == 'true'
            else page
        )


class ImagesViewSet(ImagesAPIViewSet):
    permission_classes = []
    base_serializer_class = ImageSerializer
    body_fields = [*ImagesAPIViewSet.body_fields, "rendition"]

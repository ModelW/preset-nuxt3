from rest_framework.request import Request
from wagtail.images.api.fields import ImageRenditionField
from wagtail.images.api.v2.serializers import ImageSerializer as BaseImageSerializer


class RequestImageRenditionField(ImageRenditionField):
    def __init__(self, *args, **kwargs):
        # Don't set the image spec until it's needed
        super().__init__("", *args, **kwargs)

    def to_representation(self, image):
        # Allow the front to choose how to display the image
        request: Request = self.context["request"]
        self.filter_spec = request.query_params.get("image_spec")
        return super().to_representation(image)


class ImageSerializer(BaseImageSerializer):
    rendition = RequestImageRenditionField()

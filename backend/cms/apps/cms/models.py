from django.db import models
from django.utils.translation import gettext_lazy as _
from wagtail import blocks
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField
from wagtail.core.models import Page
from wagtail.documents.models import AbstractDocument
from wagtail.fields import RichTextField, StreamField
from wagtail.images.blocks import ImageChooserBlock
from wagtail.images.models import AbstractImage, AbstractRendition
from wagtail.images.models import Image as DefaultImage

from cms.apps.cms.blocks import InputText


class CustomImage(AbstractImage):
    """
    Extends the default Wagtail image object to add an "alt" field which is
    often required for SEO purposes.
    """

    alt = models.CharField(
        max_length=1000,
        help_text=_("Default alt text for image."),
        default="",
        blank=True,
    )

    admin_form_fields = (
        *DefaultImage.admin_form_fields,
        "alt",
    )

    @property
    def rendition(self) -> AbstractImage:
        # This allows adding a `rendition` field in the image serializer
        return self

    class Meta(AbstractImage.Meta):
        verbose_name = _("image")
        verbose_name_plural = _("images")
        permissions = [
            ("choose_image", _("Can choose image")),
        ]


class CustomRendition(AbstractRendition):
    """
    Custom rendition model because we have a custom image model and it's
    mandatory to make the rendition go with it
    """

    image = models.ForeignKey(
        CustomImage,
        related_name="renditions",
        on_delete=models.CASCADE,
    )

    class Meta:
        unique_together = (("image", "filter_spec", "focal_point_key"),)


class CustomDocument(AbstractDocument):
    """
    Extends the default document object. Does nothing for now but if one day
    you want to add another field to this model then it's going to be much
    easier. Otherwise just let it here.
    """

    admin_form_fields = ("title", "file", "collection", "tags")

    class Meta(AbstractDocument.Meta):
        permissions = [
            ("choose_document", _("Can choose document")),
        ]


class HomePage(Page):
    """
    Home page, expected to be the root of the website. There is already a
    migration that will replace Wagtail's default root page by this. All you
    need to do is add fields there (if needed!).
    """

    parent_page_types = ["wagtailcore.Page"]
    content_panels = [
        *Page.content_panels,
        FieldPanel("main_text"),
        FieldPanel("main_image"),
        FieldPanel("content"),
    ]
    api_fields = [
        APIField("main_text"),
        APIField("main_image"),
        APIField("content"),
    ]

    main_text = RichTextField(default="")
    main_image = models.ForeignKey(to=CustomImage, on_delete=models.SET_NULL, null=True)
    content = StreamField(
        block_types=[
            ("Text", blocks.CharBlock()),
            ("Image", ImageChooserBlock()),
            ("TextInput", InputText())
        ],
        use_json_field=True,
        default=[],
    )

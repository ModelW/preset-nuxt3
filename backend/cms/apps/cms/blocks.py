from wagtail.core import blocks


class InputText(blocks.StructBlock):
    title = blocks.CharBlock(classname="InputText", required=True)

    class Meta:
        label = "Input Text"
        template = "cms/templates/input_text.html"


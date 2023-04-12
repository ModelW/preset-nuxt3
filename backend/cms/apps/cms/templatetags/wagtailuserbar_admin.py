from django import template
from django.template.loader import render_to_string
from wagtail.admin.templatetags.wagtailuserbar import get_page_instance
from wagtail.admin.userbar import (AdminItem)

register = template.Library()


@register.simple_tag(name="wagtailuserbar_admin", takes_context=True)
def wagtailuserbar_admin_only(context, position='bottom-right'):
    # Find request object
    try:
        request = context['request']
    except KeyError:
        return ''

    # Don't render without a user because we can't check their permissions
    try:
        user = request.user
    except AttributeError:
        return ''

    # Don't render if user doesn't have permission to access the admin area
    if not user.has_perm('wagtailadmin.access_admin'):
        return ''

    # Only render if the context does NOT contain a variable referencing a saved page
    page = get_page_instance(context)
    if page:
        return ''

    # Render the items
    rendered_items = [AdminItem()]

    # Render the userbar items
    return render_to_string('wagtailadmin/userbar/base.html', {
        'request': request,
        'items': rendered_items,
        'position': position,
    })

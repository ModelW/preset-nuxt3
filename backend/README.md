# API

This handles the API and back-office admin.

All the URLs pointing to this are prefixed by `/back`.


> **Note** &mdash; There is one exception to this, which is the Wagtail previous
> system. They are fairly complex, and it's the proxy middleware in Nuxt taking
> care of this. Check [`*.vue`](../front/pages/*.vue) and
> [`nuxt.config.ts`](../front/nuxt.config.ts) for more info.

## Getting started
To set up the backend work properly the first thing we need to do is to create a
new environment with [poetry](https://python-poetry.org/docs/) and [pyenv](https://github.com/pyenv/pyenv).
You can also follow the steps described in the documentation of [ModelW](https://model-w.readthedocs.io/en/latest/prerequisites.html#poetry-and-python-version)
By this way we can isolate the different dependencies from other projects.

To install the dependencies declared inside the file [poetry.lock](poetry.lock).
You have to follow the next steps:

Declare the python version by pyenv
```commandline
pyenv local 3.10.9
```
Then we have to specify to poetry which env he has to use, it's done by
```command
poetry env use <home of your pyenv>/versions/3.10.9/bin/python
```
And with this specification we can follow to install all the dependencies from pyproject.toml by:
```commandline
poetry install
```

## Components

You'll find the following apps:

-   [people](cms/apps/people) &mdash; The user model and
    authentication.



-   [cms](cms/apps/cms) &mdash; All the page models for
    Wagtail


## OpenAPI

When the app is in development mode, you can access the OpenAPI documentation at
`/back/api/schema/redoc/`.

This documentation is auto-generated using
[drf-spectacular](https://drf-spectacular.readthedocs.io/en/latest/). As you
create more APIs, make sure that they render nicely in OpenAPI format.

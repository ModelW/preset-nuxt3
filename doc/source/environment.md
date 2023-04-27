# Environment Variables

As we're following the 12 factors, everything can be configured using
environment variables.

## Environment variables

-   Required basic values &mdash; Those things cannot be invented nor have
    decent default value. You need to specify them.
    -   `BASE_URL` &mdash; 
    -   `API_URL` &mdash; 

## Sentry Variables
To configure the Sentry variables, at these moment we're using the new Sentry DSN, as referred in the 
[documentation](https://model-w-sentry.readthedocs.io/en/latest/installation.html).

```json
    
```

## Axios Variables
To configure the Sentry variables, at these moment we're using the new Sentry DSN, as referred in the 
[documentation](https://model-w-axios.readthedocs.io/en/latest/installation.html).

```json
    
```

## 

## Preset implementation

Here's the documentation from the preset code to understand how those are used:

```{eval-rst}
.. autoclass:: model_w.preset.django.ModelWDjango
   :members:

   .. automethod:: __init__
```
# Installation

You can install Model W Proxy in your project with the following command.

```shell
npm i @model-w/preset-nuxt3
```

Then you can use the implementation of the Mode
Here is a minimalistic example:

```typescript
export default (
    defineModelWConfig({
            siteName: "___project_name__snake___",
            apiURL: process.env.API_URL,
            sentryDSN: process.env.SENTRY_DSN,
            ENV: process.env.ENV,
            meta: [
                    { charset: "utf-8" },
                    {
                        name: "viewport",
                        content: "width=device-width, initial-scale=1",
                    },
                    { hid: "description", name: "description", content: "" },
                    { name: "format-detection", content: "telephone=no" },
                ],
            backAlias: process.env.BACK_ALIAS,
            cmsAlias: process.env.CMS_ALIAS,
            moduleConfig: [
            ],
        }
    )
);
```




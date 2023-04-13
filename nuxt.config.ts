export interface ModelWConfig {
    siteName?: string;
    apiURL?: string;
    sentryDSN?: string;
    ENV?: string;
    charset?: string;
    meta?: Array<any>;
    moduleConfig?: Array<any>;
    backAlias?: string;
    cmsAlias?: string;
}

export function defineModelWConfig(config: ModelWConfig) {
    return defineNuxtConfig({
        app: {
            head: {
                titleTemplate: config.siteName,
            },
            // @ts-ignore
            meta: config.meta,
        },

        routeRules: {
            '/': {
                prerender: true,
                cors: true
            },
            '/*': {
                cors: true
            }
        },

        runtimeConfig: {
            apiURL: config.apiURL,
            backAlias: config.backAlias,
            cmsAlias: config.cmsAlias,
            public: {
                sentryDSN: config.sentryDSN,
                serverTemplatedComponents: false,
            },
            ENV: config.ENV,
        },

        build: {},

        modules: [
            "nuxt-runtime-compiler",
            "@model-w/axios",
            "@model-w/sentry",
            "@model-w/proxy",
            ...(config.moduleConfig ? config.moduleConfig : []),
        ]
    })
}

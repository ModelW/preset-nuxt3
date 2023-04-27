export interface ModelWConfig {
    siteName?: string;
    apiUrl?: string;
    baseUrl?: string;
    sentryDsn?: string;
    sentryEnvironment?: string;
    environment?: string;
    charset?: string;
    meta?: Array<any>;
    moduleConfig?: Array<any>;
    backAlias?: string;
    cmsAlias?: string;
    proxyFilters?: Array<any>;
    proxyContext?: Array<any>;

}

export function defineModelWConfig(config: ModelWConfig) {
    return defineNuxtConfig({
        app: {
            head: {
                titleTemplate: config.siteName || "Model W",
            },
            meta: config.meta,
        },

        runtimeConfig: {
            apiUrl: config.apiUrl || "http://localhost:3000",
            public: {
                serverTemplatedComponents: false,
                baseUrl: config.baseUrl || ""
            },
        },

        proxy: {
            context: [
                config.backAlias || "/back",
                config.cmsAlias ||"/cms",
                ...(config.proxyContext || [])
            ],
            options: {
                target: config.apiUrl,
                changeOrigin: true,
            },
            filters: [
                {
                    header: /x-reach-api:.+/,
                },
                {
                    path: "/back",
                },
                {
                    path: "/cms",
                },
                {
                    path: /^\/cms\/pages\/[^/]+\/edit\/preview\/$/,
                    useProxy: false,
                },
                {
                    path: /^\/cms\/pages\/add\/[^/]+\/[^/]+\/[^/]+\/preview\/$/,
                    method: /HEAD|OPTIONS|GET/,
                    useProxy: false,
                },
                ...(config.proxyFilters || [])
            ],
          },

        sentry: {
            dsn: config.sentryDsn || "",
            environment: config.sentryEnvironment || ""
        },

        build: {},

        modules: [
            "nuxt-runtime-compiler",
            "@model-w/axios",
            "@model-w/sentry",
            "@model-w/proxy",
            "@model-w/toast",
            ...(config.moduleConfig || []),
        ]
    })
}

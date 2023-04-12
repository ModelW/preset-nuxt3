import {defineNuxtConfig, NuxtConfig} from "nuxt/config";
import { defu } from "defu";
/**
 * Modifies the request from the proxy in order to make sure that Django behind
 * the request can interpret the correct host from X-Forwarded-Host instead of
 * using the host it receives which is the internal host name from the DO PaaS
 * (or any other internal name on another Kubernetes-like platform).
 */
function addForwardedHost(proxyReq: any, req: any) {
    const host = req.headers["x-forwarded-host"] || req.headers.host;

    if (host) {
        proxyReq.setHeader("x-forwarded-host", host);
    }
}

interface ModelWConfig {
    siteName?: string;
    apiURL?: string;
    sentryDSN?: string;
    ENV?: string;
}

function defineModelWConfig(
    config: ModelWConfig,
    nuxtConfig?: NuxtConfig
): NuxtConfig {
    const defaultConfig = defineNuxtConfig(
        {
            app: {
                head: {
                    titleTemplate: config.siteName,
                },
                // @ts-ignore
                meta: [
                    { charset: "utf-8" },
                    {
                        name: "viewport",
                        content: "width=device-width, initial-scale=1",
                    },
                    { hid: "description", name: "description", content: "" },
                    { name: "format-detection", content: "telephone=no" },
                ],
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
                public: {
                    sentryDSN: config.sentryDSN,
                    serverTemplatedComponents: false,
                },
                ENV: config.ENV
            },

            build: {},

            modules: [
                "nuxt-runtime-compiler",
                "@model-w/axios",
                "@model-w/proxy",
                "@model-w/sentry"
            ]
        }
    );
    return defu(nuxtConfig, defaultConfig);
}

export default defineModelWConfig({
    siteName: "Model W",
    apiURL: process.env.API_URL,
    sentryDSN: process.env.SENTRY_DSN,
    ENV: ""
});
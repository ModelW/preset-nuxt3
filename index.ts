// @ts-ignore
import { defineNuxtConfig } from "nuxt/config";
import { defu } from "defu";
import type { NuxtConfig } from "nuxt/schema";
import type { ModuleOptions as SentryOptions } from "@model-w/sentry";
import type { ModuleOptions as ProxyOptions } from "@model-w/proxy";

/**
 * Signature of calls to EnvManager to avoid inconsistent calls to the same
 * var.
 */
type Signature = {
    defaultValue: any;
    buildDefault: any;
};

/**
 * Error thrown when a required env var is missing.
 */
class ImproperlyConfigured extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ImproperlyConfigured";
    }
}

/**
 * This helps keeping track of environment variables that are used, mandatory,
 * etc.
 */
class EnvManager {
    private getSignatures: Record<string, Signature> = {};
    private signatureMismatch: Set<string> = new Set();
    private inBuildMode: boolean = JSON.parse(
        process.env.BUILD_MODE || "false"
    );
    private missing: Set<string> = new Set();
    private read: Record<string, { isRequired: boolean }> = {};
    private syntaxError: Set<string> = new Set();

    /**
     * Gets an environment variable
     *
     * @param name Name of the variable
     * @param defaultValue Default value, if any
     * @param buildDefault Default value when building to avoid an error to be
     *  raised
     */
    get({
        name,
        defaultValue,
        buildDefault,
    }: {
        name: string;
        defaultValue?: any;
        buildDefault?: any;
    }): any {
        const signature = { defaultValue, buildDefault };

        if (this.getSignatures.hasOwnProperty(name)) {
            if (
                signature.defaultValue !==
                    this.getSignatures[name].defaultValue ||
                signature.buildDefault !== this.getSignatures[name].buildDefault
            ) {
                this.signatureMismatch.add(name);
            }
        } else {
            this.getSignatures[name] = signature;
        }

        const currentDefault =
            this.inBuildMode && buildDefault !== undefined
                ? buildDefault
                : defaultValue;

        this.read[name] = {
            isRequired: currentDefault === undefined,
        };

        if (typeof process.env[name] === "undefined") {
            if (currentDefault === undefined) {
                this.missing.add(name);
            }

            return currentDefault;
        }

        return process.env[name];
    }

    /**
     * Checks for any missing var or inconsistency in order to nicely warn
     * the user.
     */
    raiseParseFail(): void {
        if (
            this.get({
                name: "NO_ENV_CHECK",
                defaultValue: false,
                buildDefault: false,
            })
        ) {
            return;
        }

        if (
            !this.missing.size &&
            !this.syntaxError.size &&
            !this.signatureMismatch.size
        ) {
            return;
        }

        const parts: string[] = ["Incorrect environment variables."];

        if (this.missing.size) {
            parts.push(` Missing: ${Array.from(this.missing).join(", ")}.`);
        }

        if (this.syntaxError.size) {
            parts.push(
                ` Syntax error: ${Array.from(this.syntaxError).join(", ")}.`
            );
        }

        if (this.signatureMismatch.size) {
            parts.push(
                ` get() calls mismatch: ${Array.from(
                    this.signatureMismatch
                ).join(", ")}.`
            );
        }

        throw new ImproperlyConfigured(parts.join(""));
    }
}

export interface ModelWConfig {
    /**
     * Site name for display purposes
     */
    siteName?: string;

    /**
     * URL of the API, defaults to API_URL env var
     */
    apiUrl?: string;

    /**
     * Arbitrary data to put in runtime config
     */
    runtimeConfig?: Extract<NuxtConfig, "runtimeConfig">;

    /**
     * DSN for Sentry, defaults to SENTRY_DSN env var
     */
    sentryDsn?: string;

    /**
     * Environment name, especially for Sentry
     */
    environment?: string;

    /**
     * Raw "app" setting, will be merged with defaults
     */
    app?: Extract<NuxtConfig, "app">;

    /**
     * Raw "head" setting from the "app" setting, will be merged with defaults
     */
    head?: Extract<Extract<NuxtConfig, "app">, "head">;

    /**
     * Additional list of modules you'd like to have
     */
    moduleConfig?: Array<any>;

    /**
     * URL prefix of the backend (without initial /), defaults to back
     */
    backAlias?: string;

    /**
     * URL prefix of the CMS admin (without initial /), defaults to cms
     */
    cmsAlias?: string;

    /**
     * Additional rules for the proxy module
     */
    proxyFilters?: Array<any>;

    /**
     * Set to false to disable the runtime template compilation (which makes
     * the bundle lighter)
     */
    enableRuntimeTemplate?: boolean;
}

/**
 * Context manager that checks env consistency at the end
 *
 * @param func Function to call. The return value will be propagated
 */
export function envManager<T>(func: (env: EnvManager) => T): T {
    const env = new EnvManager();
    const out = func(env);

    env.raiseParseFail();

    return out;
}

/**
 * Define a Nuxt config with Model W defaults
 *
 * @param env Env manager (from the envManager context manager)
 * @param config Your config
 */
export function defineModelWConfig(
    env: EnvManager,
    config: ModelWConfig
): NuxtConfig {
    const siteName = config.siteName || "Model W";
    const head: Extract<Extract<NuxtConfig, "app">, "head"> = defu(
        config.head || {},
        {
            titleTemplate: `%s - ${siteName}`,
        }
    );
    const app: Extract<NuxtConfig, "app"> = defu(config.app || {}, {
        head,
    });
    const apiUrl =
        config.apiUrl ||
        env.get({ name: "NUXT_API_URL", buildDefault: "http://localhost" });

    const proxyTarget = config.apiUrl ||
        env.get({ name: "NUXT_PROXY_OPTIONS_TARGET", buildDefault: "http://localhost" });
    const backAlias = config.backAlias || "back";
    const cmsAlias = config.cmsAlias || "wubba-lubba-dub-dub";

    const previewSnippetRegex = new RegExp(
        `^/${cmsAlias}/snippets/[^/]+/[^/]+/preview(/[^/]+)?/$`
    );
    const previewEditRegex = new RegExp(
        `^/${cmsAlias}/pages/[^/]+/edit/preview/$`
    );
    const previewAddRegex = new RegExp(
        `^/${cmsAlias}/pages/add/[^/]+/[^/]+/[^/]+/preview/$`
    );

    const sentryDsn =
        config.sentryDsn || env.get({ name: "NUXT_PUBLIC_SENTRY_DSN", defaultValue: "" });
    const sentryEnvironment =
        config.environment ||
        env.get({
            name: "NUXT_PUBLIC_SENTRY_ENVIRONMENT",
            defaultValue: sentryDsn ? undefined : "",
        });

    const enableRuntimeTemplate = config.enableRuntimeTemplate !== false;

    const generatedConfig: NuxtConfig = {
        app,

        runtimeConfig: defu(config.runtimeConfig || {}, {
            apiUrl,
            proxy: {
                options: { target: proxyTarget },
            },
            public: {
                sentry: {
                    dsn: sentryDsn,
                    environment: sentryEnvironment,
                },
            },
        }),

        proxy: {
            options: {
                target: apiUrl,
                changeOrigin: true,
            },
            forwardHost: true,
            filters: [
                ...(config.proxyFilters || []),
                {
                    header: /x-reach-api:.+/,
                },
                {
                    path: previewEditRegex,
                    method: /^(?!POST$).*/,
                    useProxy: false,
                },
                {
                    path: previewAddRegex,
                    method: /^(?!POST$).*/,
                    useProxy: false,
                },
                {
                    path: previewSnippetRegex,
                    method: /^(?!POST$).*/,
                    useProxy: false
                },
                {
                    path: `/${backAlias}`,
                },
                {
                    path: `/${cmsAlias}`,
                },
            ],
        } as ProxyOptions,

        sentry: {
            dsn: sentryDsn,
            environment: sentryEnvironment,
        } as SentryOptions,

        modules: [
            "@model-w/axios",
            "@model-w/sentry",
            "@model-w/proxy",
            ...(config.moduleConfig || []),
        ],

        ...(enableRuntimeTemplate
            ? {
                  experimental: {
                      runtimeVueCompiler: true,
                  },
              }
            : {}),
    };

    return defineNuxtConfig(generatedConfig);
}

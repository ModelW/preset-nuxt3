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
    siteName?: string;
    apiUrl?: string;
    runtimeConfig?: Extract<NuxtConfig, "runtimeConfig">;
    sentryDsn?: string;
    environment?: string;
    app?: Extract<NuxtConfig, "app">;
    head?: Extract<Extract<NuxtConfig, "app">, "head">;
    moduleConfig?: Array<any>;
    backAlias?: string;
    cmsAlias?: string;
    proxyFilters?: Array<any>;
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
        env.get({ name: "API_URL", buildDefault: "http://localhost" });

    const backAlias = config.backAlias || "back";
    const cmsAlias = config.cmsAlias || "wubba-lubba-dub-dub";

    const previewEditRegex = new RegExp(
        `^/${cmsAlias}/pages/[^/]+/edit/preview/$`
    );
    const previewAddRegex = new RegExp(
        `^/${cmsAlias}/pages/add/[^/]+/[^/]+/[^/]+/preview/$`
    );

    const sentryDsn =
        config.sentryDsn || env.get({ name: "SENTRY_DSN", defaultValue: "" });
    const environment =
        config.environment ||
        env.get({
            name: "ENVIRONMENT",
            defaultValue: sentryDsn ? undefined : "",
        });

    const generatedConfig: NuxtConfig = {
        app,

        runtimeConfig: defu(config.runtimeConfig || {}, {
            apiUrl,
        }),

        proxy: {
            options: {
                target: apiUrl,
                changeOrigin: true,
            },
            forwardHost: true,
            filters: [
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
                    path: `/${backAlias}`,
                },
                {
                    path: `/${cmsAlias}`,
                },
                ...(config.proxyFilters || []),
            ],
        } as ProxyOptions,

        sentry: {
            dsn: sentryDsn,
            environment: environment,
        } as SentryOptions,

        modules: [
            "@model-w/axios",
            "@model-w/sentry",
            "@model-w/proxy",
            ...(config.moduleConfig || []),
        ],
    };

    return defineNuxtConfig(generatedConfig);
}

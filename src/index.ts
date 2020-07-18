import { TokenService } from "./services/TokenService";

import { InitMessage, AddonMode, PredefinedMeetingState, MessageType } from "meet-addons-sdk";
import { ISessionTokenInfo } from "./services/ISessionTokenInfo";

const index = async () => {
    const w = window as any;
    console.log("[Meet|DevTools]::> START", w.vivani);

    let tokenResolver: (value?: ISessionTokenInfo | PromiseLike<ISessionTokenInfo>) => void;
    const tokenPromise = new Promise<ISessionTokenInfo>((resolve) => {
        tokenResolver = resolve;
    });
    // note: m1 - initializing token resolver
    tokenPromise.then();

    w.vivani = w.vivani || {};
    w.vivani.devTools = w.vivani.devTools || {
        getSessionToken: () => tokenPromise
    };

    const host = localStorage.getItem("meet-dev-sdk-host");
    const addonIdentifier = localStorage.getItem("meet-dev-sdk-addon-id");
    if (!host || !addonIdentifier ) {
        return Promise.reject("[Meet|DevTools]:To use token service please define in local storage meet-dev-sdk-host and meet-dev-sdk-addon-id");
    } 

    const tokenService = new TokenService();
    const tenantToken = await tokenService.getTenantTokenAsync();
    const sessionTokenInfo = await tokenService.getSessionTokenAsync(tenantToken.access_token, addonIdentifier);

    if (tokenResolver) {
        console.log("[Meet|DevTools]::> w.vivani.getSessionToken -> resolving", sessionTokenInfo);
        tokenResolver(sessionTokenInfo)
    }

    console.log("[Meet|DevTools]::> w.vivani", w.vivani);

    if (w.vivani.sdk) {
        const resourceType = localStorage.getItem("meet-dev-sdk-type") || '1';
        if (resourceType !== '1') {
            console.log("[Meet|DevTools]::> not in addon mode - skipping initialization of addon sdk");
        } else {
            const addonRuntimeInfo = await tokenService.getAddonRuntimeInfoAsync(sessionTokenInfo.token.access_token);
            const msg: InitMessage = {
                configuration: [],
                mode: AddonMode.NORMAL,
                participants: [],
                host: {
                    authHost: host.replace("/v1", ""),
                    origin: host.replace("/v1", "")
                },
                principal: {
                    addonIdentifier: addonIdentifier,
                    color: "#303F9F",
                    displayName: `FirstName LastName`,
                    isGuest: false,
                    sessionId: addonRuntimeInfo.sessionId,
                    sessionUserId: addonRuntimeInfo.sessionUserId,
                    sessionUserRole: addonRuntimeInfo.sessionUserRole,
                    tenant: addonRuntimeInfo.tenant,
                    theme: "dark",
                    token: addonRuntimeInfo.token,
                },
                settings: addonRuntimeInfo.settings,
                state: PredefinedMeetingState.MEETING_STARTED,
                type: MessageType.INIT,
            };
            console.log("[Meet|DevTools]::> AddonsSdk.onInit", w.vivani);
            w.vivani.sdk.onInit(msg);
        }
    }
}

index().then(() => console.log("[Meet|DevTools]::> END"));
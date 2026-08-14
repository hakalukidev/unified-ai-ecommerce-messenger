import axios from "axios";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Account from "../models/Account";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";

const signToken = (sellerId: string) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign({ sellerId }, secret, { expiresIn: "7d" });
};

const graphVersion = process.env.META_GRAPH_VERSION ?? "v23.0";
const facebookPagesLoginPath = "/api/auth/facebook/pages-login";
const instagramBusinessLoginPath = "/api/auth/instagram/business-login";
const facebookCallbackPath = facebookPagesLoginPath;
const facebookSettingsPath = "/settings";
const instagramCallbackPath = instagramBusinessLoginPath;
const instagramSettingsPath = "/settings";
const facebookOAuthScopes = [
  "pages_show_list",
  "pages_messaging",
  "pages_manage_metadata",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_manage_messages",
  "business_management",
];
const instagramOAuthScopes = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
  "instagram_business_content_publish",
  "instagram_business_manage_insights",
];

interface InstagramOAuthState {
  sellerId: string;
  platform: "facebook" | "instagram";
}

interface MetaOAuthTokenResponse {
  access_token?: string;
}

interface InstagramOAuthTokenResponse {
  access_token?: string;
}

interface InstagramMeResponse {
  id?: string;
  user_id?: string;
  username?: string;
  name?: string;
}

interface MetaPageAccount {
  id?: string;
  name?: string;
  access_token?: string;
  instagram_business_account?: {
    id?: string;
    name?: string;
    username?: string;
  };
}

const getServerOrigin = (req: Request) => {
  const serverUrl = process.env.SERVER_URL?.trim();

  if (serverUrl) {
    return serverUrl.replace(/\/$/, "");
  }

  return `${req.protocol}://${req.get("host")}`;
};

const getClientOrigin = () => {
  const clientUrl = process.env.CLIENT_URL?.trim();

  if (clientUrl) {
    return clientUrl.replace(/\/$/, "");
  }

  return "http://localhost:3000";
};

const getWebhookUrl = (
  req: Request,
  platform: "facebook" | "instagram" | "whatsapp",
) => `${getServerOrigin(req)}/api/webhooks/${platform}`;

const getInstagramCallbackUrl = (req: Request) =>
  `${getServerOrigin(req)}${instagramCallbackPath}`;

const getFacebookCallbackUrl = (req: Request) =>
  `${getServerOrigin(req)}${facebookCallbackPath}`;

const isInstagramBusinessLoginCallbackRequest = (req: Request) =>
  [
    req.query.code,
    req.query.state,
    req.query.error,
    req.query.error_reason,
    req.query.error_description,
  ].some((value) => value !== undefined);

const getInstagramStateSecret = () => {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
};

const getMetaCredentials = () => {
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();

  if (!appId || !appSecret) {
    throw new Error("META_APP_ID and META_APP_SECRET must both be configured.");
  }

  return { appId, appSecret };
};

const signInstagramState = (sellerId: string) =>
  jwt.sign(
    {
      sellerId,
      platform: "instagram",
    } satisfies InstagramOAuthState,
    getInstagramStateSecret(),
    { expiresIn: "15m" },
  );

const signFacebookState = (sellerId: string) =>
  jwt.sign(
    {
      sellerId,
      platform: "facebook",
    } satisfies InstagramOAuthState,
    getInstagramStateSecret(),
    { expiresIn: "15m" },
  );

const verifyMetaState = (
  state: string,
  expectedPlatform: InstagramOAuthState["platform"],
) => {
  const payload = jwt.verify(state, getInstagramStateSecret()) as
    | InstagramOAuthState
    | string;

  if (
    typeof payload === "string" ||
    payload.platform !== expectedPlatform ||
    !payload.sellerId
  ) {
    throw new Error(`Invalid ${expectedPlatform} login state.`);
  }

  return payload.sellerId;
};

const appendRedirectParams = (
  url: URL,
  params: Record<string, string | number | undefined>,
) => {
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }

    url.searchParams.set(key, String(value));
  });
};

const redirectInstagramResult = (
  res: Response,
  outcome: "success" | "error",
  params: Record<string, string | number | undefined> = {},
) => {
  const clientUrl = new URL(getClientOrigin());
  clientUrl.pathname = instagramSettingsPath;
  clientUrl.searchParams.set("instagram_business_login", outcome);
  appendRedirectParams(clientUrl, params);

  return res.redirect(302, clientUrl.toString());
};

const redirectFacebookResult = (
  res: Response,
  outcome: "success" | "error",
  params: Record<string, string | number | undefined> = {},
) => {
  const clientUrl = new URL(getClientOrigin());
  clientUrl.pathname = facebookSettingsPath;
  clientUrl.searchParams.set("facebook_pages_login", outcome);
  appendRedirectParams(clientUrl, params);

  return res.redirect(302, clientUrl.toString());
};

const getSharedMetaLoginConfig = (callbackUrl: string) => {
  const missingConfiguration: string[] = [];

  if (!process.env.META_APP_ID?.trim()) {
    missingConfiguration.push("META_APP_ID");
  }

  if (!process.env.META_APP_SECRET?.trim()) {
    missingConfiguration.push("META_APP_SECRET");
  }

  if (!process.env.JWT_SECRET?.trim()) {
    missingConfiguration.push("JWT_SECRET");
  }

  return {
    callback_url: callbackUrl,
    missing_configuration: missingConfiguration,
    ready: missingConfiguration.length === 0,
  };
};

const getFacebookPagesLoginConfig = (req: Request) => ({
  ...getSharedMetaLoginConfig(getFacebookCallbackUrl(req)),
  webhook_url: getWebhookUrl(req, "facebook"),
  verify_token_configured: Boolean(process.env.VERIFY_TOKEN?.trim()),
});

const getInstagramBusinessLoginConfig = (req: Request) => {
  const config = getSharedMetaLoginConfig(getInstagramCallbackUrl(req));

  return {
    ...config,
    uses_business_config: Boolean(process.env.META_BUSINESS_CONFIG_ID?.trim()),
  };
};

const buildFacebookPagesLoginUrl = (req: Request, sellerId: string) => {
  const { appId } = getMetaCredentials();
  const loginUrl = new URL(`https://www.facebook.com/${graphVersion}/dialog/oauth`);

  loginUrl.searchParams.set("client_id", appId);
  loginUrl.searchParams.set("redirect_uri", getFacebookCallbackUrl(req));
  loginUrl.searchParams.set("response_type", "code");
  loginUrl.searchParams.set("state", signFacebookState(sellerId));
  loginUrl.searchParams.set("scope", facebookOAuthScopes.join(","));

  return loginUrl.toString();
};

const buildInstagramBusinessLoginUrl = (req: Request, sellerId: string) => {
  const { appId } = getMetaCredentials();
  const loginUrl = new URL("https://www.instagram.com/oauth/authorize");

  loginUrl.searchParams.set("force_reauth", "true");
  loginUrl.searchParams.set("client_id", appId);
  loginUrl.searchParams.set("redirect_uri", getInstagramCallbackUrl(req));
  loginUrl.searchParams.set("response_type", "code");
  loginUrl.searchParams.set("state", signInstagramState(sellerId));
  loginUrl.searchParams.set("scope", instagramOAuthScopes.join(","));

  return loginUrl.toString();
};

const exchangeFacebookCodeForAccessToken = async (
  code: string,
  redirectUri: string,
) => {
  const { appId, appSecret } = getMetaCredentials();
  const tokenUrl = `https://graph.facebook.com/${graphVersion}/oauth/access_token`;
  const response = await axios.get<MetaOAuthTokenResponse>(tokenUrl, {
    params: {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    },
  });
  const accessToken = response.data.access_token?.trim();

  if (!accessToken) {
    throw new Error("Meta did not return an access token.");
  }

  return accessToken;
};

const exchangeFacebookForLongLivedAccessToken = async (accessToken: string) => {
  const { appId, appSecret } = getMetaCredentials();
  const tokenUrl = `https://graph.facebook.com/${graphVersion}/oauth/access_token`;
  const response = await axios.get<MetaOAuthTokenResponse>(tokenUrl, {
    params: {
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: accessToken,
    },
  });

  return response.data.access_token?.trim() || accessToken;
};

const exchangeInstagramCodeForAccessToken = async (
  code: string,
  redirectUri: string,
) => {
  const { appId, appSecret } = getMetaCredentials();
  const tokenUrl = "https://api.instagram.com/oauth/access_token";
  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });
  const response = await axios.post<InstagramOAuthTokenResponse>(tokenUrl, body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  const accessToken = response.data.access_token?.trim();

  if (!accessToken) {
    throw new Error("Instagram did not return an access token.");
  }

  return accessToken;
};

const exchangeInstagramForLongLivedAccessToken = async (accessToken: string) => {
  const { appSecret } = getMetaCredentials();
  const response = await axios.get<InstagramOAuthTokenResponse>(
    "https://graph.instagram.com/access_token",
    {
      params: {
        grant_type: "ig_exchange_token",
        client_secret: appSecret,
        access_token: accessToken,
      },
    },
  );

  return response.data.access_token?.trim() || accessToken;
};

const fetchFacebookPages = async (accessToken: string) => {
  const response = await axios.get<{ data?: MetaPageAccount[] }>(
    `https://graph.facebook.com/${graphVersion}/me/accounts`,
    {
      params: {
        access_token: accessToken,
        fields: "id,name,access_token",
      },
    },
  );

  return (response.data.data ?? [])
    .map((page) => {
      const pageId = page.id?.trim();
      const pageAccessToken = page.access_token?.trim() || accessToken;

      if (!pageId || !pageAccessToken) {
        return null;
      }

      return {
        accessToken: pageAccessToken,
        pageId,
        pageName: page.name?.trim() || "Facebook Page",
      };
    })
    .filter((page): page is NonNullable<typeof page> => page !== null);
};

const subscribeFacebookPageToWebhooks = async (
  pageId: string,
  pageAccessToken: string,
) => {
  await axios.post(
    `https://graph.facebook.com/${graphVersion}/${pageId}/subscribed_apps`,
    null,
    {
      params: {
        access_token: pageAccessToken,
        subscribed_fields: "messages,messaging_postbacks",
      },
    },
  );
};

const fetchInstagramBusinessAccounts = async (accessToken: string) => {
  const response = await axios.get<InstagramMeResponse>(
    `https://graph.instagram.com/${graphVersion}/me`,
    {
      params: {
        access_token: accessToken,
        fields: "id,user_id,username,name",
      },
    },
  );
  const instagramId = response.data.user_id?.trim() || response.data.id?.trim();

  if (!instagramId) {
    return [];
  }

  return [
    {
      accessToken,
      pageId: instagramId,
      pageName:
        response.data.name?.trim() ||
        response.data.username?.trim() ||
        "Instagram Business Account",
      pageUsername: response.data.username?.trim(),
    },
  ];
};

const getMetaErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? error.message
      : "Instagram business login failed.";
  }

  const metaMessage =
    (error.response?.data as
      | { error?: { message?: string } }
      | undefined)?.error?.message ?? error.message;

  return metaMessage || "Instagram business login failed.";
};

export const register = (req: AuthenticatedRequest, res: Response) => {
  const sellerId = String(req.body?.seller_id ?? "").trim();

  if (!sellerId) {
    return res.status(400).json({ message: "seller_id is required." });
  }

  return res.status(201).json({
    seller_id: sellerId,
    token: signToken(sellerId),
  });
};

export const login = (req: AuthenticatedRequest, res: Response) => {
  const sellerId = String(req.body?.seller_id ?? "").trim();

  if (!sellerId) {
    return res.status(400).json({ message: "seller_id is required." });
  }

  return res.json({
    seller_id: sellerId,
    token: signToken(sellerId),
  });
};

export const getMe = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  return res.json({
    seller_id: req.user.sellerId,
  });
};

const completeInstagramBusinessLogin = async (req: Request, res: Response) => {
  const code = String(req.query.code ?? "").trim();
  const state = String(req.query.state ?? "").trim();
  const errorReason = String(
    req.query.error_description ?? req.query.error_reason ?? req.query.error ?? "",
  ).trim();

  if (errorReason) {
    return redirectInstagramResult(res, "error", {
      message: errorReason,
    });
  }

  if (!code || !state) {
    return redirectInstagramResult(res, "error", {
      message: "Meta did not return both code and state.",
    });
  }

  let sellerId: string;

  try {
    sellerId = verifyMetaState(state, "instagram");
  } catch (error) {
    return redirectInstagramResult(res, "error", {
      message:
        error instanceof Error
          ? error.message
          : "Unable to verify Instagram business login state.",
    });
  }

  try {
    const shortLivedAccessToken = await exchangeInstagramCodeForAccessToken(
      code,
      getInstagramCallbackUrl(req),
    );
    const accessToken = await exchangeInstagramForLongLivedAccessToken(
      shortLivedAccessToken,
    ).catch(() => shortLivedAccessToken);
    const instagramAccounts = await fetchInstagramBusinessAccounts(accessToken);

    if (instagramAccounts.length === 0) {
      return redirectInstagramResult(res, "error", {
        message:
          "No Instagram business accounts were returned for this Meta login.",
      });
    }

    await Promise.all(
      instagramAccounts.map((account) =>
        Account.findOneAndUpdate(
          {
            seller_id: sellerId,
            platform: "instagram",
            page_id: account.pageId,
          },
          {
            seller_id: sellerId,
            platform: "instagram",
            page_id: account.pageId,
            page_name: account.pageName,
            page_username: account.pageUsername,
            access_token: account.accessToken,
            ai_enabled: true,
            status: "active",
          },
          {
            returnDocument: "after",
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
          },
        ),
      ),
    );

    return redirectInstagramResult(res, "success", {
      connected: instagramAccounts.length,
      message: `Connected ${instagramAccounts.length} Instagram business account${
        instagramAccounts.length === 1 ? "" : "s"
      }.`,
    });
  } catch (error) {
    return redirectInstagramResult(res, "error", {
      message: getMetaErrorMessage(error),
    });
  }
};

const completeFacebookPagesLogin = async (req: Request, res: Response) => {
  const code = String(req.query.code ?? "").trim();
  const state = String(req.query.state ?? "").trim();
  const errorReason = String(
    req.query.error_description ?? req.query.error_reason ?? req.query.error ?? "",
  ).trim();

  if (errorReason) {
    return redirectFacebookResult(res, "error", {
      message: errorReason,
    });
  }

  if (!code || !state) {
    return redirectFacebookResult(res, "error", {
      message: "Meta did not return both code and state.",
    });
  }

  let sellerId: string;

  try {
    sellerId = verifyMetaState(state, "facebook");
  } catch (error) {
    return redirectFacebookResult(res, "error", {
      message:
        error instanceof Error
          ? error.message
          : "Unable to verify Facebook login state.",
    });
  }

  try {
    const shortLivedAccessToken = await exchangeFacebookCodeForAccessToken(
      code,
      getFacebookCallbackUrl(req),
    );
    const accessToken = await exchangeFacebookForLongLivedAccessToken(
      shortLivedAccessToken,
    ).catch(() => shortLivedAccessToken);
    const pages = await fetchFacebookPages(accessToken);

    if (pages.length === 0) {
      return redirectFacebookResult(res, "error", {
        message: "No Facebook Pages were returned for this Meta login.",
      });
    }

    await Promise.all(
      pages.map(async (page) => {
        await subscribeFacebookPageToWebhooks(page.pageId, page.accessToken);

        return Account.findOneAndUpdate(
          {
            seller_id: sellerId,
            platform: "facebook",
            page_id: page.pageId,
          },
          {
            seller_id: sellerId,
            platform: "facebook",
            page_id: page.pageId,
            page_name: page.pageName,
            access_token: page.accessToken,
            ai_enabled: true,
            status: "active",
          },
          {
            returnDocument: "after",
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
          },
        );
      }),
    );

    return redirectFacebookResult(res, "success", {
      connected: pages.length,
      message: `Connected ${pages.length} Facebook Page${
        pages.length === 1 ? "" : "s"
      }.`,
    });
  } catch (error) {
    return redirectFacebookResult(res, "error", {
      message: getMetaErrorMessage(error),
    });
  }
};

export const getFacebookPagesLogin = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (isInstagramBusinessLoginCallbackRequest(req)) {
    return completeFacebookPagesLogin(req, res);
  }

  return res.json(getFacebookPagesLoginConfig(req));
};

export const startFacebookPagesLogin = (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  try {
    return res.json({
      callback_url: getFacebookCallbackUrl(req),
      login_url: buildFacebookPagesLoginUrl(req, req.user.sellerId),
    });
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to start Facebook Pages login.",
    });
  }
};

export const handleFacebookPagesLoginCallback = async (
  req: Request,
  res: Response,
) => completeFacebookPagesLogin(req, res);

export const getInstagramBusinessLogin = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (isInstagramBusinessLoginCallbackRequest(req)) {
    return completeInstagramBusinessLogin(req, res);
  }

  return res.json(getInstagramBusinessLoginConfig(req));
};

export const startInstagramBusinessLogin = (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  try {
    return res.json({
      callback_url: getInstagramCallbackUrl(req),
      login_url: buildInstagramBusinessLoginUrl(req, req.user.sellerId),
    });
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Unable to start Instagram business login.",
    });
  }
};

export const handleInstagramBusinessLoginCallback = async (
  req: Request,
  res: Response,
) => completeInstagramBusinessLogin(req, res);

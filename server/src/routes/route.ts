import express from "express";
import rateLimit from "express-rate-limit";
import https from "https";
import { Links } from "../interfaces/link";
import { LinkResponse } from "../interfaces/linkResponse";
import { LinkModel } from "../models/link";
import { getAccessToken } from "./ga";

export const router = express.Router();

// --- Rate limiting: max 20 link creations per IP per 15 minutes ---
const createLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { success: false, msg: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- reCAPTCHA v3 server-side verification ---
function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    // Secret key not configured — skip verification (development mode)
    console.warn("RECAPTCHA_SECRET_KEY not set; skipping reCAPTCHA verification");
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const postData = new URLSearchParams({ secret, response: token }).toString();
    const options = {
      hostname: "www.google.com",
      path: "/recaptcha/api/siteverify",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          // v3: score >= 0.5 is considered human; v2 has no score field
          const passed =
            result.success === true &&
            (result.score === undefined || result.score >= 0.5);
          resolve(passed);
        } catch {
          resolve(false);
        }
      });
    });
    req.on("error", () => resolve(false));
    req.write(postData);
    req.end();
  });
}

// --- URL validation: only allow http and https schemes ---
function isValidUrl(url: string): boolean {
  try {
    // Prepend https:// if no scheme is present so URL constructor can parse it
    const normalized = /^\w+:\/\//.test(url) ? url : "https://" + url;
    const parsed = new URL(normalized);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

router.get("/link", async (req, res) => {
  try {
    const links = await LinkModel.find().lean();
    const linkArray: Links = links.map((link) => ({
      shortLink: link.short_link,
      originalLink: link.original_link,
      creationDate: link.creation_date?.toISOString(),
      usageCount: link.usage_count ?? undefined,
    }));
    res.json(linkArray);
  } catch (err) {
    console.log(err);
    res.status(500).json(LinkResponse.fail("failed to list links"));
  }
});

router.get("/link/:shortlink", async (req, res) => {
  const update = { $inc: { usage_count: 1 } };
  const condition = { short_link: req.params.shortlink };
  try {
    const doc = await LinkModel.findOneAndUpdate(condition, update);
    if (doc) {
      res.json(
        LinkResponse.success({
          shortLink: doc.short_link,
          originalLink: doc.original_link,
          creationDate: doc.creation_date?.toISOString(),
          usageCount: doc.usage_count ?? undefined,
        })
      );
      if (!doc.usage_count) {
        await LinkModel.updateOne(condition, { usage_count: 1 });
      }
    } else {
      res.json(LinkResponse.success(undefined));
    }
  } catch (err) {
    console.log(err);
    res.json(LinkResponse.fail("failed to get the link"));
  }
});

router.post("/link", createLinkLimiter, async (req, res) => {
  if (!req.body?.shortLink || !req.body?.originalLink) {
    res.json(LinkResponse.fail("shortLink or originalLink key does not exist"));
    return;
  }

  // Server-side URL validation — blocks javascript:, data:, and other unsafe schemes
  if (!isValidUrl(req.body.originalLink)) {
    res
      .status(400)
      .json(LinkResponse.fail("Invalid URL: only http and https are allowed"));
    return;
  }

  // reCAPTCHA verification
  const recaptchaToken: string = req.body.recaptchaToken || "";
  const isHuman = await verifyRecaptcha(recaptchaToken);
  if (!isHuman) {
    res
      .status(400)
      .json(LinkResponse.fail("reCAPTCHA verification failed. Please try again."));
    return;
  }

  const condition = { short_link: req.body.shortLink };
  const update = {
    short_link: req.body.shortLink,
    original_link: req.body.originalLink,
    ip: req.ip,
    creation_date: new Date(),
    usage_count: 0,
  };
  const option = {
    upsert: true /* if not found, insert a new one*/,
    new: true /*return the updated document*/,
  };
  try {
    const doc = await LinkModel.findOneAndUpdate(condition, update, option);
    res.json(
      LinkResponse.success(
        {
          shortLink: doc.short_link,
          originalLink: doc.original_link,
          usageCount: doc.usage_count ?? undefined,
          creationDate: doc.creation_date?.toISOString(),
        },
        "link added successfully"
      )
    );
  } catch (err) {
    console.log(err);
    res.json(LinkResponse.fail("failed to add link"));
  }
});

/**
 * Google Analytics API
 */
router.get("/ga-token", (req, res) => {
  getAccessToken().then((accessToken) => res.json(accessToken));
});

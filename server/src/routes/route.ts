import express from "express";
import { LinkResponse, Status } from "../interfaces/linkResponse";
import { getAccessToken } from "./ga";
export const router = express.Router();

import { LinkModel } from "../models/link";

router.get("/link", (req, res) => {
  LinkModel.find(function (error, links) {
    res.json(links);
  });
});

router.get("/link/:shortlink", (req, res) => {
  LinkModel.findOne({ short_link: req.params.shortlink }, function (err, doc) {
    if (err) {
      console.log(err);
      res.json(LinkResponse.fail("failed to get the link"));
    } else {
      if (doc) {
        res.json(
          LinkResponse.success({
            shortLink: doc.short_link,
            originalLink: doc.original_link,
          })
        );
      } else {
        res.json(LinkResponse.success(undefined));
      }
    }
  });
});

router.post("/link", (req, res) => {
  if (!req.body.shortLink || !req.body.originalLink) {
    res.json(LinkResponse.fail("shortLink or originalLink key does not exist"));
    return;
  }
  const condition = { short_link: req.body.shortLink };
  const update = {
    short_link: req.body.shortLink,
    original_link: req.body.originalLink,
    ip: req.ip,
  };
  const option = {
    upsert: true /* if not found, insert a new one*/,
    new: true /*return the updated document*/,
    useFindAndModify: false,
  };
  LinkModel.findOneAndUpdate(condition, update, option, (err, doc) => {
    if (err) {
      console.log(err);
      res.json(LinkResponse.fail("failed to add link"));
    } else {
      res.json(
        LinkResponse.success(
          { shortLink: doc.short_link, originalLink: doc.original_link },
          "link added successfully"
        )
      );
    }
  });
});

/**
 * Google Analytics API
 */
router.get("/ga-token", (req, res) => {
  getAccessToken().then((accessToken) => res.json(accessToken));
});

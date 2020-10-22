import express from "express";
import { Links } from "../interfaces/link";
import { LinkResponse } from "../interfaces/linkResponse";
import { LinkModel } from "../models/link";
import { getAccessToken } from "./ga";
export const router = express.Router();

router.get("/link", (req, res) => {
  LinkModel.find(function (error, links) {
    let linkArray: Links = [];
    for (let link of links) {
      linkArray.push({
        shortLink: link.short_link,
        originalLink: link.original_link,
        creationDate: link.creation_date,
        usageCount: link.usage_count,
      });
    }

    res.json(linkArray);
  });
});

router.get("/link/:shortlink", (req, res) => {
  const update = { $inc: { usage_count: 1 } };
  const condition = { short_link: req.params.shortlink };
  LinkModel.findOneAndUpdate(condition, update, function (err, doc) {
    if (err) {
      console.log(err);
      res.json(LinkResponse.fail("failed to get the link"));
    } else {
      if (doc) {
        res.json(
          LinkResponse.success({
            shortLink: doc.short_link,
            originalLink: doc.original_link,
            creationDate: doc.creation_date,
            usageCount: doc.usage_count,
          })
        );
        if (!doc.usage_count) {
          LinkModel.update(condition, { usage_count: 1 });
        }
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
    creation_date: new Date(),
    usage_count: 0,
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
          {
            shortLink: doc.short_link,
            originalLink: doc.original_link,
            usageCount: doc.usage_count,
            creationDate: doc.creation_date,
          },
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

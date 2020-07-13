const mongoose = require("mongoose");

const LinkSchema = mongoose.Schema({
  short_link: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  original_link: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
  },
  creation_time: {
    type: Date,
  },
});

export const LinkModel = mongoose.model("links", LinkSchema);

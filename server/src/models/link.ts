import mongoose, { InferSchemaType } from "mongoose";

const LinkSchema = new mongoose.Schema({
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
  creation_date: {
    type: Date,
  },
  usage_count: {
    type: Number,
  },
});

export type LinkDoc = InferSchemaType<typeof LinkSchema>;

export const LinkModel = mongoose.model("links", LinkSchema);

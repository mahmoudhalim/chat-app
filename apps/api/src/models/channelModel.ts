import { Schema, model, Document, Types } from "mongoose";

export interface ChannelDocument extends Document {
  id: string;
  serverId: Types.ObjectId;
  name: string;
  type: "text" | "voice" | "video";
}

const channelSchema = new Schema<ChannelDocument>({
  serverId: {
    type: Schema.Types.ObjectId,
    ref: "Server",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ["text", "voice", "video"],
    required: true,
    default: "text",
  },
}, { timestamps: true });

channelSchema.index({ serverId: 1 });

channelSchema.pre(
  "deleteOne",
  { document: false, query: true },
  async function () {
    const filter = this.getFilter() as { _id?: Types.ObjectId | string };
    if (!filter._id) {
      return;
    }

    await model("Message").deleteMany({ channel: filter._id });
  },
);


channelSchema.set("toJSON", {
  transform: function (_doc, ret) {
    const { __v, _id, ...rest } = ret;
    return {
      ...rest,
      id: _id,
    };
  },
});

export const Channel = model<ChannelDocument>("Channel", channelSchema);

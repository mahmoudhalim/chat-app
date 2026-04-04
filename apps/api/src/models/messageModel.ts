import { Schema, model, Document, Types} from "mongoose";


export interface MessageDocument extends Document {
  id: string;
  text: string;
  sender: Types.ObjectId;
  channel: Types.ObjectId;
}

const messageSchema = new Schema<MessageDocument>({
  text: { type: String, required: true },
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  channel: { type: Schema.Types.ObjectId, ref: "Channel", required: true, index: true },
}, { timestamps: true });

messageSchema.set("toJSON", {
  transform: function (_doc, ret) {
    const { __v, _id, ...rest } = ret;
    return {
      ...rest,
      id: _id,
    };
  },
});

export const Message = model<MessageDocument>("Message", messageSchema);
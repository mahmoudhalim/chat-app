import { Schema, model, Document, Types} from "mongoose";


export interface MessageDocument extends Document {
  id: string;
  text?: string;
  sender: Types.ObjectId;
  channel: Types.ObjectId;
  attachment?: {
    url: string;
    type: 'image' | 'pdf';
    name: string;
  };
}

const messageSchema = new Schema<MessageDocument>({
  text: { type: String },
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  channel: { type: Schema.Types.ObjectId, ref: "Channel", required: true, index: true },
  attachment: {
    url: { type: String },
    type: { type: String, enum: ['image', 'pdf'] },
    name: { type: String },
  },
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
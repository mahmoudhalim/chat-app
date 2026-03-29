import { Schema, model, Document, Types } from "mongoose";

interface ServerMember {
  userId: Types.ObjectId;
  joinedAt: Date;
}

export interface ServerDocument extends Document {
  id: string;
  name: string;
  ownerId: Types.ObjectId;
  inviteCode: string;
  members: ServerMember[];
}

const serverMemberSchema = new Schema<ServerMember>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const serverSchema = new Schema<ServerDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
  },
  members: [serverMemberSchema],
}, { timestamps: true });


serverSchema.set("toJSON", {
  transform: function (_doc, ret) {
    const { __v, _id, ...rest } = ret;
    return {
      ...rest,
      id: _id,
    };
  },
});

export const Server = model<ServerDocument>("Server", serverSchema);

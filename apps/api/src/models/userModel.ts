import { Schema, model, Document } from "mongoose";
import bcrypt from "bcrypt";

interface UserDocument extends Document {
  id: string;
  username: string;
  email: string;
  password: string;
  comparePassword(password: string): Promise<boolean>;
}
const userSchema = new Schema<UserDocument>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.set("toJSON", {
  transform: function (_doc, ret) {
    const { __v, _id, password, ...rest } = ret;
    return {
      ...rest,
      id: _id,
    };
  },
});

const User = model<UserDocument>("User", userSchema);

export { User, UserDocument };

import { Message } from "@models/messageModel";
import { type MessageDTO } from "@shared/models";

export const message = (socket: any) => {
  socket.on("chat:message", async (data: MessageDTO) => {
    try {
      const messageDocument = await (await Message.create(data)).populate("sender");
      
      socket.to(data.channel).emit("chat:message", messageDocument.toJSON());
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("chat:join", (data: { channelId: string }) => {
    socket.join(data.channelId);
  });

  socket.on("chat:leave", (data: {channelId: string}) => {
    socket.leave(data.channelId);
  });

  socket.on("disconnect", () => {
    console.log("a user disconnected");
  });

};

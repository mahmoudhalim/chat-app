import livekitService from "@services/livekitService";

export const voiceHandler = (io: any, socket: any) => {
  socket.on("voice:sync_request", async ({ channelId }: { channelId: string }) => {
    // Wait a brief moment to allow LiveKit to process the join/leave
    setTimeout(async () => {
      try {
        const users = await livekitService.getParticipantsInRoom(channelId);
        io.to(channelId).emit("voice:state_update", { channelId, users });
      } catch (error) {
        console.error("Failed to sync voice participants", error);
      }
    }, 500);
  });
};



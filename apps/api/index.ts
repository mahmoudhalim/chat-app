import { connect } from "./src/configs/mongoose.ts";
import { initSocket } from "./src/sockets";
import http from "http";
import app from "./src/app.js";
const PORT = 3000;

await connect();

const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

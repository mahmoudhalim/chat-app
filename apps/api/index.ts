import { connect } from "@configs/mongoose.js";
import app from "./src/app.js";
const PORT = 3000;

await connect();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

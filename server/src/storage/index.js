import * as localStorage from "./local.storage.js";
import * as r2Storage from "./r2.storage.js";

export default process.env.STORAGE_DRIVER === "r2" ? r2Storage : localStorage;

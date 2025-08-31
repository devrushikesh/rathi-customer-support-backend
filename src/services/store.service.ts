// otpStore.js
import NodeCache from "node-cache";

// stdTTL = default time-to-live (in seconds)
// checkperiod = how often expired keys are cleaned up
const otpCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 min TTL


export default otpCache;
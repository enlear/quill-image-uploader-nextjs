const nanoid = require("nanoid");
const alphabet = nanoid.customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  9
);

const generateRandomId = () => alphabet();

export default generateRandomId;

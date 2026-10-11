import { SOCIALS, type Social } from "./socials";

export const EMAIL = "volodymyrbondar17@gmail.com";

export const RESUME_URL = "https://drive.google.com/file/d/1hhQDKHFjVJh8Tj3Qsc8iTDswi-K7VF-Z/view?usp=sharing";

/** The channels Contact lists under the address, fastest first. */
export const CHANNELS: Social[] = (["Telegram", "LinkedIn", "GitHub"] as const).map(
  (name) => SOCIALS.find((social) => social.name === name)!
);

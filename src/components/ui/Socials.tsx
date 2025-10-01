import Link from "next/link";
import { FaGithub, FaInstagram, FaLinkedin, FaTelegram } from "react-icons/fa";

function Socials() {
  return (
    <ul className="flex items-center justify-center gap-4">
      <li>
        <Link
          href="https://www.instagram.com/l0nercs"
          rel="noopener noreferrer"
          target="_blank"
          className="p-2 border dark:border-white/20 border-black-100/20 dark:hover:border-neutral-500 dark:hover:[&>svg]:fill-neutral-500 hover:border-neutral-500 hover:[&>svg]:fill-neutral-500 transition duration-300 rounded-lg flex items-center justify-center"
        >
          <FaInstagram className="size-6 dark:fill-white fill-black-100 transition duration-300" />
        </Link>
      </li>
      <li>
        <Link
          href="https://github.com/l0nerof"
          rel="noopener noreferrer"
          target="_blank"
          className="p-2 border dark:border-white/20 border-black-100/20 dark:hover:border-neutral-500 dark:hover:[&>svg]:fill-neutral-500 hover:border-neutral-500 hover:[&>svg]:fill-neutral-500 transition duration-300 rounded-lg flex items-center justify-center"
        >
          <FaGithub className="size-6 dark:fill-white fill-black-100 transition duration-300" />
        </Link>
      </li>
      <li>
        <Link
          href="https://t.me/vovab_17"
          rel="noopener noreferrer"
          target="_blank"
          className="p-2 border dark:border-white/20 border-black-100/20 dark:hover:border-neutral-500 dark:hover:[&>svg]:fill-neutral-500 hover:border-neutral-500 hover:[&>svg]:fill-neutral-500 transition duration-300 rounded-lg flex items-center justify-center"
        >
          <FaTelegram className="size-6 dark:fill-white fill-black-100 transition duration-300" />
        </Link>
      </li>
      <li>
        <Link
          href="https://www.linkedin.com/in/bondar-volodymyr/"
          rel="noopener noreferrer"
          target="_blank"
          className="p-2 border dark:border-white/20 border-black-100/20 dark:hover:border-neutral-500 dark:hover:[&>svg]:fill-neutral-500 hover:border-neutral-500 hover:[&>svg]:fill-neutral-500 transition duration-300 rounded-lg flex items-center justify-center"
        >
          <FaLinkedin className="size-6 dark:fill-white fill-black-100 transition duration-300" />
        </Link>
      </li>
    </ul>
  );
}
export default Socials;

import Link from "next/link";
import { FaGithub, FaInstagram, FaLinkedin, FaTelegram } from "react-icons/fa";

function Socials() {
  return (
    <ul className="flex items-center justify-center gap-4">
      <li>
        <Link
          href="/"
          className="p-2 border-2 dark:border-white border-black-100 dark:hover:border-neutral-500 dark:[&>svg]:hover:fill-neutral-500 hover:border-neutral-500 [&>svg]:hover:fill-neutral-500 transition duration-300 rounded-lg flex items-center justify-center"
        >
          <FaInstagram className="size-6 dark:fill-white fill-black-100 transition duration-300" />
        </Link>
      </li>
      <li>
        <Link
          href="/"
          className="p-2 border-2 dark:border-white border-black-100 dark:hover:border-neutral-500 dark:[&>svg]:hover:fill-neutral-500 hover:border-neutral-500 [&>svg]:hover:fill-neutral-500 transition duration-300 rounded-lg flex items-center justify-center"
        >
          <FaGithub className="size-6 dark:fill-white fill-black-100 transition duration-300" />
        </Link>
      </li>
      <li>
        <Link
          href="/"
          className="p-2 border-2 dark:border-white border-black-100 dark:hover:border-neutral-500 dark:[&>svg]:hover:fill-neutral-500 hover:border-neutral-500 [&>svg]:hover:fill-neutral-500 transition duration-300 rounded-lg flex items-center justify-center"
        >
          <FaTelegram className="size-6 dark:fill-white fill-black-100 transition duration-300" />
        </Link>
      </li>
      <li>
        <Link
          href="/"
          className="p-2 border-2 dark:border-white border-black-100 dark:hover:border-neutral-500 dark:[&>svg]:hover:fill-neutral-500 hover:border-neutral-500 [&>svg]:hover:fill-neutral-500 transition duration-300 rounded-lg flex items-center justify-center"
        >
          <FaLinkedin className="size-6 dark:fill-white fill-black-100 transition duration-300" />
        </Link>
      </li>
    </ul>
  );
}
export default Socials;

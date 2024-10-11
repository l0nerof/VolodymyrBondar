import Link from "next/link";
import { FaGithub, FaInstagram, FaLinkedin, FaTelegram } from "react-icons/fa";

function Socials() {
  return (
    <ul className="flex items-center justify-center gap-4">
      <li>
        <Link
          href="/"
          className="p-2 border-2 rounded-lg flex items-center justify-center"
        >
          <FaInstagram className="size-6 fill-white" />
        </Link>
      </li>
      <li>
        <Link
          href="/"
          className="p-2 border-2 rounded-lg flex items-center justify-center"
        >
          <FaGithub className="size-6 fill-white" />
        </Link>
      </li>
      <li>
        <Link
          href="/"
          className="p-2 border-2 rounded-lg flex items-center justify-center"
        >
          <FaTelegram className="size-6 fill-white" />
        </Link>
      </li>
      <li>
        <Link
          href="/"
          className="p-2 border-2 rounded-lg flex items-center justify-center"
        >
          <FaLinkedin className="size-6 fill-white" />
        </Link>
      </li>
    </ul>
  );
}
export default Socials;

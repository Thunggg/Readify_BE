import Link from "next/link";
import { ModeToggle } from "./toggle-theme";
import ButtonLogout from "./button-logout";

export default function Header() {
  return (
      <div className="flex justify-between items-center p-4">
        <ul className="flex gap-4">
            <li>
                <Link href="/" className="text-lg font-bold">Home</Link>
            </li>
            <li>
                <Link href="/about" className="text-lg font-bold">About</Link>
            </li>
            <li>
                <Link href="/contact" className="text-lg font-bold">Contact</Link>
            </li>
            <li>
                <Link href="/me" className="text-lg font-bold">Profile</Link>
                <ButtonLogout />
            </li>
            <li><ModeToggle /></li>
        </ul>
      </div>
  )
}
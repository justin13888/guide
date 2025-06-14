import { User } from '@geist-ui/icons'
import Link from 'next/link';
import { auth } from '~/server/auth';

export default async function NavBar() {
    const session = await auth();


    return (
        <nav className="bg-white w-full h-[60px] px-8 flex items-center justify-between border-b-2 border-gray-200">
            <div className="text-l font-semibold">
                UWGuide
            </div>
            <div className="border border-gray-300 rounded-full p-2">
                <User size={12} fill="#E5E7EB" stroke="#E5E7EB" />
            </div>
            {/* <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-center text-2xl text-white">
                {session && <span>Logged in as {session.user?.name}</span>}
            </p>
            <Link
                href={session ? "/api/auth/signout" : "/api/auth/signin"}
                className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
            >
                {session ? "Sign out" : "Sign in"}
            </Link>
            </div> */}
            {/* TODO: Style ^^ oops */}
        </nav>
    )
}

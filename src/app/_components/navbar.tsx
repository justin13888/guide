import { User } from '@geist-ui/icons'

export default async function NavBar() {
    return (
        <nav className="bg-white w-full h-20 px-8 flex items-center justify-between border-b-2 border-gray-200">
            <div className="text-xl font-semibold">
                UWGuide
            </div>
            <div className="border border-gray-300 rounded-full p-2">
                <User size={24} fill="#E5E7EB" stroke="#E5E7EB" />
            </div>
        </nav>
    )
}
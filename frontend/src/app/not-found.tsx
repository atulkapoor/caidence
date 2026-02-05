import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Not Found</h2>
            <p className="text-slate-600 mb-8">Could not find requested resource</p>
            <Link href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Return Home
            </Link>
        </div>
    )
}
